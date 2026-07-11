import { motion } from "framer-motion";
import type { CrashMark, PhasePoint, WeatherSnapshot } from "@/types";
import ClimateFamiliar from "@/components/weather/ClimateFamiliar";
import { CheckinDiff } from "@/lib/checkinCompare";
import { detectPhase, getPhaseConfig } from "@/lib/stageEngine";
import { cn } from "@/lib/utils";

// 内在天气卡（PRD §05 F-01 + §09 气候类型映射 + 五阶段分层）
// 背景色调按当前阶段切换（阶段色调优先于气候色调）
// 支持 Before/After 签到对比 + 阶段移动迷你轨迹
export default function WeatherCard({
  weather,
  updatedAt,
  crashMarks,
  diff,
  trajectory,
}: {
  weather: WeatherSnapshot;
  updatedAt?: string;
  crashMarks?: CrashMark[];
  diff?: CheckinDiff | null;
  trajectory?: PhasePoint[];
}) {
  const phase = detectPhase(weather.climate, crashMarks ?? []);
  const phaseCfg = getPhaseConfig(phase);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden rounded-bowl p-7 shadow-soft",
        phaseCfg.toneClass,
      )}
    >
      {/* 阶段标签 */}
      <div className="mb-3 flex justify-center">
        <span
          className={cn(
            "rounded-full px-3 py-0.5 text-xs font-medium",
            phaseCfg.badgeClass,
          )}
        >
          {phaseCfg.label}
        </span>
      </div>

      {/* 气候精灵——"小小的我"（外化投射 · 不需要问感受，看一眼姿态就懂） */}
      <div className="mb-4 flex justify-center">
        <ClimateFamiliar phase={phase} size={72} />
      </div>

      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-ink-muted">
          当前气候
        </p>
        <h2 className="mt-1 font-serif text-3xl text-ink">
          {weather.climate_label}
        </h2>
        <p className="mx-auto mt-3 max-w-[18rem] text-small leading-relaxed text-ink-muted">
          {weather.description}
        </p>
      </div>

      {/* 阶段叙事 + 措施基调 */}
      <div className="mt-5 rounded-card bg-white/40 px-4 py-3 text-center">
        <p className="text-small leading-relaxed text-ink">
          {phaseCfg.narrative}
        </p>
        <p className="mt-1.5 text-xs text-ink-muted">{phaseCfg.measureTone}</p>
      </div>

      {/* Before/After 签到对比 */}
      {diff && diff.hasPrevious && (
        <div className="mt-3 rounded-card bg-white/30 px-4 py-2.5">
          <p className="text-xs text-ink-muted">
            比 {diff.prevTime}，{diff.summary}
          </p>
        </div>
      )}

      {/* 阶段移动迷你轨迹 */}
      {trajectory && trajectory.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {trajectory.map((point, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full ring-2 ring-white/60",
                    point.phase === phase && "ring-ink/30 scale-125",
                    getPhaseDotColor(point.phase),
                  )}
                />
                <span className="mt-0.5 font-mono text-[9px] text-ink-faint">
                  {point.time}
                </span>
              </div>
              {i < trajectory.length - 1 && (
                <div className="h-px w-3 bg-ink-faint/30" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 适合 / 不建议活动 */}
      <div className="mt-5 space-y-3">
        {weather.suitable.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {weather.suitable.map((item) => (
              <span
                key={item}
                className="rounded-full bg-white/50 px-3 py-1 text-xs text-ink"
              >
                {item}
              </span>
            ))}
          </div>
        )}
        {weather.unsuitable.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-ink-muted">不建议</span>
            {weather.unsuitable.map((item) => (
              <span
                key={item}
                className="rounded-full bg-warn/20 px-3 py-1 text-xs text-warn line-through decoration-warn/40"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {updatedAt && (
        <p className="mt-5 text-center text-xs text-ink-muted/70">
          更新于 {updatedAt}
        </p>
      )}
    </motion.section>
  );
}

// 阶段轨迹点颜色
function getPhaseDotColor(phase: string): string {
  switch (phase) {
    case "stable":
      return "bg-sage";
    case "accumulating":
      return "bg-clay";
    case "warning":
      return "bg-warn-soft";
    case "overload":
      return "bg-warn";
    case "recovery":
      return "bg-primary-soft";
    default:
      return "bg-ink-faint";
  }
}
