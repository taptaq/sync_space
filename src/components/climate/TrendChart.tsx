import { useState } from "react";
import { motion } from "framer-motion";
import type { AxisKey, CheckIn, ProtocolExecution } from "@/types";
import { cn } from "@/lib/utils";
import { getAxisProfile } from "@/lib/axisConfig";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

// 趋势回放折线图（PRD §05 F-05：三轴可切换查看，平滑曲线）
// 轴标签按神经特质动态切换
// 叠加协议执行标记（反思层 · 显示协议执行后下一次签到是否好转）

export default function TrendChart({
  checkins,
  executions,
}: {
  checkins: CheckIn[];
  executions?: ProtocolExecution[];
}) {
  const neuroType = useStore((s) => s.neuroType);
  const { tr, tt, lang } = useT();
  const profile = getAxisProfile(neuroType);
  const AXIS_CONFIG = profile.axes.map((a) => ({
    key: a.key,
    label: a.label,
    color: a.color,
    stroke: a.stroke,
    direction: a.direction,
    bands: a.bands,
  }));
  const [activeAxis, setActiveAxis] = useState<AxisKey>("sensory");
  const config = AXIS_CONFIG.find((a) => a.key === activeAxis)!;

  // 取最近 7 天数据
  const sorted = [...checkins].sort(
    (a, b) => new Date(a.checkin_at).getTime() - new Date(b.checkin_at).getTime(),
  );
  const recent = sorted.slice(-14);

  const width = 320;
  const height = 160;
  const padding = { top: 20, right: 16, bottom: 28, left: 16 };

  const points = recent.map((c, i) => {
    const value =
      activeAxis === "sensory"
        ? c.axis_sensory
        : activeAxis === "social"
          ? c.axis_social
          : c.axis_predictability;
    const x =
      padding.left +
      (i / Math.max(recent.length - 1, 1)) * (width - padding.left - padding.right);
    const y =
      padding.top +
      (1 - value / 10) * (height - padding.top - padding.bottom);
    // 犹豫时长映射到透明度（>3秒明显不确定 · 原创交互：让被动信号可见）
    const hesitationOpacity = Math.min(c.hesitation_ms / 8000, 0.7);
    return { x, y, value, time: c.checkin_at, hesitation: c.hesitation_ms, hesitationOpacity };
  });

  // 平滑曲线路径
  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `Q ${prev.x} ${prev.y} ${cx} ${(prev.y + p.y) / 2} T ${p.x} ${p.y}`;
    })
    .join(" ");

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
      : "";

  return (
    <div className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
      <div className="mb-3">
        <h3 className="font-serif text-lg text-ink">{tr("trend_chart_title")}</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
  {tr("trend_chart_axis_hint", {
            label: tt(config.label),
            low: tt(config.bands[0]),
            high: tt(config.bands[2]),
          })}
        </p>
      </div>

      {/* 轴切换 */}
      <div className="mb-4 flex gap-2">
        {AXIS_CONFIG.map((axis) => (
          <button
            key={axis.key}
            onClick={() => setActiveAxis(axis.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs transition-all duration-250",
              activeAxis === axis.key
                ? "bg-ink text-base"
                : "bg-white/50 text-ink-muted hover:bg-white/80",
            )}
          >
            {tt(axis.label)}
          </button>
        ))}
      </div>

      {points.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-small text-ink-muted">
          {tr("trend_chart_empty")}
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          preserveAspectRatio="none"
        >
          {/* Y 轴刻度标签 */}
          {[0, 5, 10].map((v) => {
            const y =
              padding.top + (1 - v / 10) * (height - padding.top - padding.bottom);
            return (
              <text
                key={`ylabel-${v}`}
                x={10}
                y={y + 3}
                textAnchor="start"
                className="fill-ink-faint"
                style={{ fontSize: "9px" }}
              >
                {v}
              </text>
            );
          })}

          {/* 网格线 */}
          {[2, 4, 6, 8].map((v) => {
            const y =
              padding.top + (1 - v / 10) * (height - padding.top - padding.bottom);
            return (
              <line
                key={v}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E0D9CC"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.6"
              />
            );
          })}

          {/* 渐变填充区域 */}
          <defs>
            <linearGradient id={`grad-${activeAxis}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.stroke} stopOpacity="0.18" />
              <stop offset="100%" stopColor={config.stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaD && <path d={areaD} fill={`url(#grad-${activeAxis})`} />}

          {/* 曲线 */}
          <motion.path
            key={activeAxis}
            d={pathD}
            fill="none"
            stroke={config.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* 数据点（犹豫热力图 · 犹豫时间长的点带柔和外圈光晕 + 半透明） */}
          {points.map((p, i) => (
            <motion.g
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.04, duration: 0.2 }}
            >
              {/* 犹豫光晕（hesitation > 2s 时显现） */}
              {p.hesitation > 2000 && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={5 + p.hesitationOpacity * 6}
                  fill={config.stroke}
                  opacity={p.hesitationOpacity * 0.25}
                />
              )}
              {/* 数据点本体（犹豫时间长的降低透明度） */}
              <circle
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#FAF7F2"
                stroke={config.stroke}
                strokeWidth="2"
                opacity={1 - p.hesitationOpacity * 0.5}
              />
            </motion.g>
          ))}

          {/* 协议执行标记：在最近签到时间点画三角标记 */}
          {executions
            ?.filter((e) => e.action_taken === "executed")
            .map((exec) => {
              const execTime = new Date(exec.executed_at).getTime();
              // 找到时间最近的签到点
              const nearestIdx = points.reduce((best, p, i) => {
                const d = Math.abs(
                  new Date(p.time).getTime() - execTime,
                );
                const bestD = Math.abs(
                  new Date(points[best].time).getTime() - execTime,
                );
                return d < bestD ? i : best;
              }, 0);
              const p = points[nearestIdx];
              if (!p) return null;
              return (
                <polygon
                  key={exec.id}
                  points={`${p.x},${p.y - 8} ${p.x - 4},${p.y - 14} ${p.x + 4},${p.y - 14}`}
                  fill={exec.feedback === "helpful" ? "#6B9E8A" : exec.feedback === "unhelpful" ? "#C4715A" : "#C4956A"}
                  opacity="0.85"
                />
              );
            })}

          {/* X 轴日期标签（首尾） */}
          {points.length > 0 && (
            <>
              <text
                x={points[0].x}
                y={height - 8}
                textAnchor="middle"
                className="fill-ink-muted"
                style={{ fontSize: "10px" }}
              >
                {new Date(points[0].time).toLocaleDateString(lang === "en" ? "en-US" : "zh-CN", {
                  month: "numeric",
                  day: "numeric",
                })}
              </text>
              <text
                x={points[points.length - 1].x}
                y={height - 8}
                textAnchor="middle"
                className="fill-ink-muted"
                style={{ fontSize: "10px" }}
              >
                {new Date(points[points.length - 1].time).toLocaleDateString(
                  lang === "en" ? "en-US" : "zh-CN",
                  { month: "numeric", day: "numeric" },
                )}
              </text>
            </>
          )}
        </svg>
      )}

      <div className="mt-3 space-y-1">
        <p className="text-xs text-ink-muted">
          {tr("trend_chart_count", { count: recent.length })}
        </p>
        <p className="flex items-center gap-1 text-[10px] text-ink-faint">
          <span className="inline-block h-2 w-2 rounded-full bg-clay/30" />
          {tr("trend_chart_halo_hint")}
        </p>
      </div>
    </div>
  );
}
