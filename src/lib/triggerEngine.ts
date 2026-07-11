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
export function matchTriggers(
  protocols: Protocol[],
  checkin: CheckIn,
  neuroType: NeuroType = "asd",
  currentPhase?: Phase,
): TriggerResult {
  // 收集所有命中的协议
  const hits = protocols.filter((p) => checkProtocolTrigger(p, checkin));
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
    ? `你的${axisLabel(p.trigger.axis, neuroType)}到了「${band}」——你和自己约定过：这时候${p.action.description}。现在去吗？`
    : `你的${axisLabel(p.trigger.axis, neuroType)}在升——你和自己约定过：这时候${p.action.description}。现在去吗？`;
  return { matched: true, protocol: p, reason };
}

// 轴标签（按神经特质动态生成）
export function axisLabel(axis: string | undefined, neuroType: NeuroType = "asd"): string {
  if (!axis) return "状态";
  const profile = getAxisProfile(neuroType);
  const found = profile.axes.find((a) => a.key === axis);
  return found?.label ?? "状态";
}
