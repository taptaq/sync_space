import { useMemo } from "react";
import { BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";
import { cn } from "@/lib/utils";

// 感官预算电池 · ASD 友好直觉化呈现
// 把数字（0-10）翻译成"今日还剩 X% 预算"的电池直觉
//
// 算法：
// - 取今日所有签到的感官轴平均值
// - budget = (10 - avg) × 10，范围 0-100%
// - 趋势：对比今日最早 vs 最晚签到的差值，正数=累积中，负数=在恢复

function isSameDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export default function SensoryBattery() {
  const checkins = useStore((s) => s.checkins);
  const { tr } = useT();

  const { budget, trend, sampleCount } = useMemo(() => {
    const today = new Date();
    const todayCheckins = checkins
      .filter((c) => isSameDay(c.checkin_at, today))
      .sort((a, b) => new Date(a.checkin_at).getTime() - new Date(b.checkin_at).getTime());

    if (todayCheckins.length === 0) {
      return { budget: null as number | null, trend: 0, sampleCount: 0 };
    }

    const sensoryValues = todayCheckins.map((c) => c.axis_sensory);
    const avg = sensoryValues.reduce((a, b) => a + b, 0) / sensoryValues.length;
    const budgetPct = Math.max(0, Math.min(100, Math.round((10 - avg) * 10)));

    const trend =
      todayCheckins.length >= 2
        ? todayCheckins[todayCheckins.length - 1].axis_sensory - todayCheckins[0].axis_sensory
        : 0;

    return { budget: budgetPct, trend, sampleCount: todayCheckins.length };
  }, [checkins]);

  if (budget === null) return null;

  // 颜色档位
  const level = budget >= 60 ? "high" : budget >= 30 ? "mid" : "low";
  const config = {
    high: {
      icon: BatteryFull,
      colorClass: "text-sage",
      barClass: "bg-sage",
      labelKey: "sensory_battery_high",
    },
    mid: {
      icon: BatteryMedium,
      colorClass: "text-clay",
      barClass: "bg-clay",
      labelKey: "sensory_battery_mid",
    },
    low: {
      icon: BatteryLow,
      colorClass: "text-warn",
      barClass: "bg-warn",
      labelKey: "sensory_battery_low",
    },
  }[level];

  const Icon = config.icon;
  const trendLabel =
    trend > 0 ? tr("sensory_battery_trend_up") : trend < 0 ? tr("sensory_battery_trend_down") : null;

  return (
    <section data-tour-id="sensory-battery" className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-mist/40",
            config.colorClass,
          )}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary">{tr("sensory_battery_title")}</p>
          <p className="mt-0.5 text-[11px] text-ink-faint">
            {tr("sensory_battery_desc")} · {tr("sensory_battery_sample", { count: sampleCount })}
          </p>

          {/* 电池可视化 */}
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-4 flex-1 overflow-hidden rounded-full border border-edge bg-white/50">
              <div
                className={cn("h-full rounded-full transition-all duration-500", config.barClass)}
                style={{ width: `${budget}%` }}
              />
            </div>
            <span className={cn("font-mono text-lg font-medium tabular-nums", config.colorClass)}>
              {budget}%
            </span>
          </div>

          {/* 状态描述 + 趋势 */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className={cn("font-medium", config.colorClass)}>{tr(config.labelKey as StringKey)}</span>
            {trendLabel && (
              <span className="text-ink-muted">
                {trendLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
