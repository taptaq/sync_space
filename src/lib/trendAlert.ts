import type { CheckIn, NeuroType, LocalText } from "@/types";
import { getAxisProfile, toStrain, type AxisConfig } from "@/lib/axisConfig";

// 趋势预警引擎（PRD §01 灵魂：在过载前而非过载后被推一把）
// 分析最近 N 次签到的 strain 趋势，若持续上升则生成预警

export interface TrendAlert {
  level: "hint" | "warning"; // hint = 轻微上升，warning = 接近临界
  axis: AxisConfig; // 哪条轴在升
  message: LocalText; // 预警文案
}

// 计算单次签到的三轴 strain（0-10，10=最差）
export function checkinToStrains(
  checkin: CheckIn,
  neuroType: NeuroType,
): [number, number, number] {
  const profile = getAxisProfile(neuroType);
  const [a1, a2, a3] = profile.axes;
  return [
    toStrain(checkin.axis_sensory, a1.direction),
    toStrain(checkin.axis_social, a2.direction),
    toStrain(checkin.axis_predictability, a3.direction),
  ];
}

// 分析最近签到的趋势，返回预警（若有）
export function analyzeTrend(
  checkins: CheckIn[],
  neuroType: NeuroType,
): TrendAlert | null {
  // 按时间升序，取最近 3 次
  const sorted = [...checkins].sort(
    (a, b) => new Date(a.checkin_at).getTime() - new Date(b.checkin_at).getTime(),
  );
  const recent = sorted.slice(-3);
  if (recent.length < 2) return null;

  const profile = getAxisProfile(neuroType);
  const strains = recent.map((c) => checkinToStrains(c, neuroType));

  // 逐轴检查是否连续上升
  for (let i = 0; i < 3; i++) {
    const axis = profile.axes[i];
    const values = strains.map((s) => s[i]);

    // 连续上升：每次都比前一次高
    let rising = true;
    for (let j = 1; j < values.length; j++) {
      if (values[j] <= values[j - 1]) {
        rising = false;
        break;
      }
    }
    if (!rising) continue;

    const latest = values[values.length - 1];

    // warning：最近一次 strain ≥ 7（行动导向，非羞耻导向）
    if (latest >= 7) {
      return {
        level: "warning",
        axis,
        message: {
          zh: `${axis.label.zh}在升高（${latest.toFixed(1)}/10）· 现在执行一个协议可能比硬撑更省力`,
          en: `${axis.label.en} is rising (${latest.toFixed(1)}/10) · Running a protocol now may take less effort than pushing through`,
        },
      };
    }

    // hint：连续上升但未到 7
    if (latest >= 5) {
      return {
        level: "hint",
        axis,
        message: {
          zh: `${axis.label.zh}这两天在慢慢升高 · 留意一下，提前减负比事后修复轻松`,
          en: `${axis.label.en} has been slowly rising these past two days · Take note; offloading proactively is easier than repairing afterward`,
        },
      };
    }
  }

  return null;
}
