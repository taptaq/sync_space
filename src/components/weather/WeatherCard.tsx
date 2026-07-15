import { motion } from "framer-motion";
import type { CrashMark, Phase, PhasePoint, WeatherSnapshot } from "@/types";
import ClimateFamiliar from "@/components/weather/ClimateFamiliar";
import { CheckinDiff } from "@/lib/checkinCompare";
import { detectPhase, getPhaseConfigForType } from "@/lib/stageEngine";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// 内在天气卡（PRD §05 F-01 + §09 气候类型映射 + 五阶段分层）
// 背景色调按当前阶段切换（阶段色调优先于气候色调）
// 阶段叙事按神经特质分化（ASD 侧重视官，ADHD 侧重执行功能）
// 支持 Before/After 签到对比 + 阶段移动迷你轨迹
// 气压计：常驻渐变条，用户随时看到离临界点多远（原创交互 · 非推送惊吓）
export default function WeatherCard({
  weather,
  updatedAt,
  crashMarks,
  diff,
  trajectory,
  pressureValue,
  compact = false,
  statusLabel = "当前气候",
}: {
  weather: WeatherSnapshot;
  updatedAt?: string;
  crashMarks?: CrashMark[];
  diff?: CheckinDiff | null;
  trajectory?: PhasePoint[];
  // 气压值 0-100，由三轴均值或阶段映射计算传入
  pressureValue?: number;
  compact?: boolean;
  statusLabel?: string;
}) {
  const neuroType = useStore((s) => s.neuroType);
  const { tr, tt } = useT();
  const phase = detectPhase(weather.climate, crashMarks ?? []);
  const phaseCfg = getPhaseConfigForType(phase, neuroType);
  const pressure = pressureValue ?? phaseToPressure(phase);
  const pressureLabel =
    pressure < 30
      ? tr("weather_pressure_calm")
      : pressure < 55
        ? tr("weather_pressure_rising")
        : pressure < 80
          ? tr("weather_pressure_near")
          : tr("weather_pressure_peak");

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden rounded-bowl shadow-soft",
        compact ? "rounded-card px-6 py-7" : "p-7",
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
          {tt(phaseCfg.label)}
        </span>
      </div>

      {/* 气候精灵——"小小的我"（外化投射 · 不需要问感受，看一眼姿态就懂） */}
      <div className={cn("flex justify-center", compact ? "mb-3" : "mb-4")}>
        <ClimateFamiliar phase={phase} size={compact ? 52 : 72} />
      </div>

      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-ink-muted">
          {statusLabel}
        </p>
        <h2 className="mt-1 font-serif text-3xl text-ink">
          {tt(weather.climate_label)}
        </h2>
        <p className={cn(
          "mx-auto max-w-[18rem] text-small leading-relaxed text-ink-muted",
          compact ? "mt-2" : "mt-3",
        )}>
          {tt(weather.description)}
        </p>
      </div>

      {/* 阶段叙事 + 措施基调 */}
      {!compact && <div className="mt-5 rounded-card bg-white/30 px-4 py-3 text-center backdrop-blur-sm">
        <p className="font-handwriting text-lg leading-relaxed text-ink">
          {tt(phaseCfg.narrative)}
        </p>
        <p className="mt-1.5 text-xs text-ink-muted">{tt(phaseCfg.measureTone)}</p>
      </div>}

      {/* 气压计（常驻渐变条 · 用户随时看到离临界点多远 · 非推送惊吓） */}
      <div className={cn("px-2", compact ? "mt-5" : "mt-4")}>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-ink-muted">{tr("weather_pressure")}</span>
          <span className="text-[10px] text-ink-muted">{pressureLabel}</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-white/40">
          {/* 渐变底色：鼠尾草绿 → 陶土黄 → 警示橙红 */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(to right, #a8c5a8 0%, #d4b896 45%, #c9785e 75%, #a8523c 100%)",
            }}
          />
          {/* 当前位置指示器 */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ left: "0%" }}
            animate={{ left: `${Math.min(pressure, 100)}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ transform: "translateX(-50%)" }}
          >
            <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-white shadow-sm" />
          </motion.div>
          {/* 半透明遮罩压暗未达到的部分 */}
          <div
            className="absolute inset-y-0 right-0 bg-white/30"
            style={{ width: `${100 - pressure}%`, left: `${pressure}%` }}
          />
        </div>
      </div>

      {/* Before/After 签到对比 */}
      {diff && diff.hasPrevious && (
        <div className="mt-4 rounded-card bg-white/40 px-4 py-3">
          <p className="text-xs text-ink-muted">
            {tr("weather_compared_to")} {diff.prevTime}，{diff.summary}
          </p>
        </div>
      )}

      {/* 阶段移动迷你轨迹 */}
      {!compact && trajectory && trajectory.length > 1 && (
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
      {!compact && <div className="mt-5 space-y-3">
        {weather.suitable.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {weather.suitable.map((item, i) => (
              <span
                key={i}
                className="rounded-full bg-white/50 px-3 py-1 text-xs text-ink"
              >
                {tt(item)}
              </span>
            ))}
          </div>
        )}
        {weather.unsuitable.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-ink-muted">{tr("weather_not_suitable")}</span>
            {weather.unsuitable.map((item, i) => (
              <span
                key={i}
                className="rounded-full bg-warn/20 px-3 py-1 text-xs text-warn line-through decoration-warn/40"
              >
                {tt(item)}
              </span>
            ))}
          </div>
        )}
      </div>}

      {updatedAt && (
        <p className={cn("text-center text-xs text-ink-muted/70", compact ? "mt-6" : "mt-5")}>
          {statusLabel === tr("weather_current_climate") ? tr("weather_updated_at") : tr("weather_recorded_at")} {updatedAt}
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

// 阶段映射到气压值（0-100）
// stable=15, accumulating=45, warning=70, overload=92, recovery=35
function phaseToPressure(phase: Phase): number {
  switch (phase) {
    case "stable":
      return 15;
    case "accumulating":
      return 45;
    case "warning":
      return 70;
    case "overload":
      return 92;
    case "recovery":
      return 35;
    default:
      return 20;
  }
}
