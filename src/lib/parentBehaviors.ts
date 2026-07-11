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
    label: "感官",
    options: [
      { key: "calm", label: "安静放松 · 对声音光线没明显反应", raw: 2 },
      { key: "some", label: "偶尔捂耳 / 眯眼 / 对某些声音皱眉", raw: 5 },
      { key: "overload", label: "捂耳朵 / 躲光线 / 拒绝触碰 · 明显过载", raw: 8 },
    ],
  },
  {
    axis: "social",
    label: "社交",
    options: [
      { key: "withdrawn", label: "退缩 / 不回应 / 躲眼神 · 电量低", raw: 2 },
      { key: "ok", label: "能回应但简短 · 还行", raw: 5 },
      { key: "full", label: "主动说话 / 眼神自在 · 电量足", raw: 8 },
    ],
  },
  {
    axis: "predictability",
    label: "状态",
    options: [
      { key: "chaos", label: "焦躁 / 来回走 / 难安顿 · 混乱", raw: 2 },
      { key: "mid", label: "能坐下但换得勤 · 一般", raw: 5 },
      { key: "settled", label: "专注做一件事 · 踏实安定", raw: 8 },
    ],
  },
];

// ADHD 特化行为组（执行通道 · 注意力/多巴胺/启动阻力）
const ADHD_BEHAVIORS: ParentBehaviorAxis[] = [
  {
    axis: "sensory",
    label: "注意力",
    options: [
      { key: "scattered", label: "完全涣散 · 一件事都做不完", raw: 2 },
      { key: "some", label: "能做一会儿但容易跑神", raw: 5 },
      { key: "focused", label: "能专注做完一件事", raw: 8 },
    ],
  },
  {
    axis: "social",
    label: "能量",
    options: [
      { key: "drained", label: "瘫着不想动 · 启动不了", raw: 2 },
      { key: "ok", label: "能开始但需要推一把", raw: 5 },
      { key: "full", label: "主动想做 · 能量足", raw: 8 },
    ],
  },
  {
    axis: "predictability",
    label: "卡住",
    options: [
      { key: "stuck", label: "卡死 · 反复说做不了", raw: 8 },
      { key: "some", label: "有点卡但能推进", raw: 5 },
      { key: "flow", label: "流畅 · 说做就做", raw: 2 },
    ],
  },
];

// PTSD 特化行为组（安全通道 · 安全感/唤起度/接地度）
const PTSD_BEHAVIORS: ParentBehaviorAxis[] = [
  {
    axis: "sensory",
    label: "安全感",
    options: [
      { key: "alert", label: "到处看 / 一惊一乍 · 觉得危险", raw: 2 },
      { key: "some", label: "有点警觉但能待住", raw: 5 },
      { key: "safe", label: "放松 · 觉得安全", raw: 8 },
    ],
  },
  {
    axis: "social",
    label: "警觉度",
    options: [
      { key: "high", label: "高度警觉 / 僵硬 · 唤起高", raw: 8 },
      { key: "some", label: "有些警觉 · 还行", raw: 5 },
      { key: "calm", label: "平静放松", raw: 2 },
    ],
  },
  {
    axis: "predictability",
    label: "在不在",
    options: [
      { key: "dissociated", label: "眼神空 / 叫不应 · 解离飘忽", raw: 2 },
      { key: "some", label: "有时飘但能拉回", raw: 5 },
      { key: "present", label: "人在当下 · 接地", raw: 8 },
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
