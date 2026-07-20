import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AIObservation,
  ADHDSubtype,
  AppMode,
  CheckIn,
  CaptureItem,
  CollaboratorRole,
  ConnectionMoment,
  CrashMark,
  DifficultyType,
  NeuroType,
  PersonalRule,
  Protocol,
  ProtocolExecution,
  ScaleResult,
  SessionMode,
  SupportRule,
  ToastMessage,
  TraitProfile,
  WeatherSnapshot,
  WearableConnectionStatus,
  WearableContextSignal,
  WearableMode,
  WearableProvider,
  WearableSignalRecord,
} from "@/types";
import { generateWeather, defaultWeather } from "@/lib/weatherEngine";
import { matchTriggers } from "@/lib/triggerEngine";
import { detectPhase } from "@/lib/stageEngine";
import type { Lang } from "@/lib/translations";
import type { SoundType } from "@/lib/soundEngine";
import { genId } from "@/lib/format";
import { clearCloudData } from "@/lib/db";

// 协议触发推送状态
export interface ActiveTrigger {
  protocol: Protocol;
  reason: string;
  triggeredAt: string;
}

interface StoreState {
  // 用户状态
  onboarded: boolean;
  neuroType: NeuroType;
  adhdSubtype: ADHDSubtype; // ADHD 子类型（仅 neuroType === "adhd" 时有意义）
  appMode: AppMode; // 自主签到 / 家长代理签到
  checkinTimes: { morning: string; noon: string; evening: string };

  // 数据
  checkins: CheckIn[];
  protocols: Protocol[];
  executions: ProtocolExecution[];
  crashMarks: CrashMark[];
  observation: AIObservation | null;
  personalRules: PersonalRule[];
  connectionMoments: ConnectionMoment[];
  connectionPreferences: string[];
  captureItems: CaptureItem[];
  ruleSeed: string | null;

  // 当前天气卡
  currentWeather: WeatherSnapshot;

  // 协议触发（PRD §07：每日上限 3 次）
  activeTrigger: ActiveTrigger | null;
  triggerCountToday: number;
  triggerDateKey: string; // 用于每日重置
  // 推迟后等待重弹的触发器（含重弹时间戳）
  postponedTrigger: { trigger: ActiveTrigger; fireAfter: string } | null;

  // 神经特质自评画像（PRD §11 非诊断 · 补充画像）
  traitProfile: TraitProfile | null;

  // 协议参与者（PRD §02 自主性阶段 · "谁参与你的协议"）
  // "self" → 半自主阶段（当前 Demo 形态）；其他 → 共管阶段（架构已支持）
  collaborator: CollaboratorRole;

  // Qwen 多模态功能开关（语音签到/语音补记/环境扫描/智能建议）
  // 合规：不涉及生物识别（人脸表情/声纹情绪），仅 ASR + 环境图片 + 文本语义
  qwenEnabled: boolean;

  // 低感官模式（PRD §03 感官安全 · 神经多样性友好设计）
  // 开启后降级装饰性动效、降低色彩饱和度、减少阴影
  // 对光敏感/前庭敏感/HSP 用户尤为重要（WCAG 2.3.3 · Microsoft Inclusive Design）
  lowSensoryMode: boolean;
  // 可选阅读减负：增大正文/按钮文字并增加行距，不改变内容语义
  readingAidEnabled: boolean;
  language: Lang;

  // 可选设备辅助；不保存生理原始数据，纯软件路径始终可用
  wearableMode: WearableMode;
  wearableProvider: WearableProvider;
  wearableConnectionStatus: WearableConnectionStatus;
  pendingWearableSignal: WearableContextSignal | null;
  wearableSignalRecords: WearableSignalRecord[];

  // 会话模式（专注/低感官/恢复 · 重构后的统一模式系统）
  sessionMode: SessionMode;
  // 上次选择的困难类型（记住偏好 · neuroType 影响默认排序但不锁死）
  lastDifficultyType: DifficultyType | null;
  // 支持规则（合并个人规则 + 协议 · 统一模型）
  supportRules: SupportRule[];

