import { useMemo } from "react";
import { motion } from "framer-motion";
import type { CheckIn, CrashMark, ProtocolExecution } from "@/types";
import { detectPhase, getPhaseConfig } from "@/lib/stageEngine";
import { formatDateTime } from "@/lib/format";

// 气候游记（反思层 · 把时间线变成旅程地图）
// 每个签到是停留点 · 崩溃标记是避雨亭 · 协议执行是篝火
// 一周下来看到的不是数据列表，是一段走过的路

interface JourneyPoint {
  id: string;
  type: "checkin" | "crash" | "protocol";
  time: string;
  phase: string;
  label: string;
  y: number;
  detail: string;
}

export default function ClimateWanderer({
  checkins,
  crashMarks,
  executions,
}: {
  checkins: CheckIn[];
  crashMarks?: CrashMark[];
  executions?: ProtocolExecution[];
}) {
  const journey = useMemo(() => buildJourney(checkins, crashMarks ?? [], executions ?? []), [checkins, crashMarks, executions]);

  if (journey.length === 0) {
    return (
      <div className="rounded-card border border-edge bg-white/60 p-6 text-center">
        <p className="text-small text-ink-muted">还没有旅程数据 · 开始签到来开启你的气候游记</p>
      </div>
    );
  }

  const { points, path } = generatePath(journey);
  const width = 360;
  const height = 140;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-primary">气候游记</p>
        <p className="text-xs text-ink-muted">{journey.length} 个停留点</p>
      </div>

      {/* 游记地图 */}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* 路径曲线 */}
        <path
          d={path}
          fill="none"
          stroke="#E0D9CC"
          strokeWidth="2"
          strokeDasharray="4 3"
        />

        {/* 起点标记 */}
        <circle cx={points[0]?.cx ?? 0} cy={points[0]?.cy ?? 0} r="4" fill="#6B9E8A" opacity="0.5" />
        <text x={points[0]?.cx ?? 0} y={(points[0]?.cy ?? 0) + 16} textAnchor="middle" fontSize="9" fill="#888">出发</text>

        {/* 停留点 */}
        {points.map((p, i) => (
          <g key={p.id}>
            {/* 外圈光晕 */}
            {(p.type === "crash" || p.type === "protocol") && (
              <motion.circle
                cx={p.cx}
                cy={p.cy}
                r="8"
                fill={getPointColor(p.type, p.phase)}
                opacity="0.2"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            )}

            {/* 主圆 */}
            <motion.circle
              cx={p.cx}
              cy={p.cy}
              r={p.type === "checkin" ? 4 : 6}
              fill={getPointColor(p.type, p.phase)}
              stroke="#fff"
              strokeWidth="1.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
            />

            {/* 图标文字 */}
            {(p.type === "crash" || p.type === "protocol") && (
              <text x={p.cx} y={p.cy - 8} textAnchor="middle" fontSize="8" dominantBaseline="auto">
                {p.type === "crash" ? "🏕️" : "🔥"}
              </text>
            )}

            {/* 时间标签（每隔一个显示，避免拥挤） */}
            {i % 2 === 0 && (
              <text x={p.cx} y={p.cy + 16} textAnchor="middle" fontSize="8" fill="#B5AC9E">
                {formatDateTime(p.time).split(" ")[0]}
              </text>
            )}
          </g>
        ))}

        {/* 终点标记 */}
        {points.length > 1 && (
          <>
            <circle cx={points[points.length - 1].cx} cy={points[points.length - 1].cy} r="5" fill="none" stroke="#6B5FA0" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x={points[points.length - 1].cx} y={points[points.length - 1].cy - 10} textAnchor="middle" fontSize="9" fill="#6B5FA0">现在</text>
          </>
        )}
      </svg>

      {/* 图例 */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sage" /> 签到
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-warn" /> 🏕️ 避雨亭
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-clay" /> 🔥 篝火
        </span>
      </div>

      {/* 旅程叙事文字 */}
      <p className="mt-3 text-center text-xs text-ink-faint">
        {getJourneyNarrator(points)}
      </p>
    </motion.div>
  );
};

