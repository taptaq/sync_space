import type { ClimateType, CrashMark, LocalText, NeuroType, Phase } from "@/types";

// 五阶段模型（PRD §09 气候延伸 · 状态分层驱动措施与协议推荐）
// 阶段由当前气候 + 崩溃标记共同判定，恢复期优先
// 每个阶段有独立色调、叙事、措施基调和推荐协议标签
// 叙事和措施基调按神经特质分化（ASD 侧重视官/可预测性，ADHD 侧重执行/多巴胺）
// Phase 类型定义在 @/types，此处只做配置与判定

export interface PhaseConfig {
  key: Phase;
  label: LocalText;
  // 天气卡渐变背景类（对应 index.css 中 .phase-* ）
  toneClass: string;
  // 阶段小标签的徽章色（tailwind 文字 + 背景类）
  badgeClass: string;
  // 给用户的阶段叙事（按特质分化的默认值在 PHASE_NARRATIVE_BY_TYPE）
  narrative: LocalText;
  // 措施基调（按特质分化的默认值在 PHASE_MEASURE_TONE_BY_TYPE）
  measureTone: LocalText;
  // 该阶段优先推荐的协议阶段标签（顺序即优先级）
  recommendedTags: Phase[];
}

// 按特质分化的阶段叙事
const PHASE_NARRATIVE_BY_TYPE: Record<Phase, Partial<Record<NeuroType, LocalText>>> = {
  stable: {
    asd: { zh: "感官预算充足，环境在你的掌控中。这是充电、巩固日常的好时候。", en: "Sensory budget is full and the environment is in your control. A good time to recharge and consolidate routines." },
    adhd: { zh: "多巴胺电量满格，脑子转得动。这是做你真正想做的事的好时候。", en: "Dopamine battery is full and the mind is ready. A good time to do what you truly want." },
  },
  accumulating: {
    asd: { zh: "感官输入在累积。还来得及，提前降载比事后修复轻松得多。", en: "Sensory input is accumulating. There's still time; reducing load proactively is easier than recovering later." },
    adhd: { zh: "任务切换和决策在累积疲劳。还来得及，提前减负比硬撑下去轻松得多。", en: "Task-switching and decisions are accumulating fatigue. There's still time; offloading proactively is easier than pushing through." },
  },
  warning: {
    asd: { zh: "离感官过载还有一步。现在执行协议，比硬撑过去更省力。", en: "One step from sensory overload. Running a protocol now takes less effort than pushing through." },
    adhd: { zh: "离执行功能崩溃还有一步。现在执行协议，比硬撑过去更省力。", en: "One step from executive-function collapse. Running a protocol now takes less effort than pushing through." },
  },
  overload: {
    asd: { zh: "感官电量已经见底。此刻不需要「应该」，只需要保护自己。", en: "Sensory battery is empty. Right now you don't need \"should\"; you just need to protect yourself." },
    adhd: { zh: "多巴胺电量已经见底。此刻不需要「应该」，只需要保护自己。", en: "Dopamine battery is empty. Right now you don't need \"should\"; you just need to protect yourself." },
  },
  recovery: {
    asd: { zh: "刚经历过感官过载，正在回血。低电量是正常的，慢一点。", en: "Just came through sensory overload and are recharging. Low battery is normal; take it slowly." },
    adhd: { zh: "刚经历过执行崩溃，正在回血。低电量是正常的，别急着启动。", en: "Just came through an executive crash and are recharging. Low battery is normal; don't rush to restart." },
  },
};

// 按特质分化的措施基调
const PHASE_MEASURE_TONE_BY_TYPE: Record<Phase, Partial<Record<NeuroType, LocalText>>> = {
  stable: {
    asd: { zh: "可以做需要专注的事，也为未来储备感官预算。", en: "You can do focused work and build up future sensory budget." },
    adhd: { zh: "可以做需要启动的事，也为未来储备多巴胺电量。", en: "You can do work that needs initiation and build up future dopamine battery." },
  },
  accumulating: {
    asd: { zh: "预防优先：取消非必要安排，给感官降载。", en: "Prevention first: cancel non-essential commitments and reduce sensory load." },
    adhd: { zh: "预防优先：减少任务切换，给执行功能降载。", en: "Prevention first: reduce task-switching and lower executive load." },
  },
  warning: {
    asd: { zh: "立即执行已设协议，最小化决策，能撤就撤。", en: "Run an existing protocol now, minimize decisions, and withdraw when you can." },
    adhd: { zh: "立即执行已设协议，最小化决策，降低启动门槛。", en: "Run an existing protocol now, minimize decisions, and lower the bar for starting." },
  },
  overload: {
    asd: { zh: "只做最低限度的保护动作，不要求自己「做好」。", en: "Do only the minimum protective action; don't demand that you \"do it well\"." },
    adhd: { zh: "只做最低限度的制动动作，不要求自己「做好」。", en: "Do only the minimum braking action; don't demand that you \"do it well\"." },
  },
  recovery: {
    asd: { zh: "温柔、不催促。允许低电量，多睡、少做、慢一点。", en: "Gentle, unhurried. Allow low battery—sleep more, do less, slow down." },
    adhd: { zh: "温柔、不催促。允许低电量，别给自己加任务。", en: "Gentle, unhurried. Allow low battery—don't add tasks for yourself." },
  },
};