  // 音景偏好（Web Audio API · 零版权 · 程序生成）
  soundScapeType: SoundType | null; // null = 未播放
  soundScapeVolume: number; // 0-1
  soundScapeEnabled: boolean;

  // 协议执行效果反馈（PRD §09 反馈闭环 · 执行后延时询问是否有效）
  pendingFeedbackExecId: string | null;

  // PWA 每日锚点提醒（早/午/晚 3 个时点 · Notification API）
  reminderEnabled: boolean;
  reminderTimes: { morning: string; noon: string; evening: string };
  setReminderEnabled: (enabled: boolean) => void;
  setReminderTimes: (times: { morning: string; noon: string; evening: string }) => void;

  // 神经特质新手引导（首次进入 Today 显示一次）
  hasSeenNeuroGuide: boolean;
  setHasSeenNeuroGuide: (seen: boolean) => void;

  // 各页面首次进入引导（轻量单步卡片 · 不同步云端 · 每个设备首次显示）
  seenPageGuides: Record<string, boolean>;
  setSeenPageGuide: (page: string, seen: boolean) => void;

  // 兴趣沉浸计时（ASD 能量来源 · 不只是追卡住也追充电）
  interestSessions: { id: string; topic: string; started_at: string; duration_sec: number }[];
  addInterestSession: (topic: string, durationSec: number) => void;

  // Toast（PRD §09：所有保存/操作成功或失败都有轻量 toast）
  toasts: ToastMessage[];

  // 操作
  setOnboarded: (neuroType: NeuroType) => void;
  setAdhdSubtype: (subtype: ADHDSubtype) => void;
  setCollaborator: (role: CollaboratorRole) => void;
  setAppMode: (mode: AppMode) => void;
  setQwenEnabled: (enabled: boolean) => void;
  setLowSensoryMode: (enabled: boolean) => void;
  setReadingAidEnabled: (enabled: boolean) => void;
  setWearableMode: (mode: WearableMode) => void;
  setWearableProvider: (provider: WearableProvider) => void;
  setWearableConnectionStatus: (status: WearableConnectionStatus) => void;
  setPendingWearableSignal: (signal: WearableContextSignal | null) => void;
  confirmWearableSignal: (feedback: "relevant" | "not_relevant") => void;
  setLanguage: (lang: Lang) => void;
  setSoundScape: (type: SoundType | null, volume?: number) => void;
  setSoundScapeVolume: (volume: number) => void;
  stopSoundScape: () => void;
  addCheckIn: (
    sensory: number,
    social: number,
    predictability: number,
    hesitationMs: number,
    extras?: { note?: string; early_signals?: string[] },
  ) => CheckIn;
  addProtocol: (
    protocol: Omit<Protocol, "id" | "execution_count" | "last_executed_at" | "created_at">,
  ) => void;
  updateProtocol: (id: string, updates: Partial<Protocol>) => void;
  toggleProtocolStatus: (id: string) => void;
  acceptCandidateProtocol: (id: string) => void;
  deleteProtocol: (id: string) => void;
  executeProtocol: (id: string) => void;
  postponeProtocol: (id: string) => void;
  checkPostponedTrigger: () => void;
  dismissTrigger: () => void;
  setActiveTrigger: (trigger: ActiveTrigger) => void;
  submitFeedback: (
    execId: string,
    feedback: "helpful" | "neutral" | "unhelpful",
  ) => void;
  dismissFeedback: () => void;
  getMinutesSinceLastCheckin: () => number;
  addCrashMark: (
    voiceText?: string,
    extras?: {
      crash_type?: import("@/types").CrashType;
      trigger_cues?: { type: import("@/types").TriggerCueType; description: import("@/types").LocalText }[];
    },
  ) => string;
  updateCrashMark: (id: string, updates: Partial<CrashMark>) => void;
  acceptObservation: () => void;
  ignoreObservation: () => void;
  setObservation: (obs: AIObservation) => void;
  addPersonalRule: (rule: Pick<PersonalRule, "signal" | "understanding" | "support">) => void;
  updatePersonalRule: (id: string, updates: Pick<PersonalRule, "signal" | "understanding" | "support">) => void;
  reinforcePersonalRule: (id: string) => void;
  deletePersonalRule: (id: string) => void;
  recordConnection: (ruleId: string, mode: ConnectionMoment["mode"]) => void;
  setConnectionPreferences: (preferences: string[]) => void;
  submitRuleFeedback: (ruleId: string, feedback: "helpful" | "unhelpful") => void;
  addCapture: (text: string) => void;
  focusCapture: (id: string) => void;
  startCaptureTimer: (id: string) => void;
  completeCapture: (id: string) => void;
  returnCaptureToInbox: (id: string) => void;
  seedRuleFromCapture: (id: string) => void;
  clearRuleSeed: () => void;
  saveTraitResult: (result: ScaleResult) => void;
  pushToast: (type: ToastMessage["type"], text: string) => void;
  dismissToast: (id: string) => void;
  resetAll: () => void;

