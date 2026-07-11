import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

// Toast 通知（PRD §09：顶部 slide-down，3 秒自动消失）
export default function Toast() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => dismiss(t.id)}
            className={cn(
              "pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full px-5 py-2.5 text-small shadow-lift backdrop-blur-sm",
              t.type === "success" && "bg-sage/90 text-white",
              t.type === "error" && "bg-warn/90 text-white",
              t.type === "info" && "bg-primary/90 text-white",
            )}
          >
            {t.type === "success" && <CheckCircle2 size={16} />}
            {t.type === "error" && <XCircle size={16} />}
            {t.type === "info" && <Info size={16} />}
            <span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
