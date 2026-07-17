import type { CheckIn, Phase } from "@/types";
import { detectPhase } from "@/lib/stageEngine";
import { useStore } from "@/store/useStore";

export interface TomorrowForecast {
  // 明日预告文案，如"明天周三，你过去几个周三通常在下午 3 点左右进入累积期"
  summary: string;
  // 预测的高风险时段（HH:MM），null 表示数据不足或无明显累积时段
  riskTime: string | null;
  // 预测的常见阶段
  likelyPhase: Phase | null;
  // 数据样本量（用于 UI 显示可信度）
  sampleSize: number;
}

// 需要提前预告的阶段（累积/预警/过载 · 内部分类，文案不使用"风险"一词）
const HIGH_RISK_PHASES: Phase[] = ["accumulating", "warning", "overload"];

const WEEKDAY_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const WEEKDAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// 阶段在预告文案中的自然语言描述（温柔叙事）
const PHASE_PHRASE_ZH: Record<Phase, string> = {
  stable: "状态通常比较平稳",
  accumulating: "会开始累积",
  warning: "会接近临界",
  overload: "容易过载",
  recovery: "通常在恢复中",
};

const PHASE_PHRASE_EN: Record<Phase, string> = {
  stable: "your state is usually steady",
  accumulating: "things tend to accumulate",
  warning: "you near a tipping point",
  overload: "overload tends to set in",
  recovery: "you're usually recovering",
};

// 把小时转为自然语言时段（summary 用自然语言，riskTime 仍用 HH:MM）
function hourToNaturalTime(hour: number, lang: "zh" | "en"): string {
  if (lang === "zh") {
    if (hour === 0) return "深夜";
    if (hour < 6) return "凌晨";
    if (hour < 12) return `上午 ${hour} 点`;
    if (hour === 12) return "中午 12 点";
    if (hour < 18) return `下午 ${hour - 12} 点`;
    return `晚上 ${hour - 12} 点`;
  }
  if (hour === 0) return "midnight";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "noon";
  return `${hour - 12} PM`;
}

export function getTomorrowForecast(checkins: CheckIn[]): TomorrowForecast | null {
  if (!checkins || checkins.length === 0) return null;

  // 取明日的星期几
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 3600_000);
  const tomorrowDow = tomorrow.getDay();

  // 筛选同星期几的历史签到
  const sameDayCheckins = checkins.filter((c) => {
    const d = new Date(c.checkin_at);
    if (isNaN(d.getTime())) return false;
    return d.getDay() === tomorrowDow;
  });

  // 至少 3 条同星期几的签到才返回结果
  if (sameDayCheckins.length < 3) return null;

  // 为每条签到计算阶段与所属小时（历史签到不带崩溃标记，与 ClimatePostcard 一致）
  const items = sameDayCheckins.map((c) => {
    const d = new Date(c.checkin_at);
    const phase = detectPhase(c.weather_snapshot.climate, []);
    return { phase, hour: d.getHours() };
  });

  // 按小时分桶：统计高风险阶段出现次数与各阶段频次
  const hourRiskCount = new Map<number, number>();
  const hourPhaseCount = new Map<number, Map<Phase, number>>();
  for (const item of items) {
    if (HIGH_RISK_PHASES.includes(item.phase)) {
      hourRiskCount.set(item.hour, (hourRiskCount.get(item.hour) ?? 0) + 1);
    }
    if (!hourPhaseCount.has(item.hour)) hourPhaseCount.set(item.hour, new Map());
    const phaseMap = hourPhaseCount.get(item.hour)!;
    phaseMap.set(item.phase, (phaseMap.get(item.phase) ?? 0) + 1);
  }

  const lang = (useStore.getState().language ?? "zh") as "zh" | "en";
  const weekday = lang === "zh" ? WEEKDAY_ZH[tomorrowDow] : WEEKDAY_EN[tomorrowDow];

  // 找出累积/预警/过载出现频率最高的时段
  let riskHour: number | null = null;
  let maxRiskCount = 0;
  for (const [hour, count] of hourRiskCount) {
    if (count > maxRiskCount) {
      maxRiskCount = count;
      riskHour = hour;
    }
  }

  if (riskHour !== null) {
    // 该时段内最常见的阶段
    const phaseMap = hourPhaseCount.get(riskHour)!;
    let likelyPhase: Phase = "accumulating";
    let maxPhaseCount = 0;
    for (const [phase, count] of phaseMap) {
      if (count > maxPhaseCount) {
        maxPhaseCount = count;
        likelyPhase = phase;
      }
    }
    const riskTime = `${String(riskHour).padStart(2, "0")}:00`;
    const naturalTime = hourToNaturalTime(riskHour, lang);
    const phasePhrase = lang === "zh" ? PHASE_PHRASE_ZH[likelyPhase] : PHASE_PHRASE_EN[likelyPhase];
    const summary = lang === "zh"
      ? `明天${weekday}，过去的${weekday}你通常在${naturalTime}左右${phasePhrase}，那个时段你可以多照顾自己一点`
      : `Tomorrow is ${weekday}. On past ${weekday}s, around ${naturalTime}, ${phasePhrase}. Take a little extra care of yourself then.`;
    return { summary, riskTime, likelyPhase, sampleSize: sameDayCheckins.length };
  }

  // 无明显高风险时段：取所有签到中最常见的阶段
  const overallPhaseCount = new Map<Phase, number>();
  for (const item of items) {
    overallPhaseCount.set(item.phase, (overallPhaseCount.get(item.phase) ?? 0) + 1);
  }
  let likelyPhase: Phase = "stable";
  let maxCount = 0;
  for (const [phase, count] of overallPhaseCount) {
    if (count > maxCount) {
      maxCount = count;
      likelyPhase = phase;
    }
  }
  const phasePhrase = lang === "zh" ? PHASE_PHRASE_ZH[likelyPhase] : PHASE_PHRASE_EN[likelyPhase];
  const summary = lang === "zh"
    ? `明天${weekday}，过去的${weekday}你${phasePhrase}，记得给自己留些柔软的空间`
    : `Tomorrow is ${weekday}. On past ${weekday}s, ${phasePhrase}. Remember to leave yourself some gentle space.`;
  return { summary, riskTime: null, likelyPhase, sampleSize: sameDayCheckins.length };
}
