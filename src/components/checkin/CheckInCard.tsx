import { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, ChevronDown } from "lucide-react";
import type { AxisKey, NeuroType, Phase } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { getAxisProfile } from "@/lib/axisConfig";
import EnergyPalette from "@/components/checkin/EnergyPalette";
import { detectPhase } from "@/lib/stageEngine";
import { isToday } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";

// 快速签到（PRD §05 F-02 · 重构：默认一键模式 · 三轴折叠）
// ASD 述情障碍 / ADHD 启动摩擦 → 主路径只需选一个整体感觉
// 想精细调整再展开三轴（不强迫 · 不评判）

interface CheckInCardProps {
  onSubmitted?: () => void;
}

const COOLDOWN_MINUTES = 30;

const EMOJI_SLOTS = [
  { value: 2, emoji: "😫", key: "checkin_very_bad" },
  { value: 4, emoji: "😟", key: "checkin_not_good" },
  { value: 5, emoji: "😐", key: "checkin_okay" },
  { value: 6, emoji: "🙂", key: "checkin_fairly_good" },
  { value: 8, emoji: "😊", key: "checkin_good" },
] as const;

const OBSERVABLE_SIGNALS = {
  adhd: [
    { key: "signal_adhd_cant_start", value: 3 },
    { key: "signal_adhd_switching", value: 4 },
    { key: "signal_adhd_cant_stop", value: 4 },
    { key: "signal_adhd_focused", value: 7 },
  ],
  asd: [
    { key: "signal_asd_sound_light", value: 3 },
    { key: "signal_asd_no_talk", value: 3 },
    { key: "signal_asd_change", value: 4 },
    { key: "signal_asd_stable", value: 7 },
  ],
} as const;

// 早期预警信号 · 按特质分化（ASD 侧重感官/社交退缩，ADHD 侧重执行/冲动）
// 用翻译 key 存储，渲染时通过 tr() 读取
const EARLY_SIGNALS_BY_TYPE: Record<NeuroType, StringKey[]> = {
  asd: [
    "early_signal_asd_0",
    "early_signal_asd_1",
    "early_signal_asd_2",
    "early_signal_asd_3",
    "early_signal_asd_4",
  ],
  adhd: [
    "early_signal_adhd_0",
    "early_signal_adhd_1",
    "early_signal_adhd_2",
    "early_signal_adhd_3",
    "early_signal_adhd_4",
  ],
  hsp: ["early_signal_hsp_0", "early_signal_hsp_1", "early_signal_hsp_2"],
  ptsd: ["early_signal_ptsd_0", "early_signal_ptsd_1", "early_signal_ptsd_2"],
  other: [
    "early_signal_other_0",
    "early_signal_other_1",
    "early_signal_other_2",
    "early_signal_other_3",
    "early_signal_other_4",
    "early_signal_other_5",
  ],
};

