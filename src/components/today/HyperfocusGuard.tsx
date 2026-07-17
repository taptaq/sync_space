import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, X } from "lucide-react";
import { useT } from "@/lib/i18n";

// ADHD hyperfocus 保护模式
//
// 理念：ADHD 的超专注是双刃剑——产出高但容易忘记自我照顾
// （喝水 / 站起来 / 上厕所 / 吃饭）
//
// 机制：进入专注模式后启动，每 30 分钟弹一个温和提醒
// - 不强制打断（没有刺耳铃声）
// - 不批评（不说"你该休息了"）
// - 只提供出口（"喝口水？"按钮 + 关闭继续）
//
// 与 FocusStartCard（5 分钟微启动倒计时）的区别：
// - FocusStartCard：解决"启动不了"——给一个明确的 5 分钟脚手架
// - HyperfocusGuard：解决"停不下来"——给一个温柔的出口

const REMINDER_INTERVAL_SEC = 30 * 60; // 30 分钟
const SNOOZE_SEC = 15 * 60; // 关闭后 15 分钟再提醒

export default function HyperfocusGuard() {
  const { tr } = useT();
  const [showReminder, setShowReminder] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      elapsedRef.current += 1;
      if (elapsedRef.current >= REMINDER_INTERVAL_SEC) {
        setShowReminder(true);
        setReminderCount((c) => c + 1);
        elapsedRef.current = 0;
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSnooze = () => {
    setShowReminder(false);
    // 关闭后 15 分钟再提醒（比 30 分钟更短，因为已经提醒过了）
    elapsedRef.current = REMINDER_INTERVAL_SEC - SNOOZE_SEC;
  };

  const handleDismiss = () => {
    setShowReminder(false);
    elapsedRef.current = 0;
  };

  return (
    <AnimatePresence>
      {showReminder && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-card border border-sage/40 bg-sage-mist/40 p-4 shadow-soft"
          role="dialog"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage/20 text-sage">
              <Droplets size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{tr("hyperfocus_reminder_title")}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {reminderCount === 1
                  ? tr("hyperfocus_reminder_body_first")
                  : tr("hyperfocus_reminder_body_repeat", { count: reminderCount })}
              </p>
              <div className="mt-3 flex gap-2">
                <a
                  href="#focus-continue"
                  onClick={(e) => { e.preventDefault(); handleSnooze(); }}
                  className="flex min-h-9 items-center rounded-full bg-sage px-4 text-xs font-medium text-white transition-colors hover:bg-sage/90"
                >
                  {tr("hyperfocus_reminder_snooze")}
                </a>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex min-h-9 items-center rounded-full border border-edge bg-white/60 px-4 text-xs text-ink-muted transition-colors hover:bg-white/80"
                >
                  {tr("hyperfocus_reminder_dismiss")}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={tr("close")}
              className="shrink-0 text-ink-faint transition-colors hover:text-ink-muted"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
