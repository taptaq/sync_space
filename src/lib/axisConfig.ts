import type { LocalText, NeuroType } from "@/types";

// 签到轴配置（PRD §02：人群特化签到维度 · 同一骨架不同轴语义）
// 5 种神经特质共享同一套三轴签到骨架，只是轴的语义换
// 核心模型：每条轴有 direction
//   "high-bad"：值越高越差（感官负载、吸收量、唤起度、启动阻力）
//   "low-bad" ：值越低越差（社交电量、边界、安全感、注意力）
// 天气引擎统一用 strain（0-10，10=最差）做判断，strain 由 raw + direction 归一化

export type AxisDirection = "high-bad" | "low-bad";

// 程度区间：按 raw 值分三段（0-3 / 4-6 / 7-10）
// bands 顺序固定为 [低 / 中 / 高]，描述本身已隐含好坏，与 direction 无关
export type AxisBands = [LocalText, LocalText, LocalText];

export interface AxisConfig {
  key: "sensory" | "social" | "predictability"; // 存储槽位（CheckIn 字段名）
  label: LocalText; // 显示标签
  hint: LocalText; // 滑块旁提示
  color: string; // tailwind 文字色
  stroke: string; // SVG 曲线色
  direction: AxisDirection;
  bands: AxisBands; // 三段程度描述（0-3 / 4-6 / 7-10）
}

export interface AxisProfile {
  channel: LocalText; // 通道名（感官/执行/安全/通用）
  axes: [AxisConfig, AxisConfig, AxisConfig];
}

// 把 raw 值归一化为 strain（0-10，10=最差）
export function toStrain(raw: number, direction: AxisDirection): number {
  return direction === "high-bad" ? raw : 10 - raw;
}

