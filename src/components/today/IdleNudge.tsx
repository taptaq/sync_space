import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HandHeart, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

// IdleNudge · 卡住 5 分钟无活动时轻提示（ADHD 计划延续 · P2 改进4）
// 痛点：ADHD 用户常"想开始但启动不了" → 停在页面发呆 → 没人轻轻拉一下
// 设计：
//   - 监听 pointerdown / keydown / scroll / touchstart，5 分钟无活动 → 显示
//   - 不在专注态/有未处理触发/有未提交反馈时打扰
//   - 跳过后 30 分钟内不再打扰（避免烦人）
//   - CTA 智能选：有 inbox 去整理，否则去协议列表
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;
const SNOOZE_MS = 30 * 60 * 1000;

export default function IdleNudge() {
  const navigate = useNavigate();
  const neuroType = useStore((s) => s.neuroType);
  const captureItems = useStore((s) => s.captureItems);
  const protocols = useStore((s) => s.protocols);
  const activeTrigger = useStore((s) => s.activeTrigger);
  const pendingFeedbackExecId = useStore((s) => s.pendingFeedbackExecId);
  const { tr } = useT();

  const [lastActivity, setLastActivity] = useState(Date.now());
  const [snoozedAt, setSnoozedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  // 活动监听
  useEffect(() => {
    if (neuroType !== "adhd") return;
    const update = () => setLastActivity(Date.now());
    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, update, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, update));
  }, [neuroType]);

  // 周期检查
  useEffect(() => {
    if (neuroType !== "adhd") return;
    const t = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, [neuroType]);

  if (neuroType !== "adhd") return null;

  const idleMs = now - lastActivity;
  const snoozed = snoozedAt !== null && now - snoozedAt < SNOOZE_MS;
  const inFocus = captureItems.some((i) => i.status === "focus");
  const hasInbox = captureItems.some((i) => i.status === "inbox");
  const hasProtocols = protocols.some((p) => p.status === "active");
  const blocked = inFocus || activeTrigger !== null || pendingFeedbackExecId !== null;

  const show = !snoozed && !blocked && idleMs >= IDLE_THRESHOLD_MS && (hasInbox || hasProtocols);

  const handleCta = () => {
    navigate(hasInbox ? "/climate" : "/protocol");
    setSnoozedAt(Date.now());
  };

  const handleSnooze = () => {
    setSnoozedAt(Date.now());
    setLastActivity(Date.now());
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-card border border-edge bg-white/60 p-4 shadow-soft"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-mist">
              <HandHeart size={14} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{tr("idle_nudge_title")}</p>
              <p className="mt-1 text-xs text-ink-muted">{tr("idle_nudge_hint")}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCta}
                  className="flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
                >
                  {tr("idle_nudge_cta")} <ArrowRight size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleSnooze}
                  className="text-xs text-ink-faint underline underline-offset-2 transition-colors hover:text-ink-muted"
                >
                  {tr("idle_nudge_dismiss")}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSnooze}
              aria-label={tr("idle_nudge_dismiss")}
              className="text-ink-faint transition-colors hover:text-ink-muted"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
