import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import InterestTimer from "@/components/today/InterestTimer";

// ASD 能量档案 · 放在理解页底部
// 理念：理解自己包括"理解什么能让我充电"
// ASD 的特殊兴趣是稳定能量源，沉浸带来平静和秩序
// 这里既记录当下沉浸，也回看历史充电来源

function formatHMS(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}小时${m}分`;
  if (m > 0) return `${m}分${sec}秒`;
  return `${sec}秒`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 3600_000));
  if (diffDays === 0) return `今天 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  if (diffDays === 1) return `昨天 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  if (diffDays < 7) return `${diffDays}天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function EnergyArchive() {
  const interestSessions = useStore((s) => s.interestSessions);
  const { tr } = useT();

  // 按话题聚合统计：每个话题累计多少时间
  const topicStats = useMemo(() => {
    const map = new Map<string, { topic: string; totalSec: number; count: number; lastAt: string }>();
    for (const session of interestSessions) {
      const key = session.topic.trim();
      if (!key) continue;
      const existing = map.get(key) ?? { topic: key, totalSec: 0, count: 0, lastAt: session.started_at };
      existing.totalSec += session.duration_sec;
      existing.count += 1;
      if (new Date(session.started_at).getTime() > new Date(existing.lastAt).getTime()) {
        existing.lastAt = session.started_at;
      }
      map.set(key, existing);
    }
    return [...map.values()].sort((a, b) => b.totalSec - a.totalSec).slice(0, 5);
  }, [interestSessions]);

  // 本周总时长
  const weekTotalSec = useMemo(() => {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return interestSessions
      .filter((s) => now - new Date(s.started_at).getTime() < weekMs)
      .reduce((sum, s) => sum + Math.max(0, s.duration_sec), 0);
  }, [interestSessions]);

  return (
    <section className="space-y-4">
      <div className="px-1">
        <p className="flex items-center gap-1.5 text-xs font-medium text-clay">
          <Sparkles size={13} />
          {tr("energy_archive_title")}
        </p>
        <h2 className="mt-1 font-serif text-xl text-ink">{tr("energy_archive_subtitle")}</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{tr("energy_archive_desc")}</p>
      </div>

      {/* 当下沉浸计时 */}
      <InterestTimer />

      {/* 本周总览 */}
      <div className="rounded-card border border-clay/20 bg-white/40 p-4">
        <p className="text-[11px] text-ink-faint">{tr("energy_archive_week_total")}</p>
        <p className="mt-1 font-mono text-lg text-clay tabular-nums">{formatHMS(weekTotalSec)}</p>
      </div>

      {/* 充电源排行 · 看清什么最能充电 */}
      {topicStats.length > 0 && (
        <div className="rounded-card border border-edge bg-white/55 p-4">
          <p className="mb-3 text-xs text-ink-muted">{tr("energy_archive_top_sources")}</p>
          <ul className="space-y-2.5">
            {topicStats.map((stat, idx) => (
              <li key={stat.topic} className="flex items-center gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clay-mist/40 text-[11px] font-medium text-clay">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-ink">{stat.topic}</p>
                  <p className="text-[11px] text-ink-faint">
                    {tr("energy_archive_session_count", { count: stat.count })} · {formatDate(stat.lastAt)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-clay tabular-nums">{formatHMS(stat.totalSec)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {interestSessions.length === 0 && (
        <p className="px-1 text-xs leading-relaxed text-ink-faint">{tr("energy_archive_empty_hint")}</p>
      )}
    </section>
  );
}
