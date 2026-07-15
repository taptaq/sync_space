// SyncSpace 类型定义（对齐 PRD §06 协议数据结构 + §11 数据模型）

// 神经特质类型
export type NeuroType = "asd" | "adhd" | "hsp" | "ptsd" | "other";

// ADHD 子类型（DSM-5 三种表现类型）
export type ADHDSubtype = "inattentive" | "hyperactive" | "combined" | "unknown";

// 双语文本类型 · 数据层用此类型存储中英文文案
export type LocalText = { zh: string; en: string };

// 气候类型（PRD §09 气候类型非好坏）
export type ClimateType =
  | "stuffy_rain" // 闷热待雨 · 感官气压升高
  | "clear_breeze" // 晴朗微风 · 状态稳定舒适
  | "warm_fog" // 暖雾弥漫 · 执行功能模糊
  | "storm_warning"; // 雷暴预警 · 临界点接近

// 五阶段（PRD §09 阶段分层 · 由气候 + 崩溃标记判定，驱动措施基调与协议推荐）
export type Phase =
  | "stable" // 平稳期 · 建设
  | "accumulating" // 累积期 · 预防
  | "warning" // 预警期 · 应急
  | "overload" // 过载期 · 保命
  | "recovery"; // 恢复期 · 温柔

// 签到三轴（ASD 维度）
export type AxisKey = "sensory" | "social" | "predictability";

// 个人规则：把反复出现的信号沉淀为可修订的自我理解
export interface PersonalRule {
  id: string;
  signal: string;
  understanding: string;
  support: string;
  evidence_count: number;
  last_feedback?: "helpful" | "unhelpful";
  last_feedback_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectionMoment {
  id: string;
  rule_id: string;
  mode: "self" | "other";
  connected_at: string;
  feedback?: "helpful" | "unhelpful";
}

// ADHD 外部记忆：先统一收下，再一次处理一条
export interface CaptureItem {
  id: string;
  text: string;
  status: "inbox" | "focus" | "done";
  created_at: string;
  focus_started_at?: string;
  completed_at?: string;
}

// 天气卡快照
export interface WeatherSnapshot {
  climate: ClimateType;
  climate_label: LocalText;
  description: LocalText;
  suitable: LocalText[];
  unsuitable: LocalText[];
}

// 阶段轨迹点（阶段移动的迷你可视化）
export interface PhasePoint {
  phase: Phase;
  label: LocalText;
  color: string;
  time: string;
}

// 签到数据
export interface CheckIn {
  id: string;
  axis_sensory: number; // 感官负载 0-10
  axis_social: number; // 社交电量 0-10
  axis_predictability: number; // 可预测性需求 0-10
  hesitation_ms: number; // 滑块犹豫时长（被动信号）
  checkin_at: string; // ISO 时间
  response_delay_minutes: number; // 响应延迟（被动信号）
  weather_snapshot: WeatherSnapshot;
  // 开放备注（HSP 深度加工出口 · 非必填）
  note?: string;
  // 早期预警信号勾选（ASD alexithymia · 用可观察行为辅助签到）
  early_signals?: string[];
}

// 协议触发条件
export interface ProtocolTrigger {
  type: "threshold" | "time" | "behavior";
  axis?: AxisKey;
  operator?: ">" | "<" | ">=" | "<=";
  value?: number;
  description: LocalText; // 自然语言描述，如"感官负载 > 7"
}

// 协议约定动作
export interface ProtocolAction {
  description: LocalText;
  duration_minutes: number;
  timer: boolean;
}

// 协议来源
export type ProtocolSource = "manual" | "ai_suggestion" | "crash_reflection";

// 协议状态
export type ProtocolStatus = "active" | "paused" | "candidate";

// 协议
export interface Protocol {
  id: string;
  trigger: ProtocolTrigger;
  action: ProtocolAction;
  source: ProtocolSource;
  status: ProtocolStatus;
  // 适用的阶段标签（PRD §09 五阶段分层）
  // 留空 / undefined → 全阶段通用；标了则只在命中阶段优先触发
  phases?: Phase[];
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
}

// 协议执行记录
export interface ProtocolExecution {
  id: string;
  protocol_id: string;
  triggered_at: string;
  executed_at: string;
  action_taken: "executed" | "postponed" | "ignored";
  duration_actual_minutes: number;
  // 执行效果反馈（PRD §09 反馈闭环 · 协议执行后询问是否有效）
  feedback?: "helpful" | "neutral" | "unhelpful";
}

// AI 三段式解读
export interface AIInterpretation {
  event: LocalText; // 事件描述
  emotion: LocalText; // 情绪翻译
  need: LocalText; // 需求识别
}

// 过载事件类型（ASD 研究：meltdown = 外向爆发，shutdown = 内向退缩，恢复路径不同）
export type CrashType = "meltdown" | "shutdown" | "dissociation";

// 过载触发线索类型（PTSD 安全：只记客观线索，不引导描述创伤情绪细节，防再体验）
export type TriggerCueType =
  | "sensory" // 感官刺激（光/声音/气味/触觉）
  | "social" // 社交情境
  | "routine_change" // 常规变化
  | "anniversary" // 周年日/时间触发
  | "place" // 地点
  | "internal" // 内部状态（疲劳/饥饿/疼痛）
  | "other";

// 崩溃标记（过载回溯 · 非病理化叙事）
export interface CrashMark {
  id: string;
  marked_at: string;
  voice_text?: string; // 模拟语音转文字（用户输入 · 不双语）
  raw_text?: string; // 用户补记文字（用户输入 · 不双语）
  ai_interpretation?: AIInterpretation;
  weather_snapshot?: WeatherSnapshot;
  reviewed: boolean;
  // 过载事件类型（meltdown 外向爆发 / shutdown 内向退缩 / dissociation 解离）
  crash_type?: CrashType;
  // 结构化触发线索（PTSD 安全 · 客观线索而非情绪叙述）
  trigger_cues?: { type: TriggerCueType; description: LocalText }[];
}

// AI 观察建议
export interface AIObservation {
  id: string;
  week_label: LocalText;
  pattern: LocalText; // "你过去 N 次 [事件] 前的 M 分钟，都做了 [行为]"
  suggested_protocol: {
    trigger_description: LocalText;
    action_description: LocalText;
  };
  status: "pending" | "accepted" | "ignored";
  created_at: string;
}

// 时间线条目
export interface TimelineEntry {
  id: string;
  type: "crash" | "protocol" | "checkin";
  time: string;
  title: LocalText;
  detail: LocalText;
  weather_snapshot?: WeatherSnapshot;
}

// Toast 通知
export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}