// 五阶段配置
export const PHASE_MAP: Record<Phase, PhaseConfig> = {
  stable: {
    key: "stable",
    label: { zh: "平稳期", en: "Stable" },
    toneClass: "phase-stable",
    badgeClass: "bg-sage-mist/60 text-sage",
    narrative: { zh: "状态稳定，能量充足。这是建设、充电、巩固的好时候。", en: "Stable state, ample energy. A good time to build, recharge, and consolidate." },
    measureTone: { zh: "可以做需要专注的事，也为未来储备能量。", en: "You can do focused work and bank energy for the future." },
    recommendedTags: ["stable"],
  },
  accumulating: {
    key: "accumulating",
    label: { zh: "累积期", en: "Accumulating" },
    toneClass: "phase-accumulating",
    badgeClass: "bg-clay-mist/60 text-clay",
    narrative: { zh: "有些信号在累积。还来得及，提前减负比事后修复轻松得多。", en: "Some signals are accumulating. There's still time; offloading proactively is easier than recovering later." },
    measureTone: { zh: "预防优先：取消非必要安排，给感官降载。", en: "Prevention first: cancel non-essential commitments and reduce sensory load." },
    recommendedTags: ["accumulating", "warning"],
  },
  warning: {
    key: "warning",
    label: { zh: "预警期", en: "Warning" },
    toneClass: "phase-warning",
    badgeClass: "bg-clay-mist/60 text-clay-soft",
    narrative: { zh: "离过载还有一步。现在执行协议，比硬撑过去更省力。", en: "One step from overload. Running a protocol now takes less effort than pushing through." },
    measureTone: { zh: "立即执行已设协议，最小化决策，能撤就撤。", en: "Run an existing protocol now, minimize decisions, and withdraw when you can." },
    recommendedTags: ["warning", "overload"],
  },
  overload: {
    key: "overload",
    label: { zh: "过载期", en: "Overload" },
    toneClass: "phase-overload",
    badgeClass: "bg-warn-mist/60 text-warn",
    narrative: { zh: "电量已经见底。此刻不需要「应该」，只需要保护自己。", en: "Battery is empty. Right now you don't need \"should\"; you just need to protect yourself." },
    measureTone: { zh: "只做最低限度的保护动作，不要求自己「做好」。", en: "Do only the minimum protective action; don't demand that you \"do it well\"." },
    recommendedTags: ["overload"],
  },
  recovery: {
    key: "recovery",
    label: { zh: "恢复期", en: "Recovery" },
    toneClass: "phase-recovery",
    badgeClass: "bg-primary-mist/60 text-primary",
    narrative: { zh: "刚经历过过载，正在回血。低电量是正常的，深度加工可能在这个阶段给你一些洞察。", en: "Just came through overload and are recharging. Low battery is normal; deep processing may offer some insight here." },
    measureTone: { zh: "温柔、不催促。允许低电量，多睡、少做、慢一点。恢复期也可能有创造性产出。", en: "Gentle, unhurried. Allow low battery—sleep more, do less, slow down. Creative output can also emerge in recovery." },
    recommendedTags: ["recovery"],
  },
};

// 恢复期窗口：崩溃标记后多少小时内算恢复期
const RECOVERY_WINDOW_HOURS = 48;

// 判定当前阶段
// 优先级：恢复期（48h 内有崩溃标记）> 气候映射
export function detectPhase(
  climate: ClimateType,
  crashMarks: CrashMark[],
  now: Date = new Date(),
): Phase {
  // 恢复期：最近 RECOVERY_WINDOW_HOURS 内有崩溃标记
  const cutoff = now.getTime() - RECOVERY_WINDOW_HOURS * 3600_000;
  const hasRecentCrash = crashMarks.some(
    (c) => new Date(c.marked_at).getTime() >= cutoff,
  );
  if (hasRecentCrash) return "recovery";

  // 气候 → 阶段
  switch (climate) {
    case "clear_breeze":
      return "stable";
    case "warm_fog":
      return "accumulating";
    case "stuffy_rain":
      return "warning";
    case "storm_warning":
      return "overload";
    default:
      return "stable";
  }
}

// 获取阶段配置（默认 · 无特质分化）
export function getPhaseConfig(phase: Phase): PhaseConfig {
  return PHASE_MAP[phase];
}

// 获取按特质分化的阶段配置
// ASD/ADHD 有专属叙事和措施基调；其他特质用默认值
export function getPhaseConfigForType(phase: Phase, neuroType: NeuroType): PhaseConfig {
  const base = PHASE_MAP[phase];
  const narrative = PHASE_NARRATIVE_BY_TYPE[phase]?.[neuroType] ?? base.narrative;
  const measureTone = PHASE_MEASURE_TONE_BY_TYPE[phase]?.[neuroType] ?? base.measureTone;
  return { ...base, narrative, measureTone };
}

// 判断协议是否适用于某阶段
// 协议不标 phases → 全阶段通用；标了则需包含当前阶段
export function protocolAppliesToPhase(
  phases: Phase[] | undefined,
  currentPhase: Phase,
): boolean {
  if (!phases || phases.length === 0) return true;
  return phases.includes(currentPhase);
}

// 协议在某阶段的推荐优先级（用于排序）
// 命中当前阶段 → 0；命中推荐标签 → 1；通用 → 2；不适用 → 3
export function phasePriority(
  phases: Phase[] | undefined,
  currentPhase: Phase,
): number {
  if (!phases || phases.length === 0) return 2;
  if (phases.includes(currentPhase)) return 0;
  const recommended = PHASE_MAP[currentPhase].recommendedTags;
  if (phases.some((p) => recommended.includes(p))) return 1;
  return 3;
}
