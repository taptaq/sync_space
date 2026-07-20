import { useMemo } from "react";
import { HeartHandshake } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// 支持规则效果卡 · 与 ProtocolEffectivenessCard 对称
// 问题背景：用户在 Connection 页用 SupportRule 时只更新 uses/helpfulCount，
// 不写 executions 数组，所以 ProtocolEffectivenessCard 看不到任何东西。
// 这张卡补足 SupportRule 线的统计 + 显示 self/other 模式分布。

type SupportStat = {
  ruleId: string;
  trigger: string;
  action: string;
  uses: number;
  helpfulCount: number;
  // 从 connectionMoments 派生：self vs other 各几次
  selfCount: number;
  otherCount: number;
  effectiveness: number; // helpfulCount / uses，0 表示无反馈数据
};

export default function SupportRuleEffectivenessCard() {
  const supportRules = useStore((s) => s.supportRules);
  const connectionMoments = useStore((s) => s.connectionMoments);
  const { tr } = useT();

  const stats = useMemo<SupportStat[]>(() => {
    return supportRules
      .map((rule) => {
        const moments = connectionMoments.filter((m) => m.rule_id === rule.id);
        return {
          ruleId: rule.id,
          trigger: rule.trigger,
          action: rule.action,
          uses: rule.uses,
          helpfulCount: rule.helpfulCount,
          selfCount: moments.filter((m) => m.mode === "self").length,
          otherCount: moments.filter((m) => m.mode === "other").length,
          effectiveness: rule.uses > 0 ? rule.helpfulCount / rule.uses : 0,
        };
      })
      .filter((s) => s.uses > 0 || s.selfCount + s.otherCount > 0)
      .sort((a, b) => b.uses - a.uses || b.helpfulCount - a.helpfulCount);
  }, [supportRules, connectionMoments]);

  if (stats.length === 0) {
    return null;
  }

  return (
    <section className="rounded-card border border-edge bg-white/55 p-5">
      <div className="mb-3 flex items-center gap-1.5">
        <HeartHandshake size={13} className="text-primary" />
        <p className="text-xs font-medium text-primary">{tr("support_rule_effect_title")}</p>
      </div>

      <ul className="space-y-3">
        {stats.map(({ ruleId, trigger, action, uses, helpfulCount, selfCount, otherCount, effectiveness }) => {
          const hasFeedback = helpfulCount > 0;
          const percent = Math.round(effectiveness * 100);
          const totalConnections = selfCount + otherCount;
          return (
            <li key={ruleId} className="text-sm">
              <p className="min-w-0 truncate text-ink">{trigger}</p>
              <p className="mt-0.5 truncate text-xs text-ink-faint">{action}</p>

              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-ink-faint">
                  <span>{tr("support_rule_effect_uses", { count: uses })}</span>
                  {totalConnections > 0 && (
                    <span className="text-ink-faint/70">
                      · {tr("support_rule_effect_connections", { self: selfCount, other: otherCount })}
                    </span>
                  )}
                </div>
                {hasFeedback ? (
                  <span
                    className={cn(
                      "shrink-0 text-xs tabular-nums",
                      percent >= 67 ? "text-sage" : percent >= 34 ? "text-clay" : "text-warn",
                    )}
                  >
                    {tr("support_rule_effect_helpful_pct", { percent })}
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] text-ink-faint">
                    {tr("support_rule_effect_no_feedback")}
                  </span>
                )}
              </div>

              {hasFeedback && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-edge/50">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      percent >= 67 ? "bg-sage" : percent >= 34 ? "bg-clay" : "bg-warn",
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
