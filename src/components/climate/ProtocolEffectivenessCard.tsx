import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Protocol, ProtocolExecution } from "@/types";

// 协议聚合效果分 · 与支持规则线对称
// 算每条协议的执行次数 + 有效率（helpful / total feedback）
// 解决"协议线无聚合统计"的断点

type ProtocolStat = {
  protocol: Protocol;
  totalExecs: number;
  feedbackCount: number; // 有反馈的执行数
  helpfulCount: number;
  effectiveness: number; // helpful / feedbackCount，0 表示无反馈数据
};

function getProtocolEffectiveness(executions: ProtocolExecution[], protocolId: string): {
  total: number;
  feedbackCount: number;
  helpful: number;
} {
  const relevant = executions.filter((e) => e.protocol_id === protocolId && e.action_taken === "executed");
  const feedbackCount = relevant.filter((e) => e.feedback !== undefined).length;
  const helpful = relevant.filter((e) => e.feedback === "helpful").length;
  return { total: relevant.length, feedbackCount, helpful };
}

export default function ProtocolEffectivenessCard() {
  const protocols = useStore((s) => s.protocols);
  const executions = useStore((s) => s.executions);
  const { tr, tt } = useT();

  const stats = useMemo<ProtocolStat[]>(() => {
    return protocols
      .map((protocol) => {
        const { total, feedbackCount, helpful } = getProtocolEffectiveness(executions, protocol.id);
        return {
          protocol,
          totalExecs: total,
          feedbackCount,
          helpfulCount: helpful,
          effectiveness: feedbackCount > 0 ? helpful / feedbackCount : 0,
        };
      })
      .filter((s) => s.totalExecs > 0) // 只显示用过的协议
      .sort((a, b) => b.totalExecs - a.totalExecs || b.effectiveness - a.effectiveness);
  }, [protocols, executions]);

  if (stats.length === 0) {
    return (
      <section className="rounded-card border border-edge bg-white/40 p-5">
        <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <TrendingUp size={13} />
          {tr("protocol_effect_title")}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          {tr("protocol_effect_empty")}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-edge bg-white/55 p-5">
      <div className="mb-3 flex items-center gap-1.5">
        <TrendingUp size={13} className="text-primary" />
        <p className="text-xs font-medium text-primary">{tr("protocol_effect_title")}</p>
      </div>

      <ul className="space-y-3">
        {stats.map(({ protocol, totalExecs, feedbackCount, helpfulCount, effectiveness }) => {
          const hasFeedback = feedbackCount > 0;
          const percent = Math.round(effectiveness * 100);
          return (
            <li key={protocol.id} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-ink">
                  {tt(protocol.action.description)}
                </p>
                <span className="shrink-0 font-mono text-xs text-ink-faint tabular-nums">
                  {tr("protocol_effect_uses", { count: totalExecs })}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                {hasFeedback ? (
                  <>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge/50">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          percent >= 67 ? "bg-sage" : percent >= 34 ? "bg-clay" : "bg-warn",
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-xs tabular-nums",
                        percent >= 67 ? "text-sage" : percent >= 34 ? "text-clay" : "text-warn",
                      )}
                    >
                      {tr("protocol_effect_helpful_pct", { percent })}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-ink-faint">
                    {tr("protocol_effect_no_feedback")}
                  </span>
                )}
              </div>
              {hasFeedback && (
                <p className="mt-1 text-[11px] text-ink-faint">
                  {tr("protocol_effect_feedback_detail", { helpful: helpfulCount, total: feedbackCount })}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
