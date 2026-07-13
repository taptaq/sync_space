import type { CheckIn, NeuroType, Phase } from "@/types";
import { detectPhase } from "@/lib/stageEngine";
import { getAxisProfile } from "@/lib/axisConfig";

// 气候指纹（PRD 社区概念 · 非身份标识 · 不含原始数据）
// 基于用户签到规律生成一段自然的气候描述
// 不暴露任何轴值/犹豫时间等原始数据，只输出模糊化的人类可读文案

export interface ClimateFingerprint {
  // 主要摆动区间（如"平稳期 ↔ 累积期"）
  swingRange: string;
  // 主要敏感通道
  primaryChannel: string;
  // 签到频率特征
  rhythmPattern: string;
  // 完整指纹文案
  summary: string;
  // 指纹色码（用于明信片视觉）
  colorCode: string;
}

// 从签到历史生成气候指纹（需要至少 3 次签到）
export function getClimateFingerprint(
  checkins: CheckIn[],
  neuroType: NeuroType,
): ClimateFingerprint | null {
  if (checkins.length < 3) return null;

  // 1. 阶段分布统计
  const phaseCounts: Record<Phase, number> = {
    stable: 0,
    accumulating: 0,
    warning: 0,
    overload: 0,
    recovery: 0,
  };
  for (const c of checkins) {
    const phase = detectPhase(c.weather_snapshot.climate, []);
    phaseCounts[phase]++;
  }

  // 找出 top-2 阶段
  const sorted = (Object.entries(phaseCounts) as [Phase, number][])
    .sort((a, b) => b[1] - a[1]);
  const topPhase = sorted[0][0];
  const secondPhase = sorted[1][0];
  const phaseLabels: Record<Phase, string> = {
    stable: "平稳期",
    accumulating: "累积期",
    warning: "预警期",
    overload: "过载期",
    recovery: "恢复期",
  };
  const swingRange = topPhase === secondPhase
    ? `常在「${phaseLabels[topPhase]}」`
    : `常在「${phaseLabels[topPhase]} ↔ ${phaseLabels[secondPhase]}」之间摆动`;

  // 2. 主要敏感通道
  const profile = getAxisProfile(neuroType);
  const avgSensory = avg(checkins.map((c) => c.axis_sensory));
  const avgSocial = avg(checkins.map((c) => c.axis_social));
  const avgPredict = avg(checkins.map((c) => c.axis_predictability));

  // 找 strain 最高的轴（用轴方向转换后再比）
  const strains = [
    { label: profile.axes[0].label, value: toStrainValue(avgSensory, profile.axes[0].direction) },
    { label: profile.axes[1].label, value: toStrainValue(avgSocial, profile.axes[1].direction) },
    { label: profile.axes[2].label, value: toStrainValue(avgPredict, profile.axes[2].direction) },
  ].sort((a, b) => b.value - a.value);

  const primaryChannel = `${strains[0].label}是你的主要敏感通道`;

  // 3. 签到频率特征
  const days = uniqueDays(checkins);
  let rhythmPattern: string;
  if (days >= 7) {
    rhythmPattern = "你保持着稳定的签到节奏";
  } else if (days >= 3) {
    rhythmPattern = "你正在建立自己的签到节奏";
  } else {
    rhythmPattern = "你刚开始探索自己的气候";
  }

  // 4. 指纹色码（基于 topPhase 的代表色）
  const colorMap: Record<Phase, string> = {
    stable: "#6B9E8A",
    accumulating: "#C4956A",
    warning: "#D4A04A",
    overload: "#C4715A",
    recovery: "#6B5FA0",
  };

  const colorCode = colorMap[topPhase];

  // 5. 完整文案
  const summary = `${swingRange}，${primaryChannel}。${rhythmPattern}。`;

  return { swingRange, primaryChannel, rhythmPattern, summary, colorCode };
}

// 辅助函数
function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function toStrainValue(raw: number, direction: "high-bad" | "low-bad"): number {
  return direction === "high-bad" ? raw : 10 - raw;
}

function uniqueDays(checkins: CheckIn[]): number {
  const set = new Set(
    checkins.map((c) => {
      const d = new Date(c.checkin_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  return set.size;
}
