import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Eye } from "lucide-react";
import type { AxisKey, Phase } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { getParentBehaviors, behaviorsToRaw } from "@/lib/parentBehaviors";
import { detectPhase } from "@/lib/stageEngine";
import { isToday } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";

// 家长代理签到（家长观察行为选择 → 映射三轴 · 不需要孩子拿手机）
// 复用自主签到的冷却引导和时段进度逻辑，但签到方式改为"选行为"
const COOLDOWN_MINUTES = 30;

export default function ParentCheckInCard() {
  const addCheckIn = useStore((s) => s.addCheckIn);
  const neuroType = useStore((s) => s.neuroType);
  const currentWeather = useStore((s) => s.currentWeather);
  const crashMarks = useStore((s) => s.crashMarks);
  const checkins = useStore((s) => s.checkins);
  const getMinutesSinceLastCheckin = useStore((s) => s.getMinutesSinceLastCheckin);
  const { tr, tt } = useT();

  const groups = getParentBehaviors(neuroType);
  // 默认选中三轴中间档
  const [picks, setPicks] = useState<Record<AxisKey, string>>({
    sensory: groups[0].options[1].key,
    social: groups[1].options[1].key,
    predictability: groups[2].options[1].key,
  });
  const [done, setDone] = useState(false);

  const currentPhase = detectPhase(currentWeather.climate, crashMarks);

  const todayCheckins = useMemo(
    () => checkins.filter((c) => isToday(c.checkin_at)),
    [checkins],
  );
  const todayCount = todayCheckins.length;

  const minutesSinceLast = getMinutesSinceLastCheckin();
  const isCoolingDown = minutesSinceLast < COOLDOWN_MINUTES;

  const slots = useMemo(() => {
    const hours = todayCheckins.map((c) => new Date(c.checkin_at).getHours());
    return {
      morning: hours.some((h) => h >= 5 && h < 12),
      noon: hours.some((h) => h >= 12 && h < 17),
      evening: hours.some((h) => h >= 17 || h < 5),
    };
  }, [todayCheckins]);

  const handlePick = (axis: AxisKey, key: string) => {
    setPicks((p) => ({ ...p, [axis]: key }));
  };

  const handleSubmit = () => {
    const raw = behaviorsToRaw(picks, neuroType);
    addCheckIn(raw.sensory, raw.social, raw.predictability, 0);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  const cooldownText = done
    ? tr("parent_checkin_recorded")
    : isCoolingDown
      ? tr("parent_checkin_cooldown_wait", { minutes: minutesSinceLast })
      : todayCount === 0
        ? tr("parent_checkin_no_checkin")
        : tr("parent_checkin_today_count", { count: todayCount });

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-edge bg-white/60 p-6 shadow-soft"
    >
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h3 className="font-serif text-xl text-ink">{tr("parent_checkin_title")}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
            <Eye size={12} className="text-primary" />
            {tr("parent_checkin_subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              getPhaseBadgeClass(currentPhase),
            )}
          >
            {tr(getPhaseShortKey(currentPhase))}
          </span>
          <span className="font-mono text-xs text-ink-muted">
            {new Date().toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* 今日签到可视化（时段进度） */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {(["morning", "noon", "evening"] as const).map((slot) => {
            const filled = slots[slot];
            const slotLabels: Record<string, StringKey> = {
              morning: "parent_checkin_slot_morning",
              noon: "parent_checkin_slot_noon",
              evening: "parent_checkin_slot_evening",
            };
            return (
              <div
                key={slot}
                className={cn(
                  "flex h-10 flex-1 flex-col items-center justify-center rounded-lg border transition-all duration-300",
                  filled
                    ? "border-sage/40 bg-sage-mist/40"
                    : "border-edge bg-white/40",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    filled ? "text-sage" : "text-ink-faint",
                  )}
                >
                  {tr(slotLabels[slot])}
                </span>
                <span className="text-[10px] text-ink-faint">
                  {filled ? tr("parent_checkin_slot_done") : tr("parent_checkin_slot_pending")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 三轴行为选择（家长观察） */}
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.axis}>
            <p className="mb-2 text-small font-medium text-ink">{tt(g.label)}</p>
            <div className="grid grid-cols-1 gap-2">
              {g.options.map((opt) => {
                const selected = picks[g.axis] === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handlePick(g.axis, opt.key)}
                    disabled={done}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-250",
                      selected
                        ? "border-primary bg-primary-mist/40 shadow-glow"
                        : "border-edge bg-white/40 hover:bg-white/60 active:scale-[0.99]",
                      done && "opacity-60",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        selected ? "border-primary bg-primary" : "border-ink-faint",
                      )}
                    >
                      {selected && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path
                            d="M1 4l2.5 2.5L9 1"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-small text-ink">{tt(opt.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 冷却提示 */}
      {isCoolingDown && !done && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted"
        >
          <Clock size={12} className="text-ink-faint" />
          <span>{cooldownText}</span>
        </motion.div>
      )}

      {!isCoolingDown && !done && todayCount > 0 && (
        <p className="mt-3 text-center text-xs text-ink-muted">
          {cooldownText}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={done}
        className={cn(
          "mt-4 w-full rounded-full py-3 text-body font-medium transition-all duration-250",
          done
            ? "bg-sage text-white"
            : isCoolingDown
              ? "bg-edge text-ink-muted hover:bg-edge/80 active:scale-[0.98]"
              : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]",
        )}
      >
        {done ? (
          <span className="flex items-center justify-center gap-2">
            <Check size={18} /> {tr("parent_checkin_recorded")}
          </span>
        ) : isCoolingDown ? (
          tr("parent_checkin_still_checkin")
        ) : (
          tr("parent_checkin_record")
        )}
      </button>
      <p className="mt-2 text-center text-xs text-ink-faint">
        {isCoolingDown
          ? tr("parent_checkin_cooldown_hint")
          : tr("parent_checkin_default_hint")}
      </p>
    </motion.section>
  );
}

function getPhaseBadgeClass(phase: Phase): string {
  switch (phase) {
    case "stable": return "bg-sage-mist/60 text-sage";
    case "accumulating": return "bg-clay-mist/60 text-clay";
    case "warning": return "bg-warn-mist/60 text-warn";
    case "overload": return "bg-warn-mist/60 text-warn";
    case "recovery": return "bg-primary-mist/60 text-primary";
    default: return "bg-edge text-ink-muted";
  }
}

function getPhaseShortKey(phase: Phase): StringKey {
  switch (phase) {
    case "stable": return "phase_short_stable";
    case "accumulating": return "phase_short_accumulating";
    case "warning": return "phase_short_warning";
    case "overload": return "phase_short_overload";
    case "recovery": return "phase_short_recovery";
    default: return "phase_short_checkin";
  }
}
