import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { Protocol } from "@/types";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";

// 协议演练模式（原创差异化交互 · 基于 ASD 研究的"可预测性"原则）
// 用户创建协议后可模拟走一遍执行流程，在非危机状态下熟悉"执行协议是什么感觉"
// 降低真实触发时的焦虑。整个演练纯模拟，不写入 store 的 executions 数据
export default function ProtocolRehearsal({
  protocol,
  onExit,
  onFeedback,
}: {
  protocol: Protocol;
  onExit: () => void;
  onFeedback: (helpful: boolean) => void;
}) {
  const { tr, tt } = useT();
  const [step, setStep] = useState(0); // 0 想象场景 · 1 现在执行 · 2 执行中 · 3 演练完成
  const [secondsLeft, setSecondsLeft] = useState(30); // 模拟计时 30 秒
  const [breathIn, setBreathIn] = useState(true); // 呼吸引导：吸气 / 呼气

  const hasTimer = protocol.action.timer;

  // 执行中步骤：30 秒倒计时，归零后自动进入完成步骤
  useEffect(() => {
    if (step !== 2) return;
    if (secondsLeft <= 0) {
      setStep(3);
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [step, secondsLeft]);

  // 呼吸引导：每 4 秒切换吸气 / 呼气（吸气 4 秒 + 呼气 4 秒）
  useEffect(() => {
    if (step !== 2) return;
    const id = setInterval(() => setBreathIn((v) => !v), 4000);
    return () => clearInterval(id);
  }, [step]);

  // 从"现在执行"步骤推进：有计时则进入执行中，否则直接完成
  const advanceFromAction = () => {
    if (hasTimer) {
      setSecondsLeft(30);
      setStep(2);
    } else {
      setStep(3);
    }
  };

  // 步骤标题
  const STEP_TITLE: StringKey[] = [
    "rehearsal_step_0",
    "rehearsal_step_1",
    "rehearsal_step_2",
    "rehearsal_step_3",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col bg-base"
    >
      {/* 顶部栏：返回按钮 + 演练模式标签 */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button
          onClick={onExit}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-small text-ink-muted transition-all duration-250 hover:bg-white/60 hover:text-ink active:scale-[0.98]"
        >
          <ArrowLeft size={16} /> {tr("rehearsal_exit")}
        </button>
        <span className="flex items-center gap-1 rounded-full bg-primary-mist px-2.5 py-1 text-xs text-primary">
          <Sparkles size={12} /> {tr("rehearsal_mode")}
        </span>
      </div>

      {/* 可滚动主区域 */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* 步骤 0：想象这个场景 */}
          {step === 0 && (
            <motion.section
              key={0}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md text-center"
            >
              <p className="text-xs uppercase tracking-widest text-primary">
                {tr(STEP_TITLE[0])}
              </p>
              <div className="mt-4 rounded-card border border-edge bg-white/60 p-5 text-left shadow-soft">
                <p className="font-mono text-xs text-primary">WHEN</p>
                <p className="mt-1 text-body leading-relaxed text-ink">
                  {tt(protocol.trigger.description)}
                </p>
              </div>
              <p className="mt-6 text-body leading-relaxed text-ink">
                {tr("rehearsal_imagine_prompt", { trigger: tt(protocol.trigger.description) })}
              </p>
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-sage py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-sage/90 active:scale-[0.98]"
                >
                  {tr("rehearsal_felt_it")}
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="rounded-full border border-edge px-5 py-2.5 text-small text-ink-muted transition-all duration-250 hover:bg-white/50 active:scale-[0.98]"
                >
                  {tr("rehearsal_skip")}
                </button>
              </div>
            </motion.section>
          )}

          {/* 步骤 1：现在执行 */}
          {step === 1 && (
            <motion.section
              key={1}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md text-center"
            >
              <p className="text-xs uppercase tracking-widest text-primary">
                {tr(STEP_TITLE[1])}
              </p>
              <div className="mt-4 rounded-card border border-edge bg-white/60 p-5 text-left shadow-soft">
                <p className="font-mono text-xs text-sage">THEN</p>
                <p className="mt-1 text-body leading-relaxed text-ink">
                  {tt(protocol.action.description)}
                </p>
              </div>
              <p className="mt-6 text-body leading-relaxed text-ink">
                {tr("rehearsal_action_prompt", { action: tt(protocol.action.description) })}
              </p>
              <div className="mt-8 flex gap-3">
                <button
                  onClick={advanceFromAction}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-sage py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-sage/90 active:scale-[0.98]"
                >
                  {tr("rehearsal_start")}
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="rounded-full border border-edge px-5 py-2.5 text-small text-ink-muted transition-all duration-250 hover:bg-white/50 active:scale-[0.98]"
                >
                  {tr("rehearsal_skip")}
                </button>
              </div>
            </motion.section>
          )}

          {/* 步骤 2：执行中（仅当 action.timer 为 true） */}
          {step === 2 && hasTimer && (
            <motion.section
              key={2}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md text-center"
            >
              <p className="text-xs uppercase tracking-widest text-primary">
                {tr(STEP_TITLE[2])}
              </p>

              {/* 呼吸引导圆：吸气 4 秒放大 + 呼气 4 秒缩小 */}
              <div className="my-10 flex h-52 w-52 items-center justify-center rounded-full">
                <motion.div
                  className="absolute h-40 w-40 rounded-full bg-sage-mist"
                  animate={{ scale: breathIn ? 1.3 : 0.8 }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                />
                <div className="relative z-10 text-center">
                  <p className="text-body font-medium text-sage">
                    {breathIn ? tr("rehearsal_inhale") : tr("rehearsal_exhale")}
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink-muted">
                    {secondsLeft}s
                  </p>
                </div>
              </div>

              <p className="text-small leading-relaxed text-ink-muted">
                {tr("rehearsal_breath_hint", { minutes: protocol.action.duration_minutes })}
              </p>
              <button
                onClick={() => setStep(3)}
                className="mt-6 rounded-full border border-edge px-5 py-2 text-small text-ink-muted transition-all duration-250 hover:bg-white/50 active:scale-[0.98]"
              >
                {tr("rehearsal_end_early")}
              </button>
            </motion.section>
          )}

          {/* 步骤 3：演练完成 */}
          {step === 3 && (
            <motion.section
              key={3}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md text-center"
            >
              <p className="text-xs uppercase tracking-widest text-primary">
                {tr(STEP_TITLE[3])}
              </p>
              <p className="mt-6 text-body leading-relaxed text-ink">
                {tr("rehearsal_complete_msg")}
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={() => onFeedback(true)}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-sage py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-sage/90 active:scale-[0.98]"
                >
                  {tr("rehearsal_helpful")}
                </button>
                <button
                  onClick={() => onFeedback(false)}
                  className="rounded-full border border-edge px-5 py-2.5 text-small text-ink-muted transition-all duration-250 hover:bg-white/50 active:scale-[0.98]"
                >
                  {tr("rehearsal_needs_adjust")}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
