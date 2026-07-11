import { useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import type { AxisKey, Phase } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { getAxisProfile } from "@/lib/axisConfig";
import EnergyPalette from "@/components/checkin/EnergyPalette";
import { detectPhase } from "@/lib/stageEngine";
import { isToday } from "@/lib/format";

// 三轴快速签到（PRD §05 F-02）
// 轴语义按神经特质动态切换
// 能量调色盘 + 今日签到可视化 + 冷却提示（不强制禁止，但给距离引导）

const COOLDOWN_MINUTES = 30; // 建议最小间隔

// 早期预警信号（ASD alexithymia 支持 · 用可观察行为辅助签到，非诊断）
const EARLY_SIGNALS = [
  "不想说话/封闭",
  "难以聚焦",
  "stimming 加剧（摇晃/重复动作）",
  "对感官输入比平时敏感",
  "踱步或坐立不安",
  "变得很安静/不动",
];

export default function CheckInCard() {
  const addCheckIn = useStore((s) => s.addCheckIn);
  const neuroType = useStore((s) => s.neuroType);
  const currentWeather = useStore((s) => s.currentWeather);
  const crashMarks = useStore((s) => s.crashMarks);
  const checkins = useStore((s) => s.checkins);
  const getMinutesSinceLastCheckin = useStore((s) => s.getMinutesSinceLastCheckin);
  const profile = getAxisProfile(neuroType);
  // 默认值预填：从最近一次签到值继承，降低 ADHD 启动摩擦
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
  // 早期信号勾选 + 开放备注（ASD alexithymia / HSP 深度加工出口）
  const [signalsOpen, setSignalsOpen] = useState(false);
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [noteText, setNoteText] = useState("");
  const downAtRef = useRef<number>(0);
  const totalHesitationRef = useRef<number>(0);

  const currentPhase = detectPhase(currentWeather.climate, crashMarks);

  // 今日签到
  const todayCheckins = useMemo(
    () => checkins.filter((c) => isToday(c.checkin_at)),
    [checkins],
  );
  const todayCount = todayCheckins.length;

  // 距离上次签到的分钟数
  const minutesSinceLast = getMinutesSinceLastCheckin();
  const isCoolingDown = minutesSinceLast < COOLDOWN_MINUTES;

  // 时段进度：早/中/晚
  const slots = useMemo(() => {
    const hours = todayCheckins.map((c) => new Date(c.checkin_at).getHours());
    return {
      morning: hours.some((h) => h >= 5 && h < 12),
      noon: hours.some((h) => h >= 12 && h < 17),
      evening: hours.some((h) => h >= 17 || h < 5),
    };
  }, [todayCheckins]);

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
    setValues((v) => {
      const next = { ...v };
      next[key] = value;
      return next;
    });
    handleDown();
  };

  // 统一提交：允许只填一轴也提交（ADHD 全或无思维 · 漏签就放弃的反制）
  const submitWith = (vals: Record<AxisKey, number>) => {
    handleUp();
    addCheckIn(
      vals.sensory,
      vals.social,
      vals.predictability,
      totalHesitationRef.current,
      {
        note: noteText || undefined,
        early_signals:
          selectedSignals.length > 0 ? selectedSignals : undefined,
      },
    );
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  const handleSubmit = () => submitWith(values);

  // "和上次差不多"一键：把值设为上次签到值并直接提交
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
      prev.includes(signal)
        ? prev.filter((s) => s !== signal)
        : [...prev, signal],
    );
  };

  const hasLastCheckin = checkins.length > 0;

  // 冷却提示文案
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
      className="rounded-card border border-edge bg-white/60 p-6 shadow-soft"
    >
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="font-serif text-xl text-ink">今日签到</h3>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              getPhaseBadgeClass(currentPhase),
            )}
          >
            {getPhaseShortLabel(currentPhase)}
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
            const labels = { morning: "早", noon: "中", evening: "晚" };
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
                  {labels[slot]}
                </span>
                <span className="text-[10px] text-ink-faint">
                  {filled ? "已签" : "待签"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 能量调色盘（三轴颜色混合） */}
      <EnergyPalette values={values} onChange={handleChange} />

      {/* 早期预警信号（ASD alexithymia 支持 · 可观察行为辅助签到，非必填） */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setSignalsOpen((o) => !o)}
          className="flex w-full items-center justify-between text-xs text-ink-muted hover:text-ink"
        >
          <span>
            早期信号
            {selectedSignals.length > 0
              ? ` · 已选 ${selectedSignals.length}`
              : ""}
          </span>
          <span className="text-ink-faint">{signalsOpen ? "收起" : "展开"}</span>
        </button>
        {signalsOpen && (
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {EARLY_SIGNALS.map((signal) => {
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

      {/* 开放备注（HSP 深度加工出口 · 非必填，无字数限制） */}
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="想写点什么就写，不想写也没关系"
        rows={2}
        className="mt-3 w-full resize-none rounded-lg border border-edge bg-white/40 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-sage/40 focus:outline-none"
      />

      {/* 冷却提示（不强制禁止，但引导合理间隔） */}
      {isCoolingDown && !done && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
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

      {/* "和上次差不多"一键（ADHD 启动摩擦优化 · 直接以上次值提交） */}
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
        {isCoolingDown
          ? "可以等等再签 · 变化更明显"
          : "15 秒完成 · 签到后天气会随你而变"}
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
