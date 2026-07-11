import type { NeuroType } from "@/types";

// 签到轴配置（PRD §02：人群特化签到维度 · 同一骨架不同轴语义）
// 5 种神经特质共享同一套三轴签到骨架，只是轴的语义换
// 核心模型：每条轴有 direction
//   "high-bad"：值越高越差（感官负载、吸收量、唤起度、启动阻力）
//   "low-bad" ：值越低越差（社交电量、边界、安全感、注意力）
// 天气引擎统一用 strain（0-10，10=最差）做判断，strain 由 raw + direction 归一化

export type AxisDirection = "high-bad" | "low-bad";

// 程度区间：按 raw 值分三段（0-3 / 4-6 / 7-10）
// bands 顺序固定为 [低 / 中 / 高]，描述本身已隐含好坏，与 direction 无关
export type AxisBands = [string, string, string];

export interface AxisConfig {
  key: "sensory" | "social" | "predictability"; // 存储槽位（CheckIn 字段名）
  label: string; // 显示标签
  hint: string; // 滑块旁提示
  color: string; // tailwind 文字色
  stroke: string; // SVG 曲线色
  direction: AxisDirection;
  bands: AxisBands; // 三段程度描述（0-3 / 4-6 / 7-10）
}

export interface AxisProfile {
  channel: string; // 通道名（感官/执行/安全/通用）
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
    channel: "感官通道",
    axes: [
      { key: "sensory", label: "感官负载", hint: "声 / 光 / 触", color: "text-primary", stroke: "#6B5FA0", direction: "high-bad", bands: ["安静舒适", "有些吵", "过载边缘"] },
      { key: "social", label: "社交电量", hint: "剩余多少", color: "text-sage", stroke: "#6B9E8A", direction: "low-bad", bands: ["告急", "还行", "充足"] },
      { key: "predictability", label: "可预测性", hint: "环境多确定", color: "text-clay", stroke: "#C4956A", direction: "low-bad", bands: ["混乱失控", "一般", "确定踏实"] },
    ],
  },
  hsp: {
    channel: "感官通道",
    axes: [
      { key: "sensory", label: "情绪吸收量", hint: "吸收了多少", color: "text-primary", stroke: "#6B5FA0", direction: "high-bad", bands: ["清亮", "有点满", "快溢出"] },
      { key: "social", label: "边界完整度", hint: "能分清你我吗", color: "text-sage", stroke: "#6B9E8A", direction: "low-bad", bands: ["模糊难分", "一般", "清晰稳固"] },
      { key: "predictability", label: "环境刺激", hint: "声光人", color: "text-clay", stroke: "#C4956A", direction: "high-bad", bands: ["温和", "有些", "嘈杂刺耳"] },
    ],
  },

  // ============ 执行通道 ============
  adhd: {
    channel: "执行通道",
    axes: [
      { key: "sensory", label: "注意力聚焦", hint: "能聚焦吗", color: "text-primary", stroke: "#6B5FA0", direction: "low-bad", bands: ["涣散", "还行", "聚焦"] },
      { key: "social", label: "多巴胺电量", hint: "启动燃料", color: "text-sage", stroke: "#6B9E8A", direction: "low-bad", bands: ["耗尽", "勉强", "充足"] },
      { key: "predictability", label: "启动阻力", hint: "卡住程度", color: "text-clay", stroke: "#C4956A", direction: "high-bad", bands: ["流畅", "有点卡", "卡死"] },
    ],
  },

  // ============ 安全通道 ============
  ptsd: {
    channel: "安全通道",
    axes: [
      { key: "sensory", label: "安全感基线", hint: "此刻多安全", color: "text-primary", stroke: "#6B5FA0", direction: "low-bad", bands: ["危险告警", "还行", "安全"] },
      { key: "social", label: "唤起度", hint: "警觉程度", color: "text-sage", stroke: "#6B9E8A", direction: "high-bad", bands: ["平静", "警觉", "高唤起"] },
      { key: "predictability", label: "接地度", hint: "在不在当下", color: "text-clay", stroke: "#C4956A", direction: "low-bad", bands: ["解离飘忽", "还行", "在当下"] },
    ],
  },

  // ============ 通用通道 ============
  other: {
    channel: "通用通道",
    axes: [
      { key: "sensory", label: "心情", hint: "愉悦度", color: "text-primary", stroke: "#6B5FA0", direction: "low-bad", bands: ["低落", "平稳", "愉悦"] },
      { key: "social", label: "能量", hint: "精力", color: "text-sage", stroke: "#6B9E8A", direction: "low-bad", bands: ["疲惫", "还行", "充沛"] },
      { key: "predictability", label: "稳定感", hint: "踏实吗", color: "text-clay", stroke: "#C4956A", direction: "low-bad", bands: ["动摇", "一般", "踏实"] },
    ],
  },
};

// 获取当前用户的轴配置
export function getAxisProfile(neuroType: NeuroType): AxisProfile {
  return AXIS_PROFILES[neuroType] ?? AXIS_PROFILES.other;
}

// 按 raw 值取对应区间的程度描述（0-3 / 4-6 / 7-10）
export function getBandLabel(raw: number, axis: AxisConfig): string {
  if (raw <= 3) return axis.bands[0];
  if (raw <= 6) return axis.bands[1];
  return axis.bands[2];
}
