import { motion } from "framer-motion";
import { Check, Eye, X } from "lucide-react";
import type { AIObservation } from "@/types";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

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
  const { tr, tt } = useT();

  if (observation.status !== "pending") {
    return (
      <div className="rounded-card border border-edge bg-white/40 p-5">
        <p className="text-small text-ink-muted">
          {observation.status === "accepted"
            ? tr("ai_obs_accepted")
            : tr("ai_obs_ignored")}
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
          {tr("ai_obs_title", { label: tt(observation.week_label) })}
        </span>
      </div>

      <p className="text-body leading-relaxed text-ink">
        {tt(observation.pattern)}
      </p>

      <div className="mt-4 rounded-card bg-base/60 p-3">
        <p className="text-small text-ink-muted">
          <span className="font-mono text-primary">{tr("ai_obs_suggested")}</span>
        </p>
        <p className="mt-1 text-small text-ink">
          {tr("ai_obs_protocol", {
            trigger: tt(observation.suggested_protocol.trigger_description),
            action: tt(observation.suggested_protocol.action_description),
          })}
        </p>
      </div>

      <div className="mt-5 flex gap-2.5">
        <button
          onClick={acceptObservation}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
        >
          <Check size={15} /> {tr("ai_obs_accept")}
        </button>
        <button
          onClick={ignoreObservation}
          className="flex items-center justify-center gap-1.5 rounded-full border border-edge px-4 py-2.5 text-small text-ink-muted transition-all duration-250 hover:bg-white/50"
        >
          <X size={15} /> {tr("ai_obs_ignore")}
        </button>
      </div>
    </motion.section>
  );
}
