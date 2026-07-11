import { motion } from "framer-motion";
import { Check, Eye, X } from "lucide-react";
import type { AIObservation } from "@/types";
import { useStore } from "@/store/useStore";

// AI 模式观察（PRD §05 F-07）
// 攒够两周数据后，AI 在周日晚上生成一条观察建议
// 格式："你过去 N 次 [事件] 前的 M 分钟，都做了 [行为]。要不要把 [规则] 写进协议？"
export default function AIObservationCard({
  observation,
}: {
  observation: AIObservation;
}) {
  const acceptObservation = useStore((s) => s.acceptObservation);
  const ignoreObservation = useStore((s) => s.ignoreObservation);

  if (observation.status !== "pending") {
    return (
      <div className="rounded-card border border-edge bg-white/40 p-5">
        <p className="text-small text-ink-muted">
          {observation.status === "accepted"
            ? "本周观察已接受，已生成协议候选。"
            : "本周观察已忽略，下次观察不受影响。"}
        </p>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-bowl border border-primary-mist bg-primary-mist/30 p-6 shadow-soft"
    >
      <div className="mb-3 flex items-center gap-2">
        <Eye size={16} className="text-primary" />
        <span className="text-xs font-medium uppercase tracking-widest text-primary">
          AI 观察 · {observation.week_label}
        </span>
      </div>

      <p className="text-body leading-relaxed text-ink">
        {observation.pattern}
      </p>

      <div className="mt-4 rounded-card bg-base/60 p-3">
        <p className="text-small text-ink-muted">
          <span className="font-mono text-primary">建议协议</span>
        </p>
        <p className="mt-1 text-small text-ink">
          当 {observation.suggested_protocol.trigger_description}，{observation.suggested_protocol.action_description}。
        </p>
      </div>

      <div className="mt-5 flex gap-2.5">
        <button
          onClick={acceptObservation}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
        >
          <Check size={15} /> 接受·生成协议
        </button>
        <button
          onClick={ignoreObservation}
          className="flex items-center justify-center gap-1.5 rounded-full border border-edge px-4 py-2.5 text-small text-ink-muted transition-all duration-250 hover:bg-white/50"
        >
          <X size={15} /> 忽略
        </button>
      </div>
    </motion.section>
  );
}
