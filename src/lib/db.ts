// Supabase 数据同步层
// 负责 TS 类型 ↔ DB 行的转换、全量加载、增量同步
// 未配置 Supabase 时所有函数 no-op，应用降级为纯 localStorage 模式

import { supabase, isSupabaseConfigured } from "./supabase";

// 从当前 Supabase session 获取 user_id（确保与 RLS auth.uid() 完全一致）
// 不再缓存，每次同步时实时读取，避免 session 刷新后 user_id 不一致导致 RLS 403
async function getAuthUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

import type {
  AIObservation,
  ADHDSubtype,
  AppMode,
  CaptureItem,
  CheckIn,
  CollaboratorRole,
  ConnectionMoment,
  CrashMark,
  DifficultyType,
  NeuroType,
  PersonalRule,
  Protocol,
  ProtocolExecution,
  SessionMode,
  SupportRule,
  TraitProfile,
  WeatherSnapshot,
} from "@/types";
import type { Lang } from "./translations";
import type { SoundType } from "./soundEngine";

// ============ 从 DB 行 → TS 类型 ============

function rowToCheckin(row: Record<string, unknown>): CheckIn {
  return {
    id: row.id as string,
    axis_sensory: row.axis_sensory as number,
    axis_social: row.axis_social as number,
    axis_predictability: row.axis_predictability as number,
    hesitation_ms: row.hesitation_ms as number,
    checkin_at: row.checkin_at as string,
    response_delay_minutes: row.response_delay_minutes as number,
    weather_snapshot: row.weather_snapshot as WeatherSnapshot,
    note: (row.note as string) || undefined,
    early_signals: (row.early_signals as string[]) || undefined,
  };
}

function rowToProtocol(row: Record<string, unknown>): Protocol {
  return {
    id: row.id as string,
    trigger: row.trigger as Protocol["trigger"],
    action: row.action as Protocol["action"],
    source: row.source as Protocol["source"],
    status: row.status as Protocol["status"],
    phases: (row.phases as Protocol["phases"]) || undefined,
    execution_count: row.execution_count as number,
    last_executed_at: (row.last_executed_at as string) || null,
    created_at: row.created_at as string,
  };
}

function rowToExecution(row: Record<string, unknown>): ProtocolExecution {
  return {
    id: row.id as string,
    protocol_id: row.protocol_id as string,
    triggered_at: row.triggered_at as string,
    executed_at: row.executed_at as string,
    action_taken: row.action_taken as ProtocolExecution["action_taken"],
    duration_actual_minutes: row.duration_actual_minutes as number,
    feedback: (row.feedback as ProtocolExecution["feedback"]) || undefined,
  };
}

function rowToCrashMark(row: Record<string, unknown>): CrashMark {
  return {
    id: row.id as string,
    marked_at: row.marked_at as string,
    voice_text: (row.voice_text as string) || undefined,
    raw_text: (row.raw_text as string) || undefined,
    ai_interpretation: (row.ai_interpretation as CrashMark["ai_interpretation"]) || undefined,
    weather_snapshot: (row.weather_snapshot as WeatherSnapshot) || undefined,
    reviewed: row.reviewed as boolean,
    crash_type: (row.crash_type as CrashMark["crash_type"]) || undefined,
    trigger_cues: (row.trigger_cues as CrashMark["trigger_cues"]) || undefined,
  };
}