  // 会话模式 + 困难类型
  setSessionMode: (mode: SessionMode) => void;
  setLastDifficultyType: (type: DifficultyType | null) => void;

  // 支持规则（合并模型）
  addSupportRule: (rule: Pick<SupportRule, "trigger" | "action" | "difficultyType" | "understanding" | "phases">) => void;
  updateSupportRule: (id: string, updates: Partial<SupportRule>) => void;
  deleteSupportRule: (id: string) => void;
  executeSupportRule: (id: string) => void;
  submitSupportRuleFeedback: (id: string, feedback: "helpful" | "neutral" | "unhelpful") => void;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      neuroType: "asd",
      adhdSubtype: "unknown",
      appMode: "self",
      checkinTimes: { morning: "09:00", noon: "14:00", evening: "20:00" },

      checkins: [],
      protocols: [],
      executions: [],
      crashMarks: [],
      observation: null,
      personalRules: [],
      connectionMoments: [],
      connectionPreferences: [],
      captureItems: [],
      ruleSeed: null,

      currentWeather: defaultWeather(),

      activeTrigger: null,
      postponedTrigger: null,
      triggerCountToday: 0,
      triggerDateKey: todayKey(),

      traitProfile: null,

      collaborator: "self",

      qwenEnabled: false,

      lowSensoryMode: false,
      readingAidEnabled: false,
      language: "zh" as Lang,
      wearableMode: "software_only" as WearableMode,
      wearableProvider: "huawei_health" as WearableProvider,
      wearableConnectionStatus: "not_connected" as WearableConnectionStatus,
      pendingWearableSignal: null,
      wearableSignalRecords: [],

      // 重构：会话模式 + 困难类型 + 支持规则
      sessionMode: "normal" as SessionMode,
      lastDifficultyType: null,
      supportRules: [],

      // 音景初始状态：未播放，音量 0.3
      soundScapeType: null,
      soundScapeVolume: 0.3,
      soundScapeEnabled: false,

      pendingFeedbackExecId: null,

      // PWA 提醒：默认开（如系统不支持会静默失败）
      reminderEnabled: false,
      reminderTimes: { morning: "09:00", noon: "14:00", evening: "20:00" },
      setReminderEnabled: (enabled) => set({ reminderEnabled: enabled }),
      setReminderTimes: (times) => set({ reminderTimes: times }),

      // 神经特质新手引导
      hasSeenNeuroGuide: false,
      setHasSeenNeuroGuide: (seen) => set({ hasSeenNeuroGuide: seen }),

      // 各页面首次进入引导
      seenPageGuides: {},
      setSeenPageGuide: (page, seen) =>
        set((state) => ({
          seenPageGuides: { ...state.seenPageGuides, [page]: seen },
        })),

      // 兴趣沉浸记录
      interestSessions: [],
      addInterestSession: (topic, durationSec) =>
        set((state) => ({
          interestSessions: [
            ...state.interestSessions,
            {
              id: genId("interest"),
              topic,
              started_at: new Date().toISOString(),
              duration_sec: durationSec,
            },
          ],
        })),

      toasts: [],

