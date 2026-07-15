import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Minus, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

// 协议执行效果反馈（PRD §09 反馈闭环 · 执行后延时询问）
// 轻量 bottom sheet 形式，三个选项：有帮助 / 一般 / 没帮助
export default function FeedbackPrompt() {
  const pendingExecId = useStore((s) => s.pendingFeedbackExecId);
  const submitFeedback = useStore((s) => s.submitFeedback);
  const dismissFeedback = useStore((s) => s.dismissFeedback);
  const { tr, tt } = useT();

  const options: {
    value: "helpful" | "neutral" | "unhelpful";
    labelKey: "feedback_helpful" | "feedback_neutral" | "feedback_unhelpful";
    icon: typeof ThumbsUp;
  }[] = [
    { value: "helpful", labelKey: "feedback_helpful", icon: ThumbsUp },
    { value: "neutral", labelKey: "feedback_neutral", icon: Minus },
    { value: "unhelpful", labelKey: "feedback_unhelpful", icon: ThumbsDown },
  ];

  const protocol = useStore((s) => {
    if (!pendingExecId) return null;
    const exec = s.executions.find((e) => e.id === pendingExecId);
    if (!exec) return null;
    return s.protocols.find((p) => p.id === exec.protocol_id) ?? null;
  });

  return (
    <AnimatePresence>
      {pendingExecId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismissFeedback}
            className="fixed inset-0 z-[55] bg-ink/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 z-[55] mx-auto w-full max-w-md rounded-t-2xl border-t border-white/30 bg-base/95 p-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-small font-medium text-ink">
                  {tr("feedback_title")}
                </p>
                <button
                  onClick={dismissFeedback}
                  className="text-ink-faint transition-colors hover:text-ink-muted"
                >
                  <X size={16} />
                </button>
              </div>
              {protocol && (
                <p className="mb-4 truncate text-xs text-ink-faint">
                  {tt(protocol.action.description)}
                </p>
              )}
              <div className="flex gap-2">
                {options.map(({ value, labelKey, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => submitFeedback(pendingExecId, value)}
                    className="flex flex-1 flex-col items-center gap-1.5 rounded-card border border-edge bg-white/60 py-3 transition-all duration-250 hover:bg-primary-mist/40 active:scale-[0.97]"
                  >
                    <Icon size={18} className="text-ink-muted" />
                    <span className="text-xs text-ink-muted">{tr(labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
