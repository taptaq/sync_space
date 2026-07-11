import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Clock, Filter, Zap } from "lucide-react";
import type { TimelineEntry } from "@/types";
import { useStore } from "@/store/useStore";
import { formatDateTime, formatTime, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

// 回看页 · 过载后循环（PRD §05 页面3）
// 时间线 · 按时间倒序排列所有事件
type FilterType = "all" | "crash" | "protocol" | "checkin";

const FILTER_LABELS: { key: FilterType; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "crash", label: "崩溃" },
  { key: "protocol", label: "协议" },
  { key: "checkin", label: "签到" },
];

export default function Review() {
  const navigate = useNavigate();
  const checkins = useStore((s) => s.checkins);
  const executions = useStore((s) => s.executions);
  const crashMarks = useStore((s) => s.crashMarks);
  const protocols = useStore((s) => s.protocols);
  const [filter, setFilter] = useState<FilterType>("all");

  // 构建时间线
  const timeline: TimelineEntry[] = [
    ...crashMarks.map((c) => ({
      id: c.id,
      type: "crash" as const,
      time: c.marked_at,
      title: "崩溃标记",
      detail: c.voice_text
        ? `语音记录 · ${c.voice_text.slice(0, 30)}…`
        : c.reviewed
          ? "已复盘"
          : "待复盘",
      weather_snapshot: c.weather_snapshot,
    })),
    ...executions.map((e) => {
      const protocol = protocols.find((p) => p.id === e.protocol_id);
      return {
        id: e.id,
        type: "protocol" as const,
        time: e.triggered_at,
        title: `协议触发 · ${
          e.action_taken === "executed" ? "已执行" : "已推迟"
        }`,
        detail: protocol?.action.description ?? "协议执行",
        weather_snapshot: undefined,
      };
    }),
    ...checkins.map((c) => ({
      id: c.id,
      type: "checkin" as const,
      time: c.checkin_at,
      title: "签到",
      detail: `感官 ${c.axis_sensory.toFixed(1)} · 社交 ${c.axis_social.toFixed(1)} · 可预测 ${c.axis_predictability.toFixed(1)}${
        c.response_delay_minutes > 120 ? " · 响应延迟（低能信号）" : ""
      }`,
      weather_snapshot: c.weather_snapshot,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .filter((t) => filter === "all" || t.type === filter);

  const unreviewedCrash = crashMarks.find((c) => !c.reviewed);

  return (
    <div className="space-y-5 pt-10">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="px-1"
      >
        <p className="text-xs uppercase tracking-widest text-primary">过载后循环</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">回看</h1>
        <p className="mt-1 text-small text-ink-muted">
          事后记录 · AI 解读 · 沉淀新协议
        </p>
      </motion.header>

      {/* 待复盘提示（PRD：崩溃标记后下次打开温和提示） */}
      {unreviewedCrash && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={() => navigate(`/review/${unreviewedCrash.id}`)}
          className="flex w-full items-center gap-4 rounded-bowl border border-clay/30 bg-clay-mist/40 p-5 text-left transition-all duration-250 hover:bg-clay-mist/60 active:scale-[0.99]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay/20">
            <Zap size={18} className="text-clay" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body font-medium text-ink">
              要整理一下昨天的记录吗？
            </p>
            <p className="text-xs text-ink-muted">
              {formatDateTime(unreviewedCrash.marked_at)} · 崩溃标记
            </p>
          </div>
          <ChevronRight size={18} className="text-ink-muted" />
        </motion.button>
      )}

      {/* 筛选 */}
      <div className="flex items-center gap-2 px-1">
        <Filter size={14} className="text-ink-muted" />
        {FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs transition-all duration-250",
              filter === key
                ? "bg-ink text-base"
                : "bg-white/50 text-ink-muted hover:bg-white/80",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 时间线 */}
      <div className="space-y-3">
        {timeline.length === 0 && (
          <div className="rounded-card border border-edge bg-white/40 p-8 text-center text-small text-ink-muted">
            还没有记录
          </div>
        )}
        {timeline.map((entry, i) => (
          <motion.button
            key={`${entry.type}-${entry.id}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              delay: i * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={() =>
              entry.type === "crash" && navigate(`/review/${entry.id}`)
            }
            className={cn(
              "flex w-full gap-4 rounded-card border border-edge bg-white/50 p-4 text-left transition-all duration-250",
              entry.type === "crash"
                ? "hover:bg-clay-mist/30 active:scale-[0.99]"
                : "cursor-default",
            )}
          >
            {/* 时间标记 */}
            <div className="flex shrink-0 flex-col items-center pt-0.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  entry.type === "crash" && "bg-warn/15 text-warn",
                  entry.type === "protocol" && "bg-primary-mist text-primary",
                  entry.type === "checkin" && "bg-sage-mist text-sage",
                )}
              >
                {entry.type === "crash" && <Zap size={14} />}
                {entry.type === "protocol" && <Clock size={14} />}
                {entry.type === "checkin" && <Clock size={14} />}
              </div>
              {i < timeline.length - 1 && (
                <div className="mt-1 h-full w-px flex-1 bg-edge" />
              )}
            </div>

            {/* 内容 */}
            <div className="min-w-0 flex-1 pb-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-small font-medium text-ink">
                  {entry.title}
                </span>
                <span className="shrink-0 font-mono text-xs text-ink-muted">
                  {formatTime(entry.time)}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {entry.detail}
              </p>
              {entry.weather_snapshot && (
                <p className="mt-1.5 text-xs text-ink-faint">
                  当日气候：{entry.weather_snapshot.climate_label}
                </p>
              )}
              <p className="mt-1 text-xs text-ink-faint">
                {relativeTime(entry.time)}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
