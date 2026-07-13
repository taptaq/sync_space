import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronDown,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  BookHeart,
  Volume2,
  Loader2,
} from "lucide-react";
import type { Phase } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { detectPhase, getPhaseConfig } from "@/lib/stageEngine";
import {
  getTherapiesByNeuroType,
  sortTherapiesByPhase,
  CATEGORY_LABELS,
  type Therapy,
} from "@/lib/therapies";
import { textToSpeech } from "@/lib/qwenService";

// 智能建议（秘书模式 · 从循证疗法库挑匹配阶段的 · 你自己决定要不要用）
// 设计原则（PRD §03）：协议 > AI 建议。AI 不生成新建议，
// 只从有学术依据的疗法库里挑出适合当前阶段的，用户一键转协议。

export default function SmartGuidance() {
  const currentWeather = useStore((s) => s.currentWeather);
  const crashMarks = useStore((s) => s.crashMarks);
  const neuroType = useStore((s) => s.neuroType);
  const checkins = useStore((s) => s.checkins);
  const addProtocol = useStore((s) => s.addProtocol);
  const pushToast = useStore((s) => s.pushToast);

  const phase = detectPhase(currentWeather.climate, crashMarks);
  const phaseCfg = getPhaseConfig(phase);

  // 趋势：最近 2 次签到的阶段对比
  const trend = useMemo<"improving" | "stable" | "declining">(() => {
    const recent = checkins.slice(-2);
    if (recent.length < 2) return "stable";
    const prevPhase = detectPhase(recent[0].weather_snapshot.climate, []);
    const currPhase = detectPhase(recent[1].weather_snapshot.climate, []);
    const order: Phase[] = ["stable", "accumulating", "warning", "overload", "recovery"];
    const prevIdx = order.indexOf(prevPhase);
    const currIdx = order.indexOf(currPhase);
    if (currIdx < prevIdx) return "improving";
    if (currIdx > prevIdx) return "declining";
    return "stable";
  }, [checkins]);

  // 从疗法库挑匹配当前阶段的，最多 3 条
  const pickedTherapies = useMemo(() => {
    const all = getTherapiesByNeuroType(neuroType);
    const sorted = sortTherapiesByPhase(all, phase);
    // 优先当前阶段命中的
    const matched = sorted.filter((t) => t.phases.includes(phase));
    return (matched.length > 0 ? matched : sorted).slice(0, 3);
  }, [neuroType, phase]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-ink">适合现在的调节方法</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
            <Sparkles size={11} className="text-primary" />
            基于你的阶段和特质 · 从循证疗法库挑的
          </p>
        </div>
        <TrendBadge trend={trend} phaseLabel={phaseCfg.label} />
      </div>

      {/* 秘书声明 */}
      <div className="mb-4 rounded-xl bg-primary-mist/20 px-3 py-2.5">
        <p className="text-[11px] leading-relaxed text-ink-muted">
          {phaseCfg.measureTone}
          <br />
          <span className="text-ink-faint">
            这是秘书从疗法库挑的参考，你决定要不要用。
          </span>
        </p>
      </div>

      <div className="space-y-3">
        {pickedTherapies.map((therapy, i) => (
          <TherapyPickCard
            key={therapy.id}
            therapy={therapy}
            index={i}
            onAddProtocol={() => {
              const proto = {
                trigger: {
                  type: "behavior" as const,
                  description: `${therapy.name}（${CATEGORY_LABELS[therapy.category].label}）`,
                },
                action: {
                  description: therapy.steps[0],
                  duration_minutes: therapy.duration_minutes,
                  timer: therapy.duration_minutes >= 5,
                },
                source: "ai_suggestion" as const,
                status: "candidate" as const,
                phases: therapy.phases,
              };
              addProtocol(proto);
              pushToast("success", `「${therapy.name}」已加入协议候选`);
            }}
          />
        ))}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1 text-center text-[11px] text-ink-faint">
        <BookHeart size={11} />
        每条都有学术引用 · 你可以在气候页查看完整疗法库
      </p>
    </motion.div>
  );
}

function TherapyPickCard({
  therapy,
  index,
  onAddProtocol,
}: {
  therapy: Therapy;
  index: number;
  onAddProtocol: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pushToast = useStore((s) => s.pushToast);
  const cat = CATEGORY_LABELS[therapy.category];

  const handleTTS = async () => {
    // 正在播放 → 停止
    if (ttsPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setTtsPlaying(false);
      return;
    }
    setTtsLoading(true);
    try {
      const { audioUrl } = await textToSpeech(
        `${therapy.name}。${therapy.steps.join("。")}`,
      );
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setTtsPlaying(false);
        audioRef.current = null;
      };
      audioRef.current = audio;
      await audio.play();
      setTtsPlaying(true);
    } catch {
      pushToast("error", "语音合成不可用，请配置 API Key");
    } finally {
      setTtsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="rounded-xl border border-edge bg-white/50 p-3.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base">{cat.icon}</span>
            <p className="text-body font-medium text-ink">{therapy.name}</p>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">
            {cat.label} · {therapy.duration_minutes} 分钟
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-full p-1 text-ink-muted transition-colors hover:bg-white/60"
          aria-label={expanded ? "收起" : "展开"}
        >
          <ChevronDown
            size={16}
            className={cn("transition-transform duration-250", expanded && "rotate-180")}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <ol className="mt-3 space-y-1.5">
              {therapy.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-small leading-relaxed text-ink">
                  <span className="shrink-0 font-mono text-[11px] text-primary">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-lg bg-edge/40 px-2.5 py-1.5 text-[11px] leading-relaxed text-ink-muted">
              {therapy.principle}
              <br />
              <span className="text-ink-faint">来源：{therapy.evidence}</span>
            </p>

            {/* 朗读按钮（低能量时听着跟着做 · TTS） */}
            <button
              onClick={handleTTS}
              disabled={ttsLoading}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-edge py-1.5 text-[11px] text-ink-muted transition-all duration-250 hover:bg-white/60 disabled:opacity-50"
            >
              {ttsLoading ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> 合成中…
                </>
              ) : (
                <>
                  <Volume2 size={11} />
                  {ttsPlaying ? "停止朗读" : "朗读步骤"}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onAddProtocol}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary-mist/30 py-2 text-xs font-medium text-primary transition-all duration-250 hover:bg-primary-mist/50 active:scale-[0.98]"
      >
        <Plus size={13} /> 加入协议候选
      </button>
    </motion.div>
  );
}

function TrendBadge({
  trend,
  phaseLabel,
}: {
  trend: "improving" | "stable" | "declining";
  phaseLabel: string;
}) {
  const config = {
    improving: { icon: TrendingUp, label: "好转", color: "text-sage", bg: "bg-sage-mist/60" },
    stable: { icon: Minus, label: "稳定", color: "text-ink-muted", bg: "bg-edge" },
    declining: { icon: TrendingDown, label: "下滑", color: "text-warn", bg: "bg-warn-mist/60" },
  }[trend];
  const Icon = config.icon;
  return (
    <span className="flex shrink-0 flex-col items-end gap-1">
      <span className="rounded-full bg-primary-mist/60 px-2 py-0.5 text-[10px] text-primary">
        {phaseLabel}
      </span>
      <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]", config.bg, config.color)}>
        <Icon size={10} />
        {config.label}
      </span>
    </span>
  );
}