      setOnboarded: (neuroType) => {
        set({ onboarded: true, neuroType });
        get().pushToast("success", "设置完成，欢迎来到你的内在气候");
      },

      setAdhdSubtype: (subtype) => set({ adhdSubtype: subtype }),

      setCollaborator: (role) => set({ collaborator: role }),

      setAppMode: (mode) => set({ appMode: mode }),

      setQwenEnabled: (enabled) => set({ qwenEnabled: enabled }),

      setLowSensoryMode: (enabled) => set({ lowSensoryMode: enabled }),
      setReadingAidEnabled: (enabled) => set({ readingAidEnabled: enabled }),
      setWearableMode: (mode) => set({
        wearableMode: mode,
        ...(mode === "software_only"
          ? { wearableConnectionStatus: "not_connected" as const, pendingWearableSignal: null }
          : {}),
      }),
      setWearableProvider: (provider) => set({ wearableProvider: provider }),
      setWearableConnectionStatus: (status) => set({ wearableConnectionStatus: status }),
      setPendingWearableSignal: (signal) => set({ pendingWearableSignal: signal }),
      confirmWearableSignal: (feedback) => set((state) => {
        if (!state.pendingWearableSignal) return state;
        return {
          pendingWearableSignal: null,
          wearableSignalRecords: [
            ...state.wearableSignalRecords,
            {
              ...state.pendingWearableSignal,
              id: genId("wearable-signal"),
              user_feedback: feedback,
              confirmed_at: new Date().toISOString(),
            },
          ],
        };
      }),
      setLanguage: (lang) => set({ language: lang }),

      setSoundScape: (type, volume) => {
        if (type === null) {
          set({ soundScapeType: null, soundScapeEnabled: false });
        } else {
          set({
            soundScapeType: type,
            soundScapeEnabled: true,
            ...(volume !== undefined ? { soundScapeVolume: volume } : {}),
          });
        }
      },
      setSoundScapeVolume: (volume) => set({ soundScapeVolume: volume }),
      stopSoundScape: () => set({ soundScapeType: null, soundScapeEnabled: false }),

      addCheckIn: (sensory, social, predictability, hesitationMs, extras) => {
        const neuroType = get().neuroType;
        const weather = generateWeather(sensory, social, predictability, neuroType);
        // 模拟响应延迟：当前时间与最近一次签到通知的差
        const responseDelay = Math.floor(Math.random() * 30) + 5;
        const checkin: CheckIn = {
          id: genId("chk"),
          axis_sensory: sensory,
          axis_social: social,
          axis_predictability: predictability,
          hesitation_ms: hesitationMs,
          checkin_at: new Date().toISOString(),
          response_delay_minutes: responseDelay,
          weather_snapshot: weather,
          note: extras?.note,
          early_signals: extras?.early_signals,
        };
        set((state) => ({
          checkins: [...state.checkins, checkin],
          currentWeather: weather,
        }));

        // 触发引擎：检查协议是否命中（PRD §07）
        const { protocols, triggerCountToday, triggerDateKey } = get();
        const key = todayKey();
        const countToday = key === triggerDateKey ? triggerCountToday : 0;

        if (countToday < 3) {
          const currentPhase = detectPhase(
            weather.climate,
            get().crashMarks,
          );
          const result = matchTriggers(protocols, checkin, neuroType, currentPhase, get().checkins);
          if (result.matched && result.protocol) {
            set({
              activeTrigger: {
                protocol: result.protocol,
                reason: result.reason,
                triggeredAt: new Date().toISOString(),
              },
              triggerCountToday: countToday + 1,
              triggerDateKey: key,
            });
          }
        }

        return checkin;
      },

