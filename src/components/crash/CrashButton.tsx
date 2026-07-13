import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, ArrowRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import type { CrashType, TriggerCueType } from "@/types";

// 过载回溯组件（PRD §05 F-04 · 非病理化叙事重构）
// 基于 ASD/PTSD/HSP 研究：
// - ASD：meltdown（外向爆发）vs shutdown（内向退缩）恢复路径不同，需区分记录
// - PTSD：补记只记客观线索，不引导情绪细节，防再体验（re-experiencing）
// - HSP：过载是累积性"感官债务"，非突发事件，叙事去病理化
// 所有人群：补记后需要 grounding，确认"你现在已经离开了那个情境"

// 过载类型选项（基于 ASD 研究 · meltdown / shutdown / dissociation）
const CRASH_TYPES: { value: CrashType; label: string; description: string }[] = [
  {
    value: "meltdown",
    label: "爆发（meltdown）",
    description: "情绪外泄：喊叫、哭泣、踢打、跑开",
  },
  {
    value: "shutdown",
    label: "关闭（shutdown）",
    description: "向内退缩：沉默、封闭、不动、无法回应",
  },
  {
    value: "dissociation",
    label: "解离（dissociation）",
    description: "感觉脱离了自己或周围",
  },
];

// 触发线索选项（PTSD 安全设计 · 只记客观线索，不引导情绪叙述）
const TRIGGER_CUES: { value: TriggerCueType; label: string; hint?: string }[] = [
  { value: "sensory", label: "感官刺激", hint: "光/声音/气味/触觉" },
  { value: "social", label: "社交情境" },
  { value: "routine_change", label: "常规变化" },
  { value: "anniversary", label: "周年日/时间" },
  { value: "place", label: "地点" },
  { value: "internal", label: "身体状态", hint: "疲劳/饥饿/疼痛" },
];

type Step = "type" | "cues" | "done";

