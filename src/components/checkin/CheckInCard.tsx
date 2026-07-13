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

// 快速签到（PRD §05 F-02 · 重构：默认一键模式 · 三轴折叠）
// ASD 述情障碍 / ADHD 启动摩擦 → 主路径只需选一个整体感觉
// 想精细调整再展开三轴（不强迫 · 不评判）

interface CheckInCardProps {
  onSubmitted?: () => void;
}

const COOLDOWN_MINUTES = 30;

const EMOJI_SLOTS = [
  { value: 2, emoji: "😫", label: "很差" },
  { value: 4, emoji: "😟", label: "不太好" },
  { value: 5, emoji: "😐", label: "一般" },
  { value: 6, emoji: "🙂", label: "还行" },
  { value: 8, emoji: "😊", label: "不错" },
];

const OBSERVABLE_SIGNALS = {
  adhd: [
    { label: "开始不了", value: 3 },
    { label: "反复切换", value: 4 },
    { label: "停不下来", value: 4 },
    { label: "还能聚焦", value: 7 },
  ],
  asd: [
    { label: "声光变刺", value: 3 },
    { label: "不想说话", value: 3 },
    { label: "变化不安", value: 4 },
    { label: "目前稳定", value: 7 },
  ],
} as const;

// 早期预警信号 · 按特质分化（ASD 侧重感官/社交退缩，ADHD 侧重执行/冲动）
const EARLY_SIGNALS_BY_TYPE: Record<NeuroType, string[]> = {
  asd: [
    "对感官输入比平时敏感（光/声/触）",
    "stimming 加剧（摇晃/重复动作）",
    "不想说话 / 封闭",
    "变得很安静 / 不动（shutdown）",
    "社交电量明显告急",
  ],
  adhd: [
    "难以聚焦 / 注意力漂移",
    "踱步或坐立不安",
    "任务频繁跳跃 / 切换",
    "冲动话语增多",
    "启动阻力很高 / 什么都做不进去",
  ],
  hsp: [
    "对他人情绪吸收过多",
    "边界感模糊",
    "环境刺激感觉嘈杂刺耳",
  ],
  ptsd: [
    "警觉度突然升高",
    "感觉不安全",
    "有解离 / 飘忽感",
  ],
  other: [
    "不想说话 / 封闭",
    "难以聚焦",
    "对感官输入比平时敏感",
    "踱步或坐立不安",
    "变得很安静 / 不动",
    "启动阻力很高 / 什么都做不进去",
  ],
};

export default function CheckInCard({ onSubmitted }: CheckInCardProps) {
  const addCheckIn = useStore((s) => s.addCheckIn);
  const neuroType = useStore((s) => s.neuroType);
  const currentWeather = useStore((s) => s.currentWeather);
  const crashMarks = useStore((s) => s.crashMarks);
  const checkins = useStore((s) => s.checkins);
  const getMinutesSinceLastCheckin = useStore((s) => s.getMinutesSinceLastCheckin);
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
  // ASD 用户默认展开早期信号（述情障碍需要可观察的行为线索而非内感受词汇）
  const [signalsOpen, setSignalsOpen] = useState(neuroType === "asd");
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
      early_signals: selectedSignals.length > 0 ? selectedSignals : undefined,
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
    ? "已记录"
    : isCoolingDown
      ? `距离上次 ${minutesSinceLast} 分钟 · 再观察一会儿更准`
      : todayCount === 0
        ? "今天还没有签到"
        : `今日已签 ${todayCount} 次`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-card border border-edge/60 p-6"
    >
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="font-serif text-xl text-ink">今日签到</h3>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-xs", getPhaseBadgeClass(currentPhase))}>
            {getPhaseShortLabel(currentPhase)}
          </span>
          <span className="font-mono text-xs text-ink-muted">
            {new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
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
              {simpleInputMode === "observable" ? "现在最明显的信号是？" : "现在整体感觉怎么样？"}
            </p>
            <div className={cn("gap-2", simpleInputMode === "observable" ? "grid grid-cols-2" : "flex justify-between")}>
              {(simpleInputMode === "observable" && (neuroType === "adhd" || neuroType === "asd")
                ? OBSERVABLE_SIGNALS[neuroType]
                : EMOJI_SLOTS
              ).map((slot) => {
                const isObservable = !("emoji" in slot);
                const selected = overall === slot.value && (!isObservable || selectedObservable === slot.label);
                return (
                  <motion.button
                    key={isObservable ? slot.label : slot.value}
                    onClick={() => {
                      setOverall(slot.value);
                      if (isObservable) {
                        setSelectedObservable(slot.label);
                        setSelectedSignals([slot.label]);
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
                    {!isObservable && <span className="text-2xl leading-none">{slot.emoji}</span>}
                    <span className={cn("text-[11px]", selected ? "text-primary font-medium" : "text-ink-faint")}>
                      {slot.label}
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
                {simpleInputMode === "observable" ? "改用整体感受" : "改用可观察信号"}
              </button>
            )}

            {/* 提交按钮 */}
            <button
              onClick={handleSimpleSubmit}
              disabled={overall === null || done}
              className={cn(
                "mt-4 w-full rounded-full py-3 text-body font-medium transition-all duration-250",
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
                  <Check size={18} /> 已记录
                </span>
              ) : isCoolingDown ? (
                "仍然签到"
              ) : (
                "完成签到"
              )}
            </button>
            <p className="mt-2 text-center text-xs text-ink-faint">
              {isCoolingDown ? "可以等等再签 · 变化更明显" : "15 秒完成 · 签到后天气会随你而变"}
            </p>

            {/* 展开三轴（可选 · 不强迫） */}
            <button
              onClick={() => setSimpleMode(false)}
              className="mx-auto mt-3 flex items-center gap-1 text-xs text-ink-faint transition-colors hover:text-ink-muted"
            >
              想精细调整 · 展开三轴
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
                  早期信号
                  {selectedSignals.length > 0 ? ` · 已选 ${selectedSignals.length}` : ""}
                </span>
                <span className="text-ink-faint">{signalsOpen ? "收起" : "展开"}</span>
              </button>
              {signalsOpen && (
                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {earlySignals.map((signal) => {
                    const checked = selectedSignals.includes(signal);
                    return (
                      <label
                        key={signal}
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
                          onChange={() => toggleSignal(signal)}
                          className="h-3.5 w-3.5 accent-sage"
                        />
                        <span>{signal}</span>
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
              placeholder="想写点什么就写，不想写也没关系"
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
                和上次差不多
              </button>
            )}

            <button
              onClick={handleSubmit}
              onPointerDown={handleDown}
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
                  <Check size={18} /> 已记录
                </span>
              ) : isCoolingDown ? (
                "仍然签到"
              ) : (
                "完成签到"
              )}
            </button>
            <p className="mt-2 text-center text-xs text-ink-faint">
              {isCoolingDown ? "可以等等再签 · 变化更明显" : "15 秒完成 · 签到后天气会随你而变"}
            </p>

            {/* 返回一键模式 */}
            <button
              onClick={() => setSimpleMode(true)}
              className="mx-auto mt-3 flex items-center gap-1 text-xs text-ink-faint transition-colors hover:text-ink-muted"
            >
              收起三轴 · 返回一键签到
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

function getPhaseShortLabel(phase: Phase): string {
  switch (phase) {
    case "stable": return "平稳";
    case "accumulating": return "累积";
    case "warning": return "预警";
    case "overload": return "过载";
    case "recovery": return "恢复";
    default: return "签到";
  }
}