      addProtocol: (protocol) => {
        const newProtocol: Protocol = {
          ...protocol,
          id: genId("protocol"),
          execution_count: 0,
          last_executed_at: null,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ protocols: [newProtocol, ...state.protocols] }));
        get().pushToast("success", "协议已保存");
      },

      updateProtocol: (id, updates) => {
        set((state) => ({
          protocols: state.protocols.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        }));
        get().pushToast("success", "协议已更新");
      },

      toggleProtocolStatus: (id) => {
        set((state) => ({
          protocols: state.protocols.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: p.status === "active" ? "paused" : "active",
                }
              : p,
          ),
        }));
        const p = get().protocols.find((x) => x.id === id);
        get().pushToast(
          "success",
          p?.status === "paused" ? "协议已暂停" : "协议已恢复",
        );
      },

      acceptCandidateProtocol: (id) => {
        set((state) => ({
          protocols: state.protocols.map((p) =>
            p.id === id ? { ...p, status: "active" } : p,
          ),
        }));
        get().pushToast("success", "协议候选已接受，已加入你的协议库");
      },

      deleteProtocol: (id) => {
        set((state) => ({
          protocols: state.protocols.filter((p) => p.id !== id),
        }));
        get().pushToast("success", "协议已删除");
      },

      executeProtocol: (id) => {
        const now = new Date().toISOString();
        const protocol = get().protocols.find((p) => p.id === id);
        if (!protocol) return;
        const execution: ProtocolExecution = {
          id: genId("exec"),
          protocol_id: id,
          triggered_at: get().activeTrigger?.triggeredAt ?? now,
          executed_at: now,
          action_taken: "executed",
          duration_actual_minutes: protocol.action.duration_minutes,
        };
        set((state) => ({
          executions: [execution, ...state.executions],
          protocols: state.protocols.map((p) =>
            p.id === id
              ? {
                  ...p,
                  execution_count: p.execution_count + 1,
                  last_executed_at: now,
                }
              : p,
          ),
          activeTrigger: null,
        }));
        get().pushToast(
          "success",
          `协议已执行，开始 ${protocol.action.duration_minutes} 分钟计时`,
        );
        // 3 秒后弹出效果反馈（PRD §09 反馈闭环 · 不打断执行，仅轻量提示）
        setTimeout(() => {
          set({ pendingFeedbackExecId: execution.id });
        }, 3000);
      },

      postponeProtocol: (id) => {
        const now = Date.now();
        const fireAfter = new Date(now + 30 * 60 * 1000).toISOString();
        const currentTrigger = get().activeTrigger;
        set((state) => ({
          executions: [
            {
              id: genId("exec"),
              protocol_id: id,
              triggered_at: state.activeTrigger?.triggeredAt ?? new Date().toISOString(),
              executed_at: new Date().toISOString(),
              action_taken: "postponed" as const,
              duration_actual_minutes: 0,
            },
            ...state.executions,
          ],
          activeTrigger: null,
          // 保存推迟的触发器 · 30 分钟后重弹（PRD §07：先记后弹）
          postponedTrigger: currentTrigger ? { trigger: currentTrigger, fireAfter } : null,
        }));
        get().pushToast("info", "已推迟，30 分钟后再提醒你");
      },

      // 重弹检查：当当前时间 ≥ fireAfter 时，重新激活触发器（每日上限仍生效）
      checkPostponedTrigger: () => {
        const { postponedTrigger, activeTrigger, triggerCountToday, triggerDateKey } = get();
        if (!postponedTrigger || activeTrigger) return;
        if (Date.now() < new Date(postponedTrigger.fireAfter).getTime()) return;
        // 每日上限 3 次仍需遵守 · 超出则放弃重弹
        const key = todayKey();
        const countToday = key === triggerDateKey ? triggerCountToday : 0;
        if (countToday >= 3) {
          set({ postponedTrigger: null });
          return;
        }
        set({
          activeTrigger: {
            ...postponedTrigger.trigger,
            triggeredAt: new Date().toISOString(),
          },
          postponedTrigger: null,
          triggerCountToday: countToday + 1,
          triggerDateKey: key,
        });
      },

      dismissTrigger: () => set({ activeTrigger: null, postponedTrigger: null }),

      setActiveTrigger: (trigger) => set({ activeTrigger: trigger }),

      submitFeedback: (execId, feedback) => {
        set((state) => ({
          executions: state.executions.map((e) =>
            e.id === execId ? { ...e, feedback } : e,
          ),
          pendingFeedbackExecId: null,
        }));
        get().pushToast("success", "已记录，帮你下次更准");
      },

      dismissFeedback: () => set({ pendingFeedbackExecId: null }),

      getMinutesSinceLastCheckin: () => {
        const checkins = get().checkins;
        if (checkins.length === 0) return Infinity;
        const last = checkins[checkins.length - 1];
        const diff = Date.now() - new Date(last.checkin_at).getTime();
        return Math.floor(diff / 60_000);
      },

      addCrashMark: (voiceText, extras) => {
        const id = genId("crash");
        const now = new Date().toISOString();
        const crash: CrashMark = {
          id,
          marked_at: now,
          voice_text: voiceText,
          reviewed: false,
          weather_snapshot: get().currentWeather,
          crash_type: extras?.crash_type,
          trigger_cues: extras?.trigger_cues,
        };
        set((state) => ({ crashMarks: [crash, ...state.crashMarks] }));
        get().pushToast("success", "已记录，你随时可以晚点再来整理");
        return id;
      },

      updateCrashMark: (id, updates) => {
        set((state) => ({
          crashMarks: state.crashMarks.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        }));
      },

      acceptObservation: () => {
        const obs = get().observation;
        if (!obs) return;
        const newProtocol: Protocol = {
          id: genId("protocol"),
          trigger: {
            type: "behavior",
            description: obs.suggested_protocol.trigger_description,
          },
          action: {
            description: obs.suggested_protocol.action_description,
            duration_minutes: 0,
            timer: false,
          },
          source: "ai_suggestion",
          status: "candidate",
          execution_count: 0,
          last_executed_at: null,
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          protocols: [newProtocol, ...state.protocols],
          observation: { ...obs, status: "accepted" },
        }));
        get().pushToast("success", "已生成协议候选，待你确认");
      },

      ignoreObservation: () => {
        const obs = get().observation;
        if (!obs) return;
        set({ observation: { ...obs, status: "ignored" } });
        get().pushToast("info", "已忽略，下次观察不受影响");
      },

      setObservation: (obs) => set({ observation: obs }),

      addPersonalRule: (rule) => {
        const now = new Date().toISOString();
        set((state) => ({
          personalRules: [
            {
              ...rule,
              id: genId("rule"),
              evidence_count: 1,
              created_at: now,
              updated_at: now,
            },
            ...state.personalRules,
          ],
        }));
        get().pushToast("success", "已加入你的个人规则");
      },

      updatePersonalRule: (id, updates) => {
        set((state) => ({
          personalRules: state.personalRules.map((rule) =>
            rule.id === id
              ? { ...rule, ...updates, updated_at: new Date().toISOString() }
              : rule,
          ),
        }));
        get().pushToast("success", "这条理解已更新");
      },

      reinforcePersonalRule: (id) => {
        set((state) => ({
          personalRules: state.personalRules.map((rule) =>
            rule.id === id
              ? {
                  ...rule,
                  evidence_count: rule.evidence_count + 1,
                  updated_at: new Date().toISOString(),
                }
              : rule,
          ),
        }));
        get().pushToast("success", "已记下：这次也符合");
      },

      deletePersonalRule: (id) => {
        set((state) => ({
          personalRules: state.personalRules.filter((rule) => rule.id !== id),
        }));
        get().pushToast("info", "已移除这条旧理解");
      },

      recordConnection: (ruleId, mode) => {
        const now = new Date();
        const dayKey = now.toLocaleDateString("zh-CN");
        const alreadyRecorded = get().connectionMoments.some(
          (moment) =>
            moment.rule_id === ruleId &&
            moment.mode === mode &&
            new Date(moment.connected_at).toLocaleDateString("zh-CN") === dayKey,
        );
        if (alreadyRecorded) return;
        set((state) => ({
          connectionMoments: [
            {
              id: genId("connection"),
              rule_id: ruleId,
              mode,
              connected_at: now.toISOString(),
            },
            ...state.connectionMoments,
          ],
        }));
      },

      setConnectionPreferences: (connectionPreferences) => set({ connectionPreferences }),

      submitRuleFeedback: (ruleId, feedback) => {
        const now = new Date().toISOString();
        set((state) => ({
          personalRules: state.personalRules.map((rule) =>
            rule.id === ruleId
              ? {
                  ...rule,
                  evidence_count: feedback === "helpful" ? rule.evidence_count + 1 : rule.evidence_count,
                  last_feedback: feedback,
                  last_feedback_at: now,
                  updated_at: now,
                }
              : rule,
          ),
          connectionMoments: state.connectionMoments.map((moment) =>
            moment.rule_id === ruleId && !moment.feedback
              ? { ...moment, feedback }
              : moment,
          ),
        }));
      },

      addCapture: (text) => {
        const value = text.trim();
        if (!value) return;
        set((state) => ({
          captureItems: [
            ...state.captureItems,
            {
              id: genId("capture"),
              text: value,
              status: "inbox",
              created_at: new Date().toISOString(),
            },
          ],
        }));
      },

      focusCapture: (id) => {
        set((state) => ({
          captureItems: state.captureItems.map((item) =>
            item.id === id
              ? { ...item, status: "focus", focus_started_at: undefined }
              : item.status === "focus"
                ? { ...item, status: "inbox", focus_started_at: undefined }
                : item,
          ),
        }));
      },

      startCaptureTimer: (id) => {
        set((state) => ({
          captureItems: state.captureItems.map((item) =>
            item.id === id ? { ...item, focus_started_at: new Date().toISOString() } : item,
          ),
        }));
      },

      completeCapture: (id) => {
        set((state) => ({
          captureItems: state.captureItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "done",
                  focus_started_at: undefined,
                  completed_at: new Date().toISOString(),
                }
              : item,
          ),
        }));
      },

      returnCaptureToInbox: (id) => {
        set((state) => ({
          captureItems: state.captureItems.map((item) =>
            item.id === id
              ? { ...item, status: "inbox", focus_started_at: undefined }
              : item,
          ),
        }));
      },

      seedRuleFromCapture: (id) => {
        const item = get().captureItems.find((candidate) => candidate.id === id);
        if (!item) return;
        set((state) => ({
          ruleSeed: item.text,
          captureItems: state.captureItems.map((candidate) =>
            candidate.id === id
              ? { ...candidate, status: "done", completed_at: new Date().toISOString() }
              : candidate,
          ),
        }));
      },

      clearRuleSeed: () => set({ ruleSeed: null }),

      // 保存特质自评结果（PRD §11 非诊断 · 同量表重做则覆盖旧结果）
      saveTraitResult: (result) => {
        const existing = get().traitProfile;
        const otherResults = existing?.results.filter(
          (r) => r.scale_id !== result.scale_id,
        ) ?? [];
        const profile: TraitProfile = {
          results: [...otherResults, result],
          last_updated: new Date().toISOString(),
        };
        set({ traitProfile: profile });
        get().pushToast("success", "自评结果已保存到你的特质画像");
      },

      pushToast: (type, text) => {
        const toast: ToastMessage = { id: genId("toast"), type, text };
        set((state) => ({ toasts: [...state.toasts, toast] }));
        // 3 秒自动消失（PRD §09）
        setTimeout(() => {
          get().dismissToast(toast.id);
        }, 3000);
      },

      dismissToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      },

      // ============ 会话模式 + 困难类型 ============
      setSessionMode: (mode) => set({ sessionMode: mode }),
      setLastDifficultyType: (type) => set({ lastDifficultyType: type }),

      // ============ 支持规则（合并模型） ============
      addSupportRule: (rule) => {
        const now = new Date().toISOString();
        const newRule: SupportRule = {
          id: genId(),
          trigger: rule.trigger,
          action: rule.action,
          understanding: rule.understanding,
          difficultyType: rule.difficultyType,
          source: "manual",
          status: "active",
          phases: rule.phases,
          uses: 0,
          helpfulCount: 0,
          lastUsed: null,
          created_at: now,
        };
        set((state) => ({ supportRules: [...state.supportRules, newRule] }));
      },

      updateSupportRule: (id, updates) => {
        set((state) => ({
          supportRules: state.supportRules.map((r) =>
            r.id === id ? { ...r, ...updates } : r,
          ),
        }));
      },

      deleteSupportRule: (id) => {
        set((state) => ({
          supportRules: state.supportRules.filter((r) => r.id !== id),
        }));
      },

      executeSupportRule: (id) => {
        set((state) => ({
          supportRules: state.supportRules.map((r) =>
            r.id === id
              ? { ...r, uses: r.uses + 1, lastUsed: new Date().toISOString() }
              : r,
          ),
        }));
      },

      submitSupportRuleFeedback: (id, feedback) => {
        set((state) => ({
          supportRules: state.supportRules.map((r) =>
            r.id === id
              ? {
                  ...r,
                  lastFeedback: feedback,
                  helpfulCount: feedback === "helpful" ? r.helpfulCount + 1 : r.helpfulCount,
                }
              : r,
          ),
        }));
      },

      resetAll: () => {
        set({
          onboarded: false,
          neuroType: "asd",
          adhdSubtype: "unknown",
          appMode: "self",
          checkins: [],
          protocols: [],
          executions: [],
          crashMarks: [],
          observation: null,
          personalRules: [],
          connectionMoments: [],
          connectionPreferences: [],
          captureItems: [],
          ruleSeed: null,
          currentWeather: defaultWeather(),
          activeTrigger: null,
          postponedTrigger: null,
          triggerCountToday: 0,
          triggerDateKey: todayKey(),
          traitProfile: null,
          collaborator: "self",
          qwenEnabled: false,
          lowSensoryMode: false,
          readingAidEnabled: false,
          language: "zh" as Lang,
          wearableMode: "software_only" as WearableMode,
          wearableProvider: "huawei_health" as WearableProvider,
          wearableConnectionStatus: "not_connected" as WearableConnectionStatus,
          pendingWearableSignal: null,
          wearableSignalRecords: [],
          sessionMode: "normal" as SessionMode,
          lastDifficultyType: null,
          supportRules: [],
          soundScapeType: null,
          soundScapeVolume: 0.3,
          soundScapeEnabled: false,
          reminderEnabled: false,
          reminderTimes: { morning: "09:00", noon: "14:00", evening: "20:00" },
          hasSeenNeuroGuide: false,
          interestSessions: [],
          toasts: [],
        });
        // 同步清空云端数据（fire-and-forget）
        clearCloudData();
      },
    }),
    {
      name: "syncspace-store",
      partialize: (state) => ({
        onboarded: state.onboarded,
        neuroType: state.neuroType,
        adhdSubtype: state.adhdSubtype,
        appMode: state.appMode,
        checkins: state.checkins,
        protocols: state.protocols,
        executions: state.executions,
        crashMarks: state.crashMarks,
        observation: state.observation,
        personalRules: state.personalRules,
        connectionMoments: state.connectionMoments,
        connectionPreferences: state.connectionPreferences,
        captureItems: state.captureItems,
        currentWeather: state.currentWeather,
        traitProfile: state.traitProfile,
        collaborator: state.collaborator,
        qwenEnabled: state.qwenEnabled,
        lowSensoryMode: state.lowSensoryMode,
        readingAidEnabled: state.readingAidEnabled,
        language: state.language,
        wearableMode: state.wearableMode,
        wearableProvider: state.wearableProvider,
        wearableConnectionStatus: state.wearableConnectionStatus,
        wearableSignalRecords: state.wearableSignalRecords,
        sessionMode: state.sessionMode,
        lastDifficultyType: state.lastDifficultyType,
        supportRules: state.supportRules,
        soundScapeType: state.soundScapeType,
        soundScapeVolume: state.soundScapeVolume,
        soundScapeEnabled: state.soundScapeEnabled,
        reminderEnabled: state.reminderEnabled,
        reminderTimes: state.reminderTimes,
        hasSeenNeuroGuide: state.hasSeenNeuroGuide,
        seenPageGuides: state.seenPageGuides,
        interestSessions: state.interestSessions,
        postponedTrigger: state.postponedTrigger,
      }),
    },
  ),
);