export default function CrashButton() {
  const addCrashMark = useStore((s) => s.addCrashMark);
  const pushToast = useStore((s) => s.pushToast);

  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<CrashType | null>(null);
  const [selectedCues, setSelectedCues] = useState<
    { type: TriggerCueType; description: string }[]
  >([]);

  // 重置内部状态（收起或重新开始时调用）
  const reset = () => {
    setStep("type");
    setSelectedType(null);
    setSelectedCues([]);
  };

  const handleExpand = () => {
    reset();
    setExpanded(true);
  };

  const handleCancel = () => {
    setExpanded(false);
    reset();
  };

  // 选中过载类型后进入线索步骤
  const handlePickType = (type: CrashType) => {
    setSelectedType(type);
    setStep("cues");
  };

  // 跳过类型选择，只标记时间
  const handleSkipType = () => {
    setStep("cues");
  };

  // 切换某个线索的选中状态
  const toggleCue = (type: TriggerCueType) => {
    setSelectedCues((prev) => {
      if (prev.some((c) => c.type === type)) {
        return prev.filter((c) => c.type !== type);
      }
      return [...prev, { type, description: "" }];
    });
  };

  // 更新某个线索的客观描述
  const updateCueDescription = (type: TriggerCueType, description: string) => {
    setSelectedCues((prev) =>
      prev.map((c) => (c.type === type ? { ...c, description } : c)),
    );
  };

  // 保存过载标记
  const handleSave = () => {
    addCrashMark(undefined, {
      crash_type: selectedType ?? undefined,
      trigger_cues: selectedCues.map((c) => ({
        type: c.type,
        description: c.description,
      })),
    });
    setStep("done");
  };

  // grounding：回到当下
  const handleGrounding = () => {
    pushToast("info", "你在这里，你安全");
    setExpanded(false);
    reset();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-edge bg-white/60 p-5"
    >
      <AnimatePresence mode="wait">
        {!expanded ? (
          // 收起状态
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleExpand}
            className="flex w-full items-center justify-center gap-2.5 text-ink"
          >
            <Zap size={18} className="text-ink-muted" />
            <span className="text-body font-medium">记录一次过载</span>
            <span className="text-xs text-ink-muted">· 标记时间 · 晚点再来整理</span>
          </motion.button>
        ) : step === "type" ? (
          // 步骤 A：选择过载类型
          <motion.div
            key="step-type"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <div>
              <p className="text-body font-medium text-ink">这是一次怎样的过载？</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                不同类型恢复路径不同。不确定也没关系，可以跳过。
              </p>
            </div>

            <div className="space-y-2.5">
              {CRASH_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePickType(opt.value)}
                  className="flex w-full items-start gap-3 rounded-card border border-edge bg-white/50 p-3.5 text-left transition-all duration-250 hover:border-primary hover:bg-primary-mist/30 active:scale-[0.99]"
                >
                  <div className="flex-1">
                    <p className="text-small font-medium text-ink">{opt.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                      {opt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleSkipType}
              className="w-full text-center text-xs text-ink-muted underline-offset-2 transition-colors hover:text-ink hover:underline"
            >
              只标记时间，不选类型
            </button>

            <button
              onClick={handleCancel}
              className="w-full text-center text-xs text-ink-faint transition-colors hover:text-ink-muted"
            >
              取消
            </button>
          </motion.div>
        ) : step === "cues" ? (
          // 步骤 B：触发线索（可选 · PTSD 安全设计）
          <motion.div
            key="step-cues"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <div>
              <p className="text-body font-medium text-ink">触发线索</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                什么线索可能触发了这次过载？只记客观的，不用回忆当时的情绪。
              </p>
              <p className="mt-0.5 text-[11px] text-ink-faint">完全可选，可以跳过。</p>
            </div>

            <div className="space-y-2">
              {TRIGGER_CUES.map((cue) => {
                const selected = selectedCues.some((c) => c.type === cue.value);
                const cueItem = selectedCues.find((c) => c.type === cue.value);
                return (
                  <div key={cue.value}>
                    <button
                      onClick={() => toggleCue(cue.value)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-card border p-3 text-left transition-all duration-250 active:scale-[0.99]",
                        selected
                          ? "border-primary bg-primary-mist/40"
                          : "border-edge bg-white/40 hover:bg-white/70",
                      )}
                    >
                      <div className="flex-1">
                        <span
                          className={cn(
                            "text-small",
                            selected ? "font-medium text-primary" : "text-ink",
                          )}
                        >
                          {cue.label}
                        </span>
                        {cue.hint && (
                          <span className="ml-2 text-xs text-ink-faint">
                            {cue.hint}
                          </span>
                        )}
                      </div>
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                          selected ? "border-primary bg-primary" : "border-ink-faint",
                        )}
                      >
                        {selected && (
                          <Check size={10} className="text-white" strokeWidth={3} />
                        )}
                      </div>
                    </button>
                    {selected && (
                      <motion.input
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        value={cueItem?.description ?? ""}
                        onChange={(e) =>
                          updateCueDescription(cue.value, e.target.value)
                        }
                        placeholder="加一句客观描述（可选）"
                        className="mt-1.5 w-full rounded-lg border border-edge bg-white/60 px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSave}
              className="w-full rounded-full bg-primary py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
            >
              保存
            </button>

            <button
              onClick={handleCancel}
              className="w-full text-center text-xs text-ink-faint transition-colors hover:text-ink-muted"
            >
              取消
            </button>
          </motion.div>
        ) : (
          // 步骤 C：确认 + Grounding
          <motion.div
            key="step-done"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-mist"
            >
              <Check size={22} className="text-sage" strokeWidth={2.5} />
            </motion.div>

            <p className="text-body font-medium leading-relaxed text-ink">
              已记录。
              <br />
              你现在离开了那个情境，这里是安全的。
            </p>

            <button
              onClick={handleGrounding}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-sage py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-sage/90 active:scale-[0.98]"
            >
              回到当下
              <ArrowRight size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