// 构建旅程点
function buildJourney(checkins: CheckIn[], crashMarks: CrashMark[], executions: ProtocolExecution[]): JourneyPoint[] {
  const all: JourneyPoint[] = [];

  // 签到点
  checkins.forEach((c) => {
    const phase = detectPhase(c.weather_snapshot.climate, []);
    const cfg = getPhaseConfig(phase as any);
    all.push({
      id: `chk_${c.id}`,
      type: "checkin",
      time: c.checkin_at,
      phase,
      label: cfg.label,
      y: 0,
      detail: cfg.narrative,
    });
  });

  // 崩溃标记（避雨亭）
  crashMarks.forEach((c) => {
    if (c.reviewed) return;
    const phase = c.weather_snapshot ? detectPhase(c.weather_snapshot.climate, []) : "overload";
    const cfg = getPhaseConfig(phase as any);
    all.push({
      id: `crash_${c.id}`,
      type: "crash",
      time: c.marked_at,
      phase,
      label: "避雨亭",
      y: 0,
      detail: "你在这里躲过雨，辛苦了",
    });
  });

  // 协议执行（篝火）
  executions
    .filter((e) => e.action_taken === "executed")
    .slice(0, 5)
    .forEach((e) => {
      all.push({
        id: `exec_${e.id}`,
        type: "protocol",
        time: e.executed_at,
        phase: "",
        label: "篝火",
        y: 0,
        detail: "你为自己点了一簇火",
      });
    });

  // 按时间排序，取最近 15 个
  return all.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()).slice(-15);
}

// 生成路径
function generatePath(points: JourneyPoint[]): { points: (JourneyPoint & { cx: number; cy: number })[]; path: string } {
  if (points.length === 0) return { points: [], path: "" };

  const width = 360;
  const height = 140;
  const padX = 30;
  const padY = 35;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  const sorted = [...points].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // 计算各点坐标，y 值根据阶段给不同高度（过载在底部，平稳在顶部）
  const phaseYOffset: Record<string, number> = {
    stable: 0.2,
    accumulating: 0.4,
    warning: 0.6,
    overload: 0.85,
    recovery: 0.5,
    "": 0.5,
  };

  const withCoords = sorted.map((p, i) => {
    const cx = padX + (i / Math.max(sorted.length - 1, 1)) * usableW;
    const phaseOffset = phaseYOffset[p.phase] ?? 0.5;
    const cy = padY + phaseOffset * usableH + (Math.sin(i * 0.8) * 8); // 加点自然波动
    return { ...p, cx, cy };
  });

  // 用贝塞尔曲线连接各点
  let path = "";
  for (let i = 0; i < withCoords.length; i++) {
    const p = withCoords[i];
    if (i === 0) {
      path = `M ${p.cx} ${p.cy}`;
    } else {
      const prev = withCoords[i - 1];
      const cx1 = prev.cx + (p.cx - prev.cx) / 3;
      const cx2 = prev.cx + (2 * (p.cx - prev.cx)) / 3;
      path += ` C ${cx1} ${prev.cy}, ${cx2} ${p.cy}, ${p.cx} ${p.cy}`;
    }
  }

  return { points: withCoords, path };
}

function getPointColor(type: string, phase: string): string {
  if (type === "crash") return "#C4715A";
  if (type === "protocol") return "#C4956A";
  // checkin 颜色按阶段
  switch (phase) {
    case "stable": return "#6B9E8A";
    case "accumulating": return "#C4956A";
    case "warning": return "#DCB894";
    case "overload": return "#C4715A";
    case "recovery": return "#9A8FC4";
    default: return "#B5AC9E";
  }
}

function getJourneyNarrator(points: (JourneyPoint & { cx: number; cy: number })[]): string {
  const crashes = points.filter((p) => p.type === "crash").length;
  const campfires = points.filter((p) => p.type === "protocol").length;
  const checkins = points.filter((p) => p.type === "checkin").length;

  if (checkins === 0) return "你的旅程从这里开始";
  if (crashes > 0 && campfires > 0) return `你走了 ${checkins} 次签到，躲了 ${crashes} 次雨，点了 ${campfires} 簇火`;
  if (crashes > 0) return `你走了 ${checkins} 次签到，躲了 ${crashes} 次雨`;
  if (campfires > 0) return `你走了 ${checkins} 次签到，为自己点了 ${campfires} 簇火`;
  return `你走了 ${checkins} 次签到，每一次都是记录`;
}
