import type { ClimateType, CrashMark, Phase } from "@/types";

// 五阶段模型（PRD §09 气候延伸 · 状态分层驱动措施与协议推荐）
// 阶段由当前气候 + 崩溃标记共同判定，恢复期优先
// 每个阶段有独立色调、叙事、措施基调和推荐协议标签
// Phase 类型定义在 @/types，此处只做配置与判定

export interface PhaseConfig {
  key: Phase;
  label: string;
  // 天气卡渐变背景类（对应 index.css 中 .phase-* ）
  toneClass: string;
  // 阶段小标签的徽章色（tailwind 文字 + 背景类）
  badgeClass: string;
  // 给用户的阶段叙事
  narrative: string;
  // 措施基调（一句话告诉用户这个阶段该怎样对待自己）
  measureTone: string;
  // 该阶段优先推荐的协议阶段标签（顺序即优先级）
  recommendedTags: Phase[];
}

// 五阶段配置
export const PHASE_MAP: Record<Phase, PhaseConfig> = {
  stable: {
    key: "stable",
    label: "平稳期",
    toneClass: "phase-stable",
    badgeClass: "bg-sage-mist/60 text-sage",
    narrative: "状态稳定，能量充足。这是建设、充电、巩固的好时候。",
    measureTone: "可以做需要专注的事，也为未来储备能量。",
    recommendedTags: ["stable"],
  },
  accumulating: {
    key: "accumulating",
    label: "累积期",
    toneClass: "phase-accumulating",
    badgeClass: "bg-clay-mist/60 text-clay",
    narrative: "有些信号在累积。还来得及，提前减负比事后修复轻松得多。",
    measureTone: "预防优先：取消非必要安排，给感官降载。",
    recommendedTags: ["accumulating", "warning"],
  },
  warning: {
    key: "warning",
    label: "预警期",
    toneClass: "phase-warning",
    badgeClass: "bg-clay-mist/60 text-clay-soft",
    narrative: "离过载还有一步。现在执行协议，比硬撑过去更省力。",
    measureTone: "立即执行已设协议，最小化决策，能撤就撤。",
    recommendedTags: ["warning", "overload"],
  },
  overload: {
    key: "overload",
    label: "过载期",
    toneClass: "phase-overload",
    badgeClass: "bg-warn-mist/60 text-warn",
    narrative: "电量已经见底。此刻不需要「应该」，只需要保护自己。",
    measureTone: "只做最低限度的保护动作，不要求自己「做好」。",
    recommendedTags: ["overload"],
  },
  recovery: {
    key: "recovery",
    label: "恢复期",
    toneClass: "phase-recovery",
    badgeClass: "bg-primary-mist/60 text-primary",
    narrative: "刚经历过过载，正在回血。低电量是正常的，深度加工可能在这个阶段给你一些洞察。",
    measureTone: "温柔、不催促。允许低电量，多睡、少做、慢一点。恢复期也可能有创造性产出。",
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

// 获取阶段配置
export function getPhaseConfig(phase: Phase): PhaseConfig {
  return PHASE_MAP[phase];
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
