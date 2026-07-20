import { motion, AnimatePresence } from "framer-motion";
import { RotateCw, ArrowRight, Moon, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useNavigate } from "react-router-dom";
import { useT } from "@/lib/i18n";

// NextActionPrompt · 合并 feedback + 下一步（替代 FeedbackPrompt）
// ADHD 「计划延续启动」痛点：执行完后没有下一步引导，最容易卡在动作之间
// 三个选项同时完成 feedback 收集 + 衔接动作：
//   helpful + 再来一次 / neutral + 换一个 / unhelpful + 停下休息
export default function NextActionPrompt() {
  const navigate = useNavigate();
  const { tr, tt } = useT();
  const pendingExecId = useStore((s) => s.pendingFeedbackExecId);
  const submitFeedback = useStore((s) => s.submitFeedback);
  const dismissFeedback = useStore((s) => s.dismissFeedback);
  const executeProtocol = useStore((s) => s.executeProtocol);

  const protocol = useStore((s) => {
    if (!pendingExecId) return null;
    const exec = s.executions.find((e) => e.id === pendingExecId);
    if (!exec) return null;
    return s.protocols.find((p) => p.id === exec.protocol_id) ?? null;
  });

  const handleHelpfulAndRepeat = () => {
    if (!pendingExecId || !protocol) return;
    submitFeedback(pendingExecId, "helpful");
    executeProtocol(protocol.id);
  };

  const handleNeutralAndSwitch = () => {
    if (!pendingExecId) return;
    submitFeedback(pendingExecId, "neutral");
    navigate("/protocol");
  };

  const handleUnhelpfulAndRest = () => {
    if (!pendingExecId) return;
    submitFeedback(pendingExecId, "unhelpful");
  };

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
                  {tr("next_action_title")}
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

              {/* 三个选项 · feedback + 动作合并 */}
              <div className="space-y-2">
                <button
                  onClick={handleHelpfulAndRepeat}
                  className="flex w-full items-center gap-3 rounded-card border border-primary/30 bg-primary-mist/40 px-4 py-3 transition-all duration-250 hover:bg-primary-mist/60 active:scale-[0.98]"
                >
                  <RotateCw size={16} className="shrink-0 text-primary" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-ink">{tr("next_action_helpful_repeat")}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{tr("next_action_helpful_hint")}</p>
                  </div>
                  <ArrowRight size={14} className="shrink-0 text-ink-faint" />
                </button>

                <button
                  onClick={handleNeutralAndSwitch}
                  className="flex w-full items-center gap-3 rounded-card border border-edge bg-white/60 px-4 py-3 transition-all duration-250 hover:bg-primary-mist/30 active:scale-[0.98]"
                >
                  <ArrowRight size={16} className="shrink-0 text-ink-muted" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-ink">{tr("next_action_neutral_switch")}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{tr("next_action_neutral_hint")}</p>
                  </div>
                  <ArrowRight size={14} className="shrink-0 text-ink-faint" />
                </button>

                <button
                  onClick={handleUnhelpfulAndRest}
                  className="flex w-full items-center gap-3 rounded-card border border-edge bg-white/60 px-4 py-3 transition-all duration-250 hover:bg-ink/5 active:scale-[0.98]"
                >
                  <Moon size={16} className="shrink-0 text-ink-muted" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-ink">{tr("next_action_unhelpful_rest")}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{tr("next_action_unhelpful_hint")}</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
