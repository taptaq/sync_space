import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CircleAlert } from "lucide-react";
import CrashButton from "@/components/crash/CrashButton";
import VoiceCrashNote from "@/components/qwen/VoiceCrashNote";
import { useT } from "@/lib/i18n";

// 预警页只保留一个低频出口：补记过载。环境分析和协议推荐不再与签到竞争。

export default function Toolbox({ qwenEnabled }: { qwenEnabled: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { tr } = useT();

  return (
    <div className="overflow-hidden border-t border-edge/70">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex min-h-12 w-full items-center justify-between px-1 text-left"
      >
        <div className="flex items-center gap-2">
          <CircleAlert size={15} className="text-ink-muted" />
          <span className="text-sm text-ink-muted">{tr("toolbox_crash_record")}</span>
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronRight size={14} className="text-ink-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-2 pt-1">
              {qwenEnabled ? <VoiceCrashNote /> : <CrashButton />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