// ============ 神经特质自评（PRD §11 非诊断 · 使用业内公开量表官方原版） ============

// 量表标识
export type ScaleId =
  | "aq10"
  | "asrs6"
  | "hsps12"
  | "pcl5"
  | "snap18"
  | "mdqe33"
  | "sas20"
  | "sds20"
  | "dsm5a18s"
  | "dsm5a18b";

// 计分模式
// binary：每题命中 scored_options 得 1 分（AQ-10 / ASRS-6 官方计分方式）
// likert：每题得分 = 选项 value（HSPS Likert 累加）
export type ScoringMode = "binary" | "likert";

// 量表题目
export interface ScaleQuestion {
  id: number;
  text: LocalText;
  // binary 模式：哪些选项 index 得 1 分（对应 ScaleMeta.options 的 index）
  // likert 模式：忽略此字段
  scored_options?: number[];
  // likert 模式：是否为反向计分题（如 SAS/SDS）
  reverse?: boolean;
}

// 量表元数据
export interface ScaleMeta {
  id: ScaleId;
  neuro_type: NeuroType; // 对应的神经特质
  label: string; // ASD / ADHD / HSP（缩写 · 不双语）
  full_name: LocalText; // 全称
  source: LocalText; // 量表出处 + 官方链接
  official_url: string; // 官方测试/资料链接
  question_count: number;
  scoring: ScoringMode;
  description: LocalText; // 给用户看的通俗说明
  options: { value: number; label: LocalText }[]; // 选项（binary: value 仅作标识；likert: value 即得分）
  cutoff: number; // 官方临床 cutoff（≥该分建议转介专科评估）
  cutoff_note: LocalText; // cutoff 说明
  // 分数区间 → 画像
  bands: {
    max: number; // 该区间上限（含）
    level: "low" | "mid" | "high"; // 特质表达程度
    title: LocalText; // 画像标题
    summary: LocalText; // 画像描述
    recommended_protocols: LocalText[]; // 推荐协议方向描述
  }[];
}

// 单份量表作答记录
export interface ScaleResult {
  scale_id: ScaleId;
  score: number;
  max_score: number;
  level: "low" | "mid" | "high";
  band_title: LocalText;
  band_summary: LocalText;
  recommended_protocols: LocalText[];
  answers: number[]; // 每题用户选的 option index
  taken_at: string; // ISO
}

// 用户特质画像（多份量表汇总，非诊断）
export interface TraitProfile {
  results: ScaleResult[];
  last_updated: string;
}

// ============ 协议参与者（PRD §02 自主性阶段 · 共管/半自主/倡导） ============

// 谁参与用户的协议（Onboarding 第三步收集，为"共享协议"留叙事入口）
// "只我自己" → 半自主阶段（当前 Demo 形态）
// 其他选项 → 共管阶段（架构已支持，后续扩展）
export type CollaboratorRole =
  | "self" // 只我自己
  | "partner" // 伴侣
  | "family" // 家人
  | "supporter" // 支持者（社工/老师）
  | "therapist"; // 治疗师

// ============ 应用模式（自主签到 / 家长代理签到） ============

// "self"        → 面向能自主签到的人（建议 13+），三轴滑块自填
// "parent_proxy"→ 家长代理模式：儿童不拿手机，家长观察行为选择 → 映射三轴，系统给家长引导建议
export type AppMode = "self" | "parent_proxy";

// 家长观察到的行为选项（按三轴组织，每条轴给三段可观察行为 · 对应 raw 低/中/高）
export interface ParentBehaviorOption {
  key: string;
  label: LocalText; // 家长看得懂的描述，如"捂耳朵 / 躲眼神"
  raw: number; // 映射到的轴 raw 值（2 / 5 / 8 三档）
}

// 一条轴的家长行为组
export interface ParentBehaviorAxis {
  axis: AxisKey;
  label: LocalText; // 轴的家长向标签，如"感官"
  options: ParentBehaviorOption[]; // 三档
}

// 家长引导建议条目
export interface ParentGuidanceItem {
  text: LocalText;
}

// 单个阶段的家长引导包（四类建议）
export interface ParentGuidancePack {
  phase: Phase;
  phaseLabel: LocalText;
  measures: ParentGuidanceItem[]; // 阶段措施卡片
  scripts: ParentGuidanceItem[]; // 话术卡片（家长可以这样说）
  avoidList: ParentGuidanceItem[]; // 不要做清单
  environment: ParentGuidanceItem[]; // 环境调整建议
}
