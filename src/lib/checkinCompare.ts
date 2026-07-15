import type { CheckIn, LocalText, NeuroType, PhasePoint } from "@/types";
import { ttNow } from "@/lib/i18n";
import { getAxisProfile, getBandLabel } from "@/lib/axisConfig";
import { detectPhase, getPhaseConfig } from "@/lib/stageEngine";
import { formatTime } from "@/lib/format";

// 签到前后对比（比上一次，各轴变了多少）
export interface AxisDiff {
  label: LocalText;
  prevRaw: number;
  currRaw: number;
  prevBand: LocalText;
  currBand: LocalText;
  delta: number; // 当前 - 上次（正值 = 数值变大）
  directionChanged: boolean; // 区间是否改变（如 过载边缘 → 有些聊）
}

export interface CheckinDiff {
  prevTime: string;
  hasPrevious: boolean;
  diffs: AxisDiff[];
  // 各轴区间变化摘要
  summary: string;
}

// 计算前后两次签到的差异
export function compareCheckins(
  previous: CheckIn | null,
  current: CheckIn | null,
  neuroType: NeuroType,
): CheckinDiff | null {
  if (!previous || !current) return null;
  const profile = getAxisProfile(neuroType);
  const [a1, a2, a3] = profile.axes;

  const axes: { key: typeof a1.key; label: LocalText; cfg: typeof a1 }[] = [
    { key: a1.key, label: a1.label, cfg: a1 },
    { key: a2.key, label: a2.label, cfg: a2 },
    { key: a3.key, label: a3.label, cfg: a3 },
  ];

  const diffs: AxisDiff[] = axes.map(({ key, label, cfg }) => {
    const prevRaw =
      key === "sensory"
        ? previous.axis_sensory
        : key === "social"
          ? previous.axis_social
          : previous.axis_predictability;
    const currRaw =
      key === "sensory"
        ? current.axis_sensory
        : key === "social"
          ? current.axis_social
          : current.axis_predictability;
    const prevBand = getBandLabel(prevRaw, cfg);
    const currBand = getBandLabel(currRaw, cfg);
    return {
      label,
      prevRaw,
      currRaw,
      prevBand,
      currBand,
      delta: currRaw - prevRaw,
      directionChanged: prevBand !== currBand,
    };
  });

  // 取变化最大的轴生成摘要
  const changed = diffs.filter((d) => d.directionChanged);
  let summary: string;
  if (changed.length === 0) {
    summary = "各项与上次差不多";
  } else if (changed.length === 1) {
    const d = changed[0];
    summary = `${ttNow(d.label)}从「${ttNow(d.prevBand)}」变为「${ttNow(d.currBand)}」`;
  } else {
    summary = changed.map((d) => ttNow(d.label)).join("、") + "有变化";
  }

  return {
    prevTime: formatTime(previous.checkin_at),
    hasPrevious: true,
    diffs,
    summary,
  };
}

// 计算最近 N 次签到的阶段轨迹
export function recentPhaseTrajectory(
  checkins: CheckIn[],
  count: number = 5,
): PhasePoint[] {
  const sorted = [...checkins].sort(
    (a, b) =>
      new Date(b.checkin_at).getTime() - new Date(a.checkin_at).getTime(),
  );
  const recent = sorted.slice(0, count).reverse();
  return recent.map((c) => {
    const phase = detectPhase(c.weather_snapshot.climate, []);
    const cfg = getPhaseConfig(phase);
    return {
      phase,
      label: cfg.label,
      color: cfg.badgeClass,
      time: formatTime(c.checkin_at),
    };
  });
}

// 简短时间差（用于显示"比 1 小时前"）
export function timeGapShort(isoA: string, isoB: string): string {
  const diff = Math.abs(
    new Date(isoA).getTime() - new Date(isoB).getTime(),
  );
  const hours = diff / 3600_000;
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${Math.round(hours)} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
}
