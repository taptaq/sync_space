import type {
  AIObservation,
  CheckIn,
  CrashMark,
  Protocol,
  ProtocolExecution,
} from "@/types";
import { generateWeather } from "./weatherEngine";

// 生成过去几天的 mock 签到数据（用于趋势回放展示）
function makeCheckIn(
  daysAgo: number,
  hour: number,
  minute: number,
  sensory: number,
  social: number,
  predictability: number,
  hesitationMs: number,
  delayMinutes: number,
): CheckIn {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return {
    id: `chk_${daysAgo}_${hour}`,
    axis_sensory: sensory,
    axis_social: social,
    axis_predictability: predictability,
    hesitation_ms: hesitationMs,
    checkin_at: d.toISOString(),
    response_delay_minutes: delayMinutes,
    weather_snapshot: generateWeather(sensory, social, predictability, "asd"),
  };
}

// 预置签到数据：过去 6 天 + 今天
export const mockCheckIns: CheckIn[] = [
  // 今天
  makeCheckIn(0, 9, 0, 4.0, 6.0, 7.0, 1200, 180), // 早上签到，响应延迟 3 小时（低能信号）
  makeCheckIn(0, 14, 0, 7.2, 3.5, 8.0, 8200, 5), // 下午签到，犹豫 8.2 秒
  // 昨天
  makeCheckIn(1, 9, 30, 5.0, 6.5, 6.5, 2100, 30),
  makeCheckIn(1, 14, 15, 6.8, 4.0, 7.0, 4500, 15),
  makeCheckIn(1, 20, 0, 8.0, 2.0, 8.5, 9100, 240),
  // 前天
  makeCheckIn(2, 9, 0, 3.5, 7.0, 6.0, 1500, 10),
  makeCheckIn(2, 14, 0, 5.5, 5.5, 6.5, 2800, 20),
  makeCheckIn(2, 20, 0, 4.0, 6.0, 7.0, 1800, 25),
  // 3 天前
  makeCheckIn(3, 9, 0, 4.5, 6.5, 7.0, 1600, 15),
  makeCheckIn(3, 14, 0, 6.0, 5.0, 6.5, 3200, 18),
  // 4 天前
  makeCheckIn(4, 9, 30, 5.0, 6.0, 6.5, 2000, 35),
  makeCheckIn(4, 14, 0, 7.5, 3.0, 8.0, 7800, 12),
  makeCheckIn(4, 20, 0, 5.0, 5.5, 6.5, 2400, 22),
  // 5 天前
  makeCheckIn(5, 9, 0, 3.0, 7.5, 5.5, 1300, 8),
  makeCheckIn(5, 14, 0, 4.5, 6.5, 6.0, 1900, 16),
];

// 预置协议（PRD §05 协议列表样例）
export const mockProtocols: Protocol[] = [
  {
    id: "protocol_001",
    trigger: {
      type: "threshold",
      axis: "sensory",
      operator: ">",
      value: 7,
      description: { zh: "感官负载 > 7", en: "Sensory load > 7" },
    },
    action: {
      description: { zh: "15 分钟内撤退到安静空间，不等别人同意", en: "Retreat to a quiet space within 15 minutes, without waiting for others' consent" },
      duration_minutes: 15,
      timer: true,
    },
    source: "manual",
    status: "active",
    execution_count: 12,
    last_executed_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "protocol_002",
    trigger: {
      type: "threshold",
      axis: "sensory",
      operator: ">=",
      value: 6,
      description: { zh: "进入 hyperfocus", en: "Entering hyperfocus" },
    },
    action: {
      description: { zh: "设 90 分钟硬锚点提醒自己停下来喝水", en: "Set a 90-minute hard anchor to remind myself to stop and drink water" },
      duration_minutes: 90,
      timer: true,
    },
    source: "ai_suggestion",
    status: "active",
    execution_count: 5,
    last_executed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "protocol_003",
    trigger: {
      type: "threshold",
      axis: "predictability",
      operator: "<",
      value: 4,
      description: { zh: "情绪开始过载", en: "Emotions beginning to overload" },
    },
    action: {
      description: { zh: "先用文字写下来再尝试说话", en: "Write it down first before trying to speak" },
      duration_minutes: 5,
      timer: false,
    },
    source: "crash_reflection",
    status: "active",
    execution_count: 3,
    last_executed_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "protocol_004",
    trigger: {
      type: "behavior",
      description: { zh: "收到不舒服的消息", en: "Received an uncomfortable message" },
    },
    action: {
      description: { zh: "推迟到明天回 · AI 候选待确认", en: "Postpone reply until tomorrow · AI candidate pending confirmation" },
      duration_minutes: 0,
      timer: false,
    },
    source: "ai_suggestion",
    status: "candidate",
    execution_count: 0,
    last_executed_at: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// 预置协议执行记录
export const mockExecutions: ProtocolExecution[] = [
  {
    id: "exec_001",
    protocol_id: "protocol_001",
    triggered_at: new Date().toISOString(),
    executed_at: new Date().toISOString(),
    action_taken: "executed",
    duration_actual_minutes: 15,
  },
  {
    id: "exec_002",
    protocol_id: "protocol_002",
    triggered_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    executed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    action_taken: "executed",
    duration_actual_minutes: 90,
  },
];

// 预置崩溃标记（昨天的，未复盘）
export const mockCrashMarks: CrashMark[] = [
  {
    id: "crash_001",
    marked_at: new Date(Date.now() - 1 * 86400000 + 16.5 * 3600000).toISOString(),
    voice_text: `又崩了…开会的时候突然声音变得好刺耳，我一直在忍，后来实在忍不住就跑出来了…其实早上就知道今天不太对…`,
    reviewed: false,
    weather_snapshot: generateWeather(8.0, 2.0, 8.5),
  },
];

// 预置 AI 观察（本周）
export const mockObservation: AIObservation = {
  id: "obs_week_current",
  week_label: { zh: "本周", en: "This week" },
  pattern: {
    zh: `你过去三次 meltdown 前的 90 分钟，都做了一件相同的事：回复了一条让你不舒服的消息。要不要把"不舒服的消息推迟到明天回"写进协议？`,
    en: `In the 90 minutes before your last three meltdowns, you did the same thing: replied to a message that made you uncomfortable. Would you like to add "postpone uncomfortable messages to tomorrow" as a protocol?`,
  },
  suggested_protocol: {
    trigger_description: { zh: "收到不舒服的消息", en: "Received an uncomfortable message" },
    action_description: { zh: "推迟到明天再回，不强迫自己立刻回应", en: "Postpone the reply until tomorrow; don't force an immediate response" },
  },
  status: "pending",
  created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
};
