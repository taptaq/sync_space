import { Check, Circle } from "lucide-react";
import { useStore } from "@/store/useStore";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function LoopProgressCard() {
  const checkins = useStore((state) => state.checkins);
  const rules = useStore((state) => state.personalRules);
  const moments = useStore((state) => state.connectionMoments);
  const executions = useStore((state) => state.executions);
  const since = Date.now() - WEEK_MS;

  const warningCount = checkins.filter(
    (item) => new Date(item.checkin_at).getTime() >= since,
  ).length;
  const understandingCount = rules.filter(
    (rule) => new Date(rule.updated_at).getTime() >= since,
  ).length;
  const connectionCount = moments.filter(
    (moment) => new Date(moment.connected_at).getTime() >= since,
  ).length;
  const helpfulCount = executions.filter(
    (execution) =>
      execution.feedback === "helpful" &&
      new Date(execution.executed_at).getTime() >= since,
  ).length;

  const stages = [
    { label: "看见信号", count: warningCount, done: warningCount > 0 },
    { label: "更新理解", count: understandingCount, done: understandingCount > 0 },
    { label: "完成连接", count: connectionCount, done: connectionCount > 0 },
  ];
  const loopComplete = stages.every((stage) => stage.done);

  return (
    <section className="border-t border-edge/70 pt-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-primary">最近七天</p>
          <h2 className="mt-1 font-serif text-xl text-ink">
            {loopComplete ? "你走完了一次完整循环" : "正在形成自己的支持循环"}
          </h2>
        </div>
        <span className="shrink-0 text-xs text-ink-faint">不会清零</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {stages.map((stage) => (
          <div key={stage.label} className="min-w-0 border-l-2 border-edge pl-2.5">
            <div className="flex items-center gap-1.5">
              {stage.done ? (
                <Check size={13} className="shrink-0 text-sage" />
              ) : (
                <Circle size={11} className="shrink-0 text-ink-faint" />
              )}
              <span className="truncate text-xs text-ink-muted">{stage.label}</span>
            </div>
            <p className="mt-1 font-mono text-lg text-ink">{stage.count}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        {helpfulCount > 0
          ? `其中有 ${helpfulCount} 次支持被你标记为有帮助。`
          : "即使某次方法没有帮助，也是在更新对自己的理解。"}
      </p>
    </section>
  );
}
