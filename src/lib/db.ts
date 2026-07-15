// Supabase 数据同步层
// 负责 TS 类型 ↔ DB 行的转换、全量加载、增量同步
// 未配置 Supabase 时所有函数 no-op，应用降级为纯 localStorage 模式

import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  AIObservation,
  ADHDSubtype,
  AppMode,
  CaptureItem,
  CheckIn,
  CollaboratorRole,
  ConnectionMoment,
  CrashMark,
  NeuroType,
  PersonalRule,
  Protocol,
  ProtocolExecution,
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

// 同步单张数组表：upsert 当前数据 + delete 已删除的数据
async function syncArray<T extends { id: string }>(
  table: string,
  items: T[],
  toRow: (item: T) => Record<string, unknown>,
) {
  if (!supabase) return;

  const currentIds = items.map((i) => i.id);

  // 查询现有 ID，计算需要删除的
  const { data: existing } = await supabase.from(table).select("id");
  const existingIds = (existing?.map((r) => r.id as string)) ?? [];
  const removedIds = existingIds.filter((id) => !currentIds.includes(id));

  if (removedIds.length > 0) {
    await supabase.from(table).delete().in("id", removedIds);
  }

  // Upsert 当前数据
  if (items.length > 0) {
    await supabase.from(table).upsert(items.map(toRow), { onConflict: "id" });
  }
}

// 同步 user_settings 单行
async function syncSettings(payload: SyncPayload) {
  if (!supabase) return;

  await supabase.from("user_settings").upsert({
    onboarded: payload.onboarded,
    neuro_type: payload.neuroType,
    adhd_subtype: payload.adhdSubtype,
    app_mode: payload.appMode,
    collaborator: payload.collaborator,
    qwen_enabled: payload.qwenEnabled,
    low_sensory_mode: payload.lowSensoryMode,
    language: payload.language,
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

  try {
    await Promise.all([
      syncSettings(payload),
      syncArray("checkins", payload.checkins, checkinToRow),
      syncArray("protocols", payload.protocols, protocolToRow),
      syncArray("protocol_executions", payload.executions, executionToRow),
      syncArray("crash_marks", payload.crashMarks, crashMarkToRow),
      syncArray("personal_rules", payload.personalRules, personalRuleToRow),
      syncArray("connection_moments", payload.connectionMoments, connectionMomentToRow),
      syncArray("capture_items", payload.captureItems, captureItemToRow),
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
