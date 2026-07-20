import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

// 模式识别洞察卡 · ASD 的多巴胺奖励来自「识别一个模式」
// 不靠随机掉落，靠真实数据中浮现的模式：
//   1. 协议连续 ≥3 次 helpful → "X 协议真的帮到你"
//   2. 支持规则 self+other 都用过 → "你正在把对自己的理解也对别人说"
//   3. 支持规则 helpfulCount ≥3 → "X 规则已经帮你 N 次"
// 只显示命中的洞察，没命中返回 null（不强凑）

type Insight = {
  key: string;
  text: string;
};

export default function ClimateInsightsCard() {
  const protocols = useStore((s) => s.protocols);
  const executions = useStore((s) => s.executions);
  const supportRules = useStore((s) => s.supportRules);
  const connectionMoments = useStore((s) => s.connectionMoments);
  const { tr, tt } = useT();

  const insights = useMemo<Insight[]>(() => {
    const list: Insight[] = [];

    // 1. 协议连续 ≥3 次 helpful
    for (const protocol of protocols) {
      const execs = executions
        .filter((e) => e.protocol_id === protocol.id && e.action_taken === "executed")
        .sort((a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime());
      // 取最近一段连续 helpful 的次数
      let streak = 0;
      for (let i = execs.length - 1; i >= 0; i--) {
        if (execs[i].feedback === "helpful") streak++;
        else break;
      }
      if (streak >= 3) {
        list.push({
          key: `protocol-streak-${protocol.id}`,
          text: tr("insight_protocol_streak", {
            action: tt(protocol.action.description),
            n: streak,
          }),
        });
        break; // 只展示一条
      }
    }

    // 2. 支持规则 self+other 都用过
    for (const rule of supportRules) {
      const moments = connectionMoments.filter((m) => m.rule_id === rule.id);
      const hasSelf = moments.some((m) => m.mode === "self");
      const hasOther = moments.some((m) => m.mode === "other");
      if (hasSelf && hasOther) {
        list.push({
          key: `rule-bridge-${rule.id}`,
          text: tr("insight_rule_bridge", { trigger: rule.trigger }),
        });
        break;
      }
    }

    // 3. 支持规则 helpfulCount ≥3
    for (const rule of supportRules) {
      if (rule.helpfulCount >= 3) {
        list.push({
          key: `rule-helpful-${rule.id}`,
          text: tr("insight_rule_helpful", {
            trigger: rule.trigger,
            n: rule.helpfulCount,
          }),
        });
        break;
      }
    }

    return list;
  }, [protocols, executions, supportRules, connectionMoments, tr, tt]);

  if (insights.length === 0) return null;

  return (
    <section className="rounded-card border border-primary/30 bg-primary-mist/15 p-4">
      <div className="mb-2 flex items-center gap-1.5">
        <Lightbulb size={13} className="text-primary" />
        <p className="text-xs font-medium text-primary">{tr("insight_title")}</p>
      </div>
      <ul className="space-y-2">
        {insights.map((insight) => (
          <li key={insight.key} className="rounded-lg bg-white/40 px-3 py-2 text-xs leading-5 text-ink">
            {insight.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