export default function CheckInCard({ onSubmitted }: CheckInCardProps) {
  const addCheckIn = useStore((s) => s.addCheckIn);
  const neuroType = useStore((s) => s.neuroType);
  const currentWeather = useStore((s) => s.currentWeather);
  const crashMarks = useStore((s) => s.crashMarks);
  const checkins = useStore((s) => s.checkins);
  const getMinutesSinceLastCheckin = useStore((s) => s.getMinutesSinceLastCheckin);
  const language = useStore((s) => s.language);
  const { tr } = useT();
  const profile = getAxisProfile(neuroType);
  const earlySignals = EARLY_SIGNALS_BY_TYPE[neuroType] ?? EARLY_SIGNALS_BY_TYPE.other;

  const [simpleMode, setSimpleMode] = useState(true);
  const [simpleInputMode, setSimpleInputMode] = useState<"observable" | "feeling">(
    neuroType === "adhd" || neuroType === "asd" ? "observable" : "feeling",
  );
  const [selectedObservable, setSelectedObservable] = useState<string | null>(null);
  const [overall, setOverall] = useState<number | null>(null);
  const [values, setValues] = useState<Record<AxisKey, number>>(() => {
    const last = checkins[checkins.length - 1];
    if (last) {
      return {
        sensory: last.axis_sensory,
        social: last.axis_social,
        predictability: last.axis_predictability,
      };
    }
    return { sensory: 5, social: 5, predictability: 5 };
  });
  const [done, setDone] = useState(false);
  // 早期信号默认折叠（渐进披露 · 避免签到环节认知过载）
  // ASD 用户仍可主动展开，但不强制展示
  const [signalsOpen, setSignalsOpen] = useState(false);
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [noteText, setNoteText] = useState("");
  const downAtRef = useRef<number>(0);
  const totalHesitationRef = useRef<number>(0);

  const currentPhase = detectPhase(currentWeather.climate, crashMarks);

  const todayCheckins = useMemo(
    () => checkins.filter((c) => isToday(c.checkin_at)),
    [checkins],
  );
  const todayCount = todayCheckins.length;

  const minutesSinceLast = getMinutesSinceLastCheckin();
  const isCoolingDown = minutesSinceLast < COOLDOWN_MINUTES;

  const handleDown = () => {
    downAtRef.current = Date.now();
  };
  const handleUp = () => {
    if (downAtRef.current) {
      totalHesitationRef.current += Date.now() - downAtRef.current;
      downAtRef.current = 0;
    }
  };

  const handleChange = (key: AxisKey, value: number) => {
    handleUp();
    setValues((v) => ({ ...v, [key]: value }));
    handleDown();
  };

  const submitWith = (vals: Record<AxisKey, number>) => {
    handleUp();
    addCheckIn(vals.sensory, vals.social, vals.predictability, totalHesitationRef.current, {
      note: noteText || undefined,
      early_signals: selectedSignals.map((k) => tr(k as StringKey)),
    });
    setDone(true);
    onSubmitted?.();
    setTimeout(() => setDone(false), 3000);
  };

  // 一键签到：整体感受高=较好；按每条轴的好坏方向转换为原始值。
  const handleSimpleSubmit = () => {
    if (overall === null) return;
    const rawFor = (index: number) =>
      profile.axes[index].direction === "high-bad" ? 10 - overall : overall;
    submitWith({
      sensory: rawFor(0),
      social: rawFor(1),
      predictability: rawFor(2),
    });
  };

  const handleSubmit = () => submitWith(values);

  const handleSameAsLast = () => {
    const last = checkins[checkins.length - 1];
    if (!last) return;
    const lastVals: Record<AxisKey, number> = {
      sensory: last.axis_sensory,
      social: last.axis_social,
      predictability: last.axis_predictability,
    };
    setValues(lastVals);
    submitWith(lastVals);
  };

  const toggleSignal = (signal: string) => {
    setSelectedSignals((prev) =>
      prev.includes(signal) ? prev.filter((s) => s !== signal) : [...prev, signal],
    );
  };

  const hasLastCheckin = checkins.length > 0;

  const cooldownText = done
    ? tr("checkin_cooldown_done")
    : isCoolingDown
      ? tr("checkin_cooldown_wait", { minutes: minutesSinceLast })
      : todayCount === 0
        ? tr("checkin_no_checkin_today")
        : tr("checkin_today_count", { count: todayCount });

  const observableList = neuroType === "adhd" || neuroType === "asd"
    ? OBSERVABLE_SIGNALS[neuroType]
    : EMOJI_SLOTS;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-card border border-edge/60 p-6"
    >
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="font-serif text-xl text-ink">{tr("checkin_title")}</h3>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-xs", getPhaseBadgeClass(currentPhase))}>
            {tr(getPhaseShortKey(currentPhase))}
          </span>
          <span className="font-mono text-xs text-ink-muted">
            {new Date().toLocaleTimeString(language === "zh" ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {simpleMode ? (
          /* ===== 一键签到模式（默认 · 降低内感受+元认知双重负担） ===== */
          <motion.div
            key="simple"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-3 text-sm text-ink-muted">
              {tr(simpleInputMode === "observable" ? "checkin_observable_prompt" : "checkin_feeling_prompt")}
            </p>
            <div className={cn("gap-2", simpleInputMode === "observable" ? "grid grid-cols-2" : "flex justify-between")}>
              {(observableList).map((slot) => {
                const isObservable = !("emoji" in slot);
                const slotLabel = tr(slot.key as StringKey);
                const selected = overall === slot.value && (!isObservable || selectedObservable === slotLabel);
                return (
                  <motion.button
                    key={isObservable ? slotLabel : slot.value}
                    onClick={() => {
                      setOverall(slot.value);
                      if (isObservable) {
                        setSelectedObservable(slotLabel);
                        setSelectedSignals([slot.key as StringKey]);
                      }
                    }}
                    disabled={done}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      "flex min-h-12 flex-1 items-center justify-center gap-1 rounded-xl border px-2 py-3 transition-all duration-250",
                      !isObservable && "flex-col",
                      selected
                        ? "border-primary/40 bg-primary-mist/40 shadow-glow"
                        : "border-edge bg-white/40 hover:bg-white/70",
                    )}
                  >
                    {"emoji" in slot && <span className="text-2xl leading-none">{slot.emoji}</span>}
                    <span className={cn("text-[11px]", selected ? "font-medium text-primary" : "text-ink-faint")}>
                      {slotLabel}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {(neuroType === "adhd" || neuroType === "asd") && (
              <button
                type="button"
                onClick={() => {
                  setSimpleInputMode((mode) => mode === "observable" ? "feeling" : "observable");
                  setOverall(null);
                  setSelectedObservable(null);
                  setSelectedSignals([]);
                }}
                className="mx-auto mt-3 block text-xs text-ink-faint underline underline-offset-4"
              >
                {tr(simpleInputMode === "observable" ? "checkin_switch_feeling" : "checkin_switch_observable")}
              </button>
            )}

            {/* 提交按钮 */}
            <button
              onClick={handleSimpleSubmit}
              disabled={overall === null || done}
              className={cn(
                "text-body mt-4 w-full rounded-full py-3 font-medium transition-all duration-250",
                done
                  ? "bg-sage text-white"
                  : overall === null
                    ? "bg-edge text-ink-muted"
                    : isCoolingDown
                      ? "bg-edge text-ink-muted hover:bg-edge/80 active:scale-[0.98]"
                      : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]",
              )}
            >
              {done ? (
                <span className="flex items-center justify-center gap-2">
                  <Check size={18} /> {tr("checkin_submit_done")}
                </span>
              ) : isCoolingDown ? (
                tr("checkin_submit_cooldown")
              ) : (
                tr("checkin_submit_normal")
              )}
            </button>
            <p className="mt-2 text-center text-xs text-ink-faint">
              {tr(isCoolingDown ? "checkin_cooldown_hint" : "checkin_default_hint")}
            </p>

            {/* 展开三轴（可选 · 不强迫） */}
            <button
              onClick={() => setSimpleMode(false)}
              className="mx-auto mt-3 flex items-center gap-1 text-xs text-ink-faint transition-colors hover:text-ink-muted"
            >
              {tr("checkin_expand_axes")}
              <ChevronDown size={12} />
            </button>
          </motion.div>
        ) : (
          /* ===== 三轴精细模式（展开后 · 保留原有完整功能） ===== */
          <motion.div
            key="detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <EnergyPalette values={values} onChange={handleChange} />

            {/* 早期预警信号 */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setSignalsOpen((o) => !o)}
                className="flex w-full items-center justify-between text-xs text-ink-muted hover:text-ink"
              >
                <span>
                  {tr("checkin_early_signals")}
                  {selectedSignals.length > 0 ? tr("checkin_selected_count", { count: selectedSignals.length }) : ""}
                </span>
                <span className="text-ink-faint">{tr(signalsOpen ? "checkin_collapse" : "checkin_expand")}</span>
              </button>
              {signalsOpen && (
                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {earlySignals.map((signalKey) => {
                    const checked = selectedSignals.includes(signalKey);
                    return (
                      <label
                        key={signalKey}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                          checked
                            ? "border-sage/40 bg-sage-mist/40 text-ink"
                            : "border-edge bg-white/40 text-ink-muted hover:border-edge/80",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSignal(signalKey)}
                          className="h-3.5 w-3.5 accent-sage"
                        />
                        <span>{tr(signalKey)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 开放备注 */}
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={tr("checkin_note_placeholder")}
              rows={2}
              className="mt-3 w-full resize-none rounded-lg border border-edge bg-white/40 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-sage/40 focus:outline-none"
            />

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
              <p className="mt-3 text-center text-xs text-ink-muted">{cooldownText}</p>
            )}

            {/* 和上次差不多 */}
            {hasLastCheckin && !done && (
              <button
                onClick={handleSameAsLast}
                className="mt-3 w-full rounded-full border border-edge bg-white/60 py-2 text-xs text-ink-muted transition-colors hover:border-sage/40 hover:text-ink"
              >
                {tr("checkin_same_as_last")}
              </button>
            )}

            <button
              onClick={handleSubmit}
              onPointerDown={handleDown}
              disabled={done}
              className={cn(
                "text-body mt-4 w-full rounded-full py-3 font-medium transition-all duration-250",
                done
                  ? "bg-sage text-white"
                  : isCoolingDown
                    ? "bg-edge text-ink-muted hover:bg-edge/80 active:scale-[0.98]"
                    : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]",
              )}
            >
              {done ? (
                <span className="flex items-center justify-center gap-2">
                  <Check size={18} /> {tr("checkin_submit_done")}
                </span>
              ) : isCoolingDown ? (
                tr("checkin_submit_cooldown")
              ) : (
                tr("checkin_submit_normal")
              )}
            </button>
            <p className="mt-2 text-center text-xs text-ink-faint">
              {tr(isCoolingDown ? "checkin_cooldown_hint" : "checkin_default_hint")}
            </p>

            {/* 返回一键模式 */}
            <button
              onClick={() => setSimpleMode(true)}
              className="mx-auto mt-3 flex items-center gap-1 text-xs text-ink-faint transition-colors hover:text-ink-muted"
            >
              {tr("checkin_collapse_axes")}
              <ChevronDown size={12} className="rotate-180" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