function rowToPersonalRule(row: Record<string, unknown>): PersonalRule {
  return {
    id: row.id as string,
    signal: row.signal as string,
    understanding: row.understanding as string,
    support: row.support as string,
    evidence_count: row.evidence_count as number,
    last_feedback: (row.last_feedback as PersonalRule["last_feedback"]) || undefined,
    last_feedback_at: (row.last_feedback_at as string) || undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToConnectionMoment(row: Record<string, unknown>): ConnectionMoment {
  return {
    id: row.id as string,
    rule_id: row.rule_id as string,
    mode: row.mode as ConnectionMoment["mode"],
    connected_at: row.connected_at as string,
    feedback: (row.feedback as ConnectionMoment["feedback"]) || undefined,
  };
}

function rowToCaptureItem(row: Record<string, unknown>): CaptureItem {
  return {
    id: row.id as string,
    text: row.text as string,
    status: row.status as CaptureItem["status"],
    created_at: row.created_at as string,
    focus_started_at: (row.focus_started_at as string) || undefined,
    completed_at: (row.completed_at as string) || undefined,
  };
}

// ============ 从 TS 类型 → DB 行 ============

function checkinToRow(c: CheckIn): Record<string, unknown> {
  return {
    id: c.id,
    axis_sensory: c.axis_sensory,
    axis_social: c.axis_social,
    axis_predictability: c.axis_predictability,
    hesitation_ms: c.hesitation_ms,
    checkin_at: c.checkin_at,
    response_delay_minutes: c.response_delay_minutes,
    weather_snapshot: c.weather_snapshot,
    note: c.note ?? null,
    early_signals: c.early_signals ?? [],
  };
}

function protocolToRow(p: Protocol): Record<string, unknown> {
  return {
    id: p.id,
    trigger: p.trigger,
    action: p.action,
    source: p.source,
    status: p.status,
    phases: p.phases ?? [],
    execution_count: p.execution_count,
    last_executed_at: p.last_executed_at,
    created_at: p.created_at,
  };
}

function executionToRow(e: ProtocolExecution): Record<string, unknown> {
  return {
    id: e.id,
    protocol_id: e.protocol_id,
    triggered_at: e.triggered_at,
    executed_at: e.executed_at,
    action_taken: e.action_taken,
    duration_actual_minutes: e.duration_actual_minutes,
    feedback: e.feedback ?? null,
  };
}

function crashMarkToRow(c: CrashMark): Record<string, unknown> {
  return {
    id: c.id,
    marked_at: c.marked_at,
    voice_text: c.voice_text ?? null,
    raw_text: c.raw_text ?? null,
    ai_interpretation: c.ai_interpretation ?? null,
    weather_snapshot: c.weather_snapshot ?? null,
    reviewed: c.reviewed,
    crash_type: c.crash_type ?? null,
    trigger_cues: c.trigger_cues ?? [],
  };
}

function personalRuleToRow(r: PersonalRule): Record<string, unknown> {
  return {
    id: r.id,
    signal: r.signal,
    understanding: r.understanding,
    support: r.support,
    evidence_count: r.evidence_count,
    last_feedback: r.last_feedback ?? null,
    last_feedback_at: r.last_feedback_at ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function connectionMomentToRow(m: ConnectionMoment): Record<string, unknown> {
  return {
    id: m.id,
    rule_id: m.rule_id,
    mode: m.mode,
    connected_at: m.connected_at,
    feedback: m.feedback ?? null,
  };
}

function captureItemToRow(c: CaptureItem): Record<string, unknown> {
  return {
    id: c.id,
    text: c.text,
    status: c.status,
    created_at: c.created_at,
    focus_started_at: c.focus_started_at ?? null,
    completed_at: c.completed_at ?? null,
  };
}

// ============ 同步载荷类型 ============

export interface SyncPayload {
  onboarded: boolean;
  neuroType: NeuroType;
  adhdSubtype: ADHDSubtype;
  appMode: AppMode;
  collaborator: CollaboratorRole;
  qwenEnabled: boolean;
  lowSensoryMode: boolean;
  language: Lang;
  sessionMode: SessionMode;
  lastDifficultyType: DifficultyType | null;
  supportRules: SupportRule[];
  soundScapeType: SoundType | null;
  soundScapeVolume: number;
  soundScapeEnabled: boolean;
  observation: AIObservation | null;
  connectionPreferences: string[];
  traitProfile: TraitProfile | null;
  currentWeather: WeatherSnapshot;
  checkins: CheckIn[];
  protocols: Protocol[];
  executions: ProtocolExecution[];
  crashMarks: CrashMark[];
  personalRules: PersonalRule[];
  connectionMoments: ConnectionMoment[];
  captureItems: CaptureItem[];
}

// ============ 全量加载 ============

export async function loadAllData(): Promise<Partial<SyncPayload> | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  const [
    settingsRes,
    checkinsRes,
    protocolsRes,
    executionsRes,
    crashMarksRes,
    personalRulesRes,
    connectionMomentsRes,
    captureItemsRes,
  ] = await Promise.all([
    supabase.from("user_settings").select("*").maybeSingle(),
    supabase.from("checkins").select("*").order("checkin_at", { ascending: true }),
    supabase.from("protocols").select("*").order("created_at", { ascending: true }),
    supabase.from("protocol_executions").select("*").order("triggered_at", { ascending: true }),
    supabase.from("crash_marks").select("*").order("marked_at", { ascending: true }),
    supabase.from("personal_rules").select("*").order("created_at", { ascending: true }),
    supabase.from("connection_moments").select("*").order("connected_at", { ascending: true }),
    supabase.from("capture_items").select("*").order("created_at", { ascending: true }),
  ]);

  // 如果没有设置行，说明是新用户
  if (!settingsRes.data) return null;

  const s = settingsRes.data;
  return {
    onboarded: s.onboarded ?? false,
    neuroType: s.neuro_type ?? "asd",
    adhdSubtype: s.adhd_subtype ?? "unknown",
    appMode: s.app_mode ?? "self",
    collaborator: s.collaborator ?? "self",
    qwenEnabled: s.qwen_enabled ?? false,
    lowSensoryMode: s.low_sensory_mode ?? false,
    language: s.language ?? "zh",
    sessionMode: s.session_mode ?? "normal",
    lastDifficultyType: s.last_difficulty_type ?? null,
    supportRules: s.support_rules ?? [],
    soundScapeType: s.sound_scape_type ?? null,
    soundScapeVolume: s.sound_scape_volume ?? 0.3,
    soundScapeEnabled: s.sound_scape_enabled ?? false,
    observation: s.observation ?? null,
    connectionPreferences: s.connection_preferences ?? [],
    traitProfile: s.trait_profile ?? null,
    currentWeather: s.current_weather ?? null,
    checkins: (checkinsRes.data ?? []).map(rowToCheckin),
    protocols: (protocolsRes.data ?? []).map(rowToProtocol),
    executions: (executionsRes.data ?? []).map(rowToExecution),
    crashMarks: (crashMarksRes.data ?? []).map(rowToCrashMark),
    personalRules: (personalRulesRes.data ?? []).map(rowToPersonalRule),
    connectionMoments: (connectionMomentsRes.data ?? []).map(rowToConnectionMoment),
    captureItems: (captureItemsRes.data ?? []).map(rowToCaptureItem),
  };
}

// ============ 增量同步 ============

// 同步单张数组表：delete + insert 模式
// 不用 upsert ON CONFLICT DO UPDATE，因为它在 id 冲突时会检查旧行的 USING 策略，
// 当冲突行属于其他匿名用户（换浏览器/清 session 后新匿名账号与旧数据 id 冲突）时，
// USING 失败导致 RLS 403。改用 delete 当前用户所有行 + insert(ignoreDuplicates) 彻底避免。
async function syncArray<T extends { id: string }>(
  table: string,
  items: T[],
  toRow: (item: T) => Record<string, unknown>,
  userId: string,
) {
  if (!supabase) return;

  // 1. Delete 当前用户的所有行（RLS USING 自动限制只删 auth.uid() = user_id 的行）
  // 用 neq("id", "___never___") 作为 filter 满足 Supabase 客户端 delete 必须有 filter 的要求
  const { error: delErr } = await supabase.from(table).delete().neq("id", "___never___");
  if (delErr) {
    console.warn(`[SyncSpace] ${table} delete 失败:`, delErr.message);
  }

  // 2. Insert 新行，ignoreDuplicates 跳过与其他用户 id 冲突的行（ON CONFLICT DO NOTHING）
  // 这样不触发 USING 检查，彻底避免 RLS 403
  if (items.length > 0) {
    const rows = items.map((item) => ({ ...toRow(item), user_id: userId }));
    const { error: insErr } = await supabase
      .from(table)
      .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (insErr) {
      console.warn(`[SyncSpace] ${table} insert 部分失败:`, insErr.message);
    }
  }
}

// 同步 user_settings 单行
async function syncSettings(payload: SyncPayload, userId: string) {
  if (!supabase) return;

  await supabase.from("user_settings").upsert({
    user_id: userId,
    onboarded: payload.onboarded,
    neuro_type: payload.neuroType,
    adhd_subtype: payload.adhdSubtype,
    app_mode: payload.appMode,
    collaborator: payload.collaborator,
    qwen_enabled: payload.qwenEnabled,
    low_sensory_mode: payload.lowSensoryMode,
    language: payload.language,
    session_mode: payload.sessionMode,
    last_difficulty_type: payload.lastDifficultyType,
    support_rules: payload.supportRules,
    sound_scape_type: payload.soundScapeType,
    sound_scape_volume: payload.soundScapeVolume,
    sound_scape_enabled: payload.soundScapeEnabled,
    observation: payload.observation,
    connection_preferences: payload.connectionPreferences,
    trait_profile: payload.traitProfile,
    current_weather: payload.currentWeather,
  }, { onConflict: "user_id" });
}

// 全量同步（debounced 调用）
export async function syncAllData(payload: SyncPayload): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;

  // 每次同步前实时获取 user_id，确保与 RLS auth.uid() 完全一致
  // 避免 session 刷新后缓存值过期导致 RLS 403
  const userId = await getAuthUserId();
  if (!userId) {
    console.warn("[SyncSpace] 无有效 session，跳过同步");
    return;
  }

  try {
    await Promise.all([
      syncSettings(payload, userId),
      syncArray("checkins", payload.checkins, checkinToRow, userId),
      syncArray("protocols", payload.protocols, protocolToRow, userId),
      syncArray("protocol_executions", payload.executions, executionToRow, userId),
      syncArray("crash_marks", payload.crashMarks, crashMarkToRow, userId),
      syncArray("personal_rules", payload.personalRules, personalRuleToRow, userId),
      syncArray("connection_moments", payload.connectionMoments, connectionMomentToRow, userId),
      syncArray("capture_items", payload.captureItems, captureItemToRow, userId),
    ]);
  } catch (err) {
    console.warn("[SyncSpace] 同步到 Supabase 失败（本地数据不受影响）:", err);
  }
}

// 清空云端数据（resetAll 时调用）
export async function clearCloudData(): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;

  try {
    await Promise.all([
      supabase.from("checkins").delete().neq("id", "___never___"),
      supabase.from("protocols").delete().neq("id", "___never___"),
      supabase.from("protocol_executions").delete().neq("id", "___never___"),
      supabase.from("crash_marks").delete().neq("id", "___never___"),
      supabase.from("personal_rules").delete().neq("id", "___never___"),
      supabase.from("connection_moments").delete().neq("id", "___never___"),
      supabase.from("capture_items").delete().neq("id", "___never___"),
      supabase.from("user_settings").delete().neq("user_id", "___never___"),
    ]);
  } catch (err) {
    console.warn("[SyncSpace] 清空云端数据失败:", err);
  }
}
