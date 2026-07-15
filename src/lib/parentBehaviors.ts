import type { AxisKey, NeuroType, ParentBehaviorAxis } from "@/types";

// 家长代理签到 · 观察行为库（家长不懂数值，只描述孩子此刻的样子）
// 按三轴组织，每条轴给三档可观察行为，对应 raw 值 2 / 5 / 8
// raw 含义取决于轴的 direction（见 axisConfig.ts）：
//   high-bad（如感官负载）：raw 低=好，高=差
//   low-bad （如社交电量）：raw 低=差，高=好
// 家长选的行为 → raw → weatherEngine 用 toStrain 归一化

// 通用行为组（适用于大多数神经特质，按感官/社交/可预测性组织）
const COMMON_BEHAVIORS: ParentBehaviorAxis[] = [
  {
    axis: "sensory",
    label: { zh: "感官", en: "Sensory" },
    options: [
      { key: "calm", label: { zh: "安静放松 · 对声音光线没明显反应", en: "Calm and relaxed · No noticeable reaction to sound or light" }, raw: 2 },
      { key: "some", label: { zh: "偶尔捂耳 / 眯眼 / 对某些声音皱眉", en: "Occasionally covers ears / squints / frowns at certain sounds" }, raw: 5 },
      { key: "overload", label: { zh: "捂耳朵 / 躲光线 / 拒绝触碰 · 明显过载", en: "Covers ears / avoids light / refuses touch · Clearly overloaded" }, raw: 8 },
    ],
  },
  {
    axis: "social",
    label: { zh: "社交", en: "Social" },
    options: [
      { key: "withdrawn", label: { zh: "退缩 / 不回应 / 躲眼神 · 电量低", en: "Withdrawn / unresponsive / avoids eye contact · Low battery" }, raw: 2 },
      { key: "ok", label: { zh: "能回应但简短 · 还行", en: "Can respond but briefly · Okay" }, raw: 5 },
      { key: "full", label: { zh: "主动说话 / 眼神自在 · 电量足", en: "Initiates conversation / comfortable eye contact · Full battery" }, raw: 8 },
    ],
  },
  {
    axis: "predictability",
    label: { zh: "状态", en: "State" },
    options: [
      { key: "chaos", label: { zh: "焦躁 / 来回走 / 难安顿 · 混乱", en: "Agitated / pacing / hard to settle · Chaotic" }, raw: 2 },
      { key: "mid", label: { zh: "能坐下但换得勤 · 一般", en: "Can sit but switches often · Average" }, raw: 5 },
      { key: "settled", label: { zh: "专注做一件事 · 踏实安定", en: "Focused on one thing · Settled and calm" }, raw: 8 },
    ],
  },
];

// ADHD 特化行为组（执行通道 · 注意力/多巴胺/启动阻力）
const ADHD_BEHAVIORS: ParentBehaviorAxis[] = [
  {
    axis: "sensory",
    label: { zh: "注意力", en: "Attention" },
    options: [
      { key: "scattered", label: { zh: "完全涣散 · 一件事都做不完", en: "Fully scattered · Cannot finish a single task" }, raw: 2 },
      { key: "some", label: { zh: "能做一会儿但容易跑神", en: "Can focus briefly but easily distracted" }, raw: 5 },
      { key: "focused", label: { zh: "能专注做完一件事", en: "Can focus and finish a task" }, raw: 8 },
    ],
  },
  {
    axis: "social",
    label: { zh: "能量", en: "Energy" },
    options: [
      { key: "drained", label: { zh: "瘫着不想动 · 启动不了", en: "Slumped, unwilling to move · Cannot initiate" }, raw: 2 },
      { key: "ok", label: { zh: "能开始但需要推一把", en: "Can start but needs a nudge" }, raw: 5 },
      { key: "full", label: { zh: "主动想做 · 能量足", en: "Actively wants to do things · Full energy" }, raw: 8 },
    ],
  },
  {
    axis: "predictability",
    label: { zh: "卡住", en: "Stuck" },
    options: [
      { key: "stuck", label: { zh: "卡死 · 反复说做不了", en: "Completely stuck · Repeatedly says \"can't do it\"" }, raw: 8 },
      { key: "some", label: { zh: "有点卡但能推进", en: "Somewhat stuck but can push forward" }, raw: 5 },
      { key: "flow", label: { zh: "流畅 · 说做就做", en: "Flowing · Does it as soon as asked" }, raw: 2 },
    ],
  },
];

// PTSD 特化行为组（安全通道 · 安全感/唤起度/接地度）
const PTSD_BEHAVIORS: ParentBehaviorAxis[] = [
  {
    axis: "sensory",
    label: { zh: "安全感", en: "Safety" },
    options: [
      { key: "alert", label: { zh: "到处看 / 一惊一乍 · 觉得危险", en: "Looking around / startles easily · Feels in danger" }, raw: 2 },
      { key: "some", label: { zh: "有点警觉但能待住", en: "Somewhat alert but can stay put" }, raw: 5 },
      { key: "safe", label: { zh: "放松 · 觉得安全", en: "Relaxed · Feels safe" }, raw: 8 },
    ],
  },
  {
    axis: "social",
    label: { zh: "警觉度", en: "Arousal" },
    options: [
      { key: "high", label: { zh: "高度警觉 / 僵硬 · 唤起高", en: "Highly vigilant / rigid · High arousal" }, raw: 8 },
      { key: "some", label: { zh: "有些警觉 · 还行", en: "Somewhat vigilant · Okay" }, raw: 5 },
      { key: "calm", label: { zh: "平静放松", en: "Calm and relaxed" }, raw: 2 },
    ],
  },
  {
    axis: "predictability",
    label: { zh: "在不在", en: "Presence" },
    options: [
      { key: "dissociated", label: { zh: "眼神空 / 叫不应 · 解离飘忽", en: "Vacant gaze / unresponsive · Dissociating" }, raw: 2 },
      { key: "some", label: { zh: "有时飘但能拉回", en: "Sometimes drifts but can be called back" }, raw: 5 },
      { key: "present", label: { zh: "人在当下 · 接地", en: "Present in the moment · Grounded" }, raw: 8 },
    ],
  },
];

// 按神经特质取行为组
export function getParentBehaviors(neuroType: NeuroType): ParentBehaviorAxis[] {
  switch (neuroType) {
    case "adhd":
      return ADHD_BEHAVIORS;
    case "ptsd":
      return PTSD_BEHAVIORS;
    default:
      // asd / hsp / other 共用通用感官通道行为组
      return COMMON_BEHAVIORS;
  }
}

// 从家长选择的三轴行为 key 提取 raw 值
export function behaviorsToRaw(
  picks: Record<AxisKey, string>,
  neuroType: NeuroType,
): { sensory: number; social: number; predictability: number } {
  const groups = getParentBehaviors(neuroType);
  const result = { sensory: 5, social: 5, predictability: 5 };
  for (const g of groups) {
    const opt = g.options.find((o) => o.key === picks[g.axis]);
    if (opt) result[g.axis] = opt.raw;
  }
  return result;
}
