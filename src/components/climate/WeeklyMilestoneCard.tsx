import { useMemo } from "react";
import { CalendarHeart } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

// 本周回顾小卡 · 不上 streak 惩罚（断签没惩罚，只是回顾）
// 列出本周 4 个数字：签到/协议执行/self-connection/other-connection
// 周日（getDay()===0）触发时给一个温柔总结文案；其他日期只列数字
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function WeeklyMilestoneCard() {
  const checkins = useStore((s) => s.checkins);
  const executions = useStore((s) => s.executions);
  const connectionMoments = useStore((s) => s.connectionMoments);
  const { tr } = useT();

  const stats = useMemo(() => {
    const now = Date.now();
    const checkinCount = checkins.filter((c) => now - new Date(c.checkin_at).getTime() < WEEK_MS).length;
    const execCount = executions.filter(
      (e) => e.action_taken === "executed" && now - new Date(e.executed_at).getTime() < WEEK_MS,
    ).length;
    const selfCount = connectionMoments.filter(
      (m) => m.mode === "self" && now - new Date(m.connected_at).getTime() < WEEK_MS,
    ).length;
    const otherCount = connectionMoments.filter(
      (m) => m.mode === "other" && now - new Date(m.connected_at).getTime() < WEEK_MS,
    ).length;
    return { checkinCount, execCount, selfCount, otherCount };
  }, [checkins, executions, connectionMoments]);

  const total = stats.checkinCount + stats.execCount + stats.selfCount + stats.otherCount;
  if (total === 0) return null;

  const isSunday = new Date().getDay() === 0;

  const rows = [
    { key: "checkin", count: stats.checkinCount, labelKey: "weekly_checkin" as const },
    { key: "exec", count: stats.execCount, labelKey: "weekly_protocol" as const },
    { key: "self", count: stats.selfCount, labelKey: "weekly_self" as const },
    { key: "other", count: stats.otherCount, labelKey: "weekly_other" as const },
  ];

  return (
    <section className="rounded-card border border-edge bg-white/55 p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <CalendarHeart size={13} className="text-primary" />
        <p className="text-xs font-medium text-primary">{tr("weekly_title")}</p>
      </div>

      {isSunday && (
        <p className="mb-3 rounded-lg bg-primary-mist/15 px-3 py-2 text-xs leading-5 text-ink-muted">
          {tr("weekly_sunday_hint", { total })}
        </p>
      )}

      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">{tr(row.labelKey)}</span>
            <span className="font-mono text-xs text-ink tabular-nums">
              {tr("weekly_count", { n: row.count })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