// 5 种神经特质的轴配置
// bands 三段对应 raw 值：[0-3 低 / 4-6 中 / 7-10 高]
export const AXIS_PROFILES: Record<NeuroType, AxisProfile> = {
  // ============ 感官通道 ============
  asd: {
    channel: { zh: "感官通道", en: "Sensory channel" },
    axes: [
      { key: "sensory", label: { zh: "感官负载", en: "Sensory load" }, hint: { zh: "声 / 光 / 触", en: "Sound / light / touch" }, color: "text-primary", stroke: "#6B5FA0", direction: "high-bad", bands: [{ zh: "安静舒适", en: "Quiet & comfortable" }, { zh: "有些吵", en: "Somewhat noisy" }, { zh: "过载边缘", en: "Edge of overload" }] },
      { key: "social", label: { zh: "社交电量", en: "Social battery" }, hint: { zh: "剩余多少", en: "How much is left" }, color: "text-sage", stroke: "#6B9E8A", direction: "low-bad", bands: [{ zh: "告急", en: "Critically low" }, { zh: "还行", en: "OK" }, { zh: "充足", en: "Plenty" }] },
      { key: "predictability", label: { zh: "可预测性", en: "Predictability" }, hint: { zh: "环境多确定", en: "How certain the environment is" }, color: "text-clay", stroke: "#C4956A", direction: "low-bad", bands: [{ zh: "混乱失控", en: "Chaotic & out of control" }, { zh: "一般", en: "Average" }, { zh: "确定踏实", en: "Certain & grounded" }] },
    ],
  },
  hsp: {
    channel: { zh: "感官通道", en: "Sensory channel" },
    axes: [
      { key: "sensory", label: { zh: "情绪吸收量", en: "Emotional absorption" }, hint: { zh: "吸收了多少", en: "How much absorbed" }, color: "text-primary", stroke: "#6B5FA0", direction: "high-bad", bands: [{ zh: "清亮", en: "Clear" }, { zh: "有点满", en: "Somewhat full" }, { zh: "快溢出", en: "About to overflow" }] },
      { key: "social", label: { zh: "边界完整度", en: "Boundary integrity" }, hint: { zh: "能分清你我吗", en: "Can you tell self from other" }, color: "text-sage", stroke: "#6B9E8A", direction: "low-bad", bands: [{ zh: "模糊难分", en: "Blurred" }, { zh: "一般", en: "Average" }, { zh: "清晰稳固", en: "Clear & solid" }] },
      { key: "predictability", label: { zh: "环境刺激", en: "Environmental stimulus" }, hint: { zh: "声光人", en: "Sound / light / people" }, color: "text-clay", stroke: "#C4956A", direction: "high-bad", bands: [{ zh: "温和", en: "Mild" }, { zh: "有些", en: "Some" }, { zh: "嘈杂刺耳", en: "Loud & harsh" }] },
    ],
  },

  // ============ 执行通道 ============
  adhd: {
    channel: { zh: "执行通道", en: "Executive channel" },
    axes: [
      { key: "sensory", label: { zh: "注意力聚焦", en: "Attention focus" }, hint: { zh: "能聚焦吗", en: "Can you focus" }, color: "text-primary", stroke: "#6B5FA0", direction: "low-bad", bands: [{ zh: "涣散", en: "Scattered" }, { zh: "还行", en: "OK" }, { zh: "聚焦", en: "Focused" }] },
      { key: "social", label: { zh: "多巴胺电量", en: "Dopamine battery" }, hint: { zh: "启动燃料", en: "Initiation fuel" }, color: "text-sage", stroke: "#6B9E8A", direction: "low-bad", bands: [{ zh: "耗尽", en: "Depleted" }, { zh: "勉强", en: "Barely enough" }, { zh: "充足", en: "Plenty" }] },
      { key: "predictability", label: { zh: "启动阻力", en: "Initiation resistance" }, hint: { zh: "卡住程度", en: "How stuck" }, color: "text-clay", stroke: "#C4956A", direction: "high-bad", bands: [{ zh: "流畅", en: "Flowing" }, { zh: "有点卡", en: "A bit stuck" }, { zh: "卡死", en: "Fully stuck" }] },
    ],
  },

  // ============ 安全通道 ============
  ptsd: {
    channel: { zh: "安全通道", en: "Safety channel" },
    axes: [
      { key: "sensory", label: { zh: "安全感基线", en: "Safety baseline" }, hint: { zh: "此刻多安全", en: "How safe right now" }, color: "text-primary", stroke: "#6B5FA0", direction: "low-bad", bands: [{ zh: "危险告警", en: "Danger alert" }, { zh: "还行", en: "OK" }, { zh: "安全", en: "Safe" }] },
      { key: "social", label: { zh: "唤起度", en: "Arousal level" }, hint: { zh: "警觉程度", en: "Vigilance level" }, color: "text-sage", stroke: "#6B9E8A", direction: "high-bad", bands: [{ zh: "平静", en: "Calm" }, { zh: "警觉", en: "Vigilant" }, { zh: "高唤起", en: "High arousal" }] },
      { key: "predictability", label: { zh: "接地度", en: "Grounding" }, hint: { zh: "在不在当下", en: "Are you present" }, color: "text-clay", stroke: "#C4956A", direction: "low-bad", bands: [{ zh: "解离飘忽", en: "Dissociated" }, { zh: "还行", en: "OK" }, { zh: "在当下", en: "Present" }] },
    ],
  },

  // ============ 通用通道 ============
  other: {
    channel: { zh: "通用通道", en: "General channel" },
    axes: [
      { key: "sensory", label: { zh: "心情", en: "Mood" }, hint: { zh: "愉悦度", en: "Pleasantness" }, color: "text-primary", stroke: "#6B5FA0", direction: "low-bad", bands: [{ zh: "低落", en: "Low" }, { zh: "平稳", en: "Steady" }, { zh: "愉悦", en: "Pleasant" }] },
      { key: "social", label: { zh: "能量", en: "Energy" }, hint: { zh: "精力", en: "Vitality" }, color: "text-sage", stroke: "#6B9E8A", direction: "low-bad", bands: [{ zh: "疲惫", en: "Tired" }, { zh: "还行", en: "OK" }, { zh: "充沛", en: "Energetic" }] },
      { key: "predictability", label: { zh: "稳定感", en: "Stability" }, hint: { zh: "踏实吗", en: "Feeling grounded" }, color: "text-clay", stroke: "#C4956A", direction: "low-bad", bands: [{ zh: "动摇", en: "Shaky" }, { zh: "一般", en: "Average" }, { zh: "踏实", en: "Grounded" }] },
    ],
  },
};

// 获取当前用户的轴配置
export function getAxisProfile(neuroType: NeuroType): AxisProfile {
  return AXIS_PROFILES[neuroType] ?? AXIS_PROFILES.other;
}

// 按 raw 值取对应区间的程度描述（0-3 / 4-6 / 7-10）
export function getBandLabel(raw: number, axis: AxisConfig): LocalText {
  if (raw <= 3) return axis.bands[0];
  if (raw <= 6) return axis.bands[1];
  return axis.bands[2];
}
