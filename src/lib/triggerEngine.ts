import type { CheckIn, NeuroType, Phase, Protocol } from "@/types";
import { getAxisProfile, getBandLabel } from "@/lib/axisConfig";
import { phasePriority } from "@/lib/stageEngine";

// 协议触发引擎（PRD §07）
// 监听最近签到，匹配协议触发条件
// 协议基于原始轴值 + 操作符判断（用户设置阈值时看到的就是原始值）
// 阶段优先级：当前阶段命中的协议优先于通用协议

export interface TriggerResult {
  matched: boolean;
  protocol: Protocol | null;
  reason: string;
}

// 判断单条协议是否被当前签到触发
export function checkProtocolTrigger(
  protocol: Protocol,
  checkin: CheckIn,
): boolean {
  if (protocol.status !== "active") return false;
  const { trigger } = protocol;
  if (trigger.type !== "threshold" || !trigger.axis || trigger.value == null) {
    return false;
  }

  const axisValue =
    trigger.axis === "sensory"
      ? checkin.axis_sensory
      : trigger.axis === "social"
        ? checkin.axis_social
        : checkin.axis_predictability;

  const op = trigger.operator ?? ">";
  switch (op) {
    case ">":
      return axisValue > (trigger.value as number);
    case ">=":
      return axisValue >= (trigger.value as number);
    case "<":
      return axisValue < (trigger.value as number);
    case "<=":
      return axisValue <= (trigger.value as number);
    default:
      return false;
  }
}

// 从签到匹配所有活跃协议，返回阶段优先级最高的命中（PRD：每日上限 3 次，由 store 控制）
// 除了瞬时阈值触发，还检查累积条件（连续 N 次签到轴值偏低/偏高）
export function matchTriggers(
  protocols: Protocol[],
  checkin: CheckIn,
  neuroType: NeuroType = "asd",
  currentPhase?: Phase,
  recentCheckins: CheckIn[] = [],
): TriggerResult {
  // 1. 瞬时阈值触发
  const hits = protocols.filter((p) => checkProtocolTrigger(p, checkin));

  // 2. 累积条件触发：检查最近 N 次签到的趋势
  // ADHD 场景：连续 3 次多巴胺/启动轴偏低 → 触发执行支持协议
  // ASD 场景：连续 3 次感官轴偏高 → 触发感官降载协议
  if (recentCheckins.length >= 3) {
    const last3 = recentCheckins.slice(-3);
    const cumulativeHit = checkCumulativeCondition(last3, protocols, neuroType);
    if (cumulativeHit && !hits.some((h) => h.id === cumulativeHit.id)) {
      hits.push(cumulativeHit);
    }
  }

  if (hits.length === 0) {
    return { matched: false, protocol: null, reason: "" };
  }

  // 按阶段优先级排序：当前阶段命中的 > 推荐标签命中 > 通用 > 不适用
  // 不适用（priority 3）的协议仍可触发，只是排最后——避免漏触发
  const sorted = [...hits].sort((a, b) => {
    const pa = currentPhase
      ? phasePriority(a.phases, currentPhase)
      : 2;
    const pb = currentPhase
      ? phasePriority(b.phases, currentPhase)
      : 2;
    return pa - pb;
  });

  const p = sorted[0];
  const profile = getAxisProfile(neuroType);
  const axisCfg = profile.axes.find((a) => a.key === p.trigger.axis);
  const band =
    axisCfg && p.trigger.value != null
      ? getBandLabel(p.trigger.value, axisCfg)
      : "";
  const reason = band
    ? `你的${axisLabel(p.trigger.axis, neuroType)}到了「${band.zh}」——你和自己约定过：这时候${p.action.description.zh}。现在去吗？`
    : `你的${axisLabel(p.trigger.axis, neuroType)}在升——你和自己约定过：这时候${p.action.description.zh}。现在去吗？`;
  return { matched: true, protocol: p, reason };
}

// 累积条件检测：基于最近 N 次签到的趋势匹配协议
// ASD：连续 3 次感官轴 raw ≥ 7 → 感官降载协议
// ADHD：连续 3 次多巴胺/启动轴 raw ≤ 3 → 执行支持协议
function checkCumulativeCondition(
  recentCheckins: CheckIn[],
  protocols: Protocol[],
  neuroType: NeuroType,
): Protocol | null {
  if (neuroType === "asd") {
    // ASD：连续 3 次感官偏高 → 推荐感官降载协议
    const allHighSensory = recentCheckins.every((c) => c.axis_sensory >= 7);
    if (allHighSensory) {
      // 找到感官类协议（sensory 或 grounding 类）
      const sensoryProtocol = protocols.find(
        (p) =>
          p.status === "active" &&
          (p.trigger.axis === "sensory" || p.action.description.zh.includes("感官")),
      );
      return sensoryProtocol ?? null;
    }
  } else if (neuroType === "adhd") {
    // ADHD：连续 3 次启动/多巴胺偏低（predictability 轴对 ADHD = 启动阻力，低值=困难）
    // ADHD 的 predictability 方向是 reverse，raw 低 = strain 高
    const allLowDopamine = recentCheckins.every((c) => c.axis_predictability <= 3);
    if (allLowDopamine) {
      // 找到执行支持类协议
      const execProtocol = protocols.find(
        (p) =>
          p.status === "active" &&
          (p.trigger.axis === "predictability" || p.action.description.zh.includes("启动")),
      );
      return execProtocol ?? null;
    }
  }
  return null;
}

// 轴标签（按神经特质动态生成）
export function axisLabel(axis: string | undefined, neuroType: NeuroType = "asd"): string {
  if (!axis) return "状态";
  const profile = getAxisProfile(neuroType);
  const found = profile.axes.find((a) => a.key === axis);
  return found ? found.label.zh : "状态";
}
