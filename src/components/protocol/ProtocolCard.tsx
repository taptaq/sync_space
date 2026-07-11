import { motion } from "framer-motion";
import { Check, Clock, Pause, Play, Trash2 } from "lucide-react";
import type { Protocol } from "@/types";
import { useStore } from "@/store/useStore";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getAxisProfile, getBandLabel } from "@/lib/axisConfig";
import { PHASE_MAP } from "@/lib/stageEngine";

const SOURCE_LABEL: Record<Protocol["source"], string> = {
  manual: "手动创建",
  ai_suggestion: "AI建议",
  crash_reflection: "崩溃复盘提取",
};

// 协议列表项（PRD §05 F-06 协议管理）
export default function ProtocolCard({ protocol }: { protocol: Protocol }) {
  const toggleStatus = useStore((s) => s.toggleProtocolStatus);
  const acceptCandidate = useStore((s) => s.acceptCandidateProtocol);
  const deleteProtocol = useStore((s) => s.deleteProtocol);
  const neuroType = useStore((s) => s.neuroType);

  const isCandidate = protocol.status === "candidate";
  const isPaused = protocol.status === "paused";

  // 阈值型触发：算出程度描述，让数值有体感
  const trigger = protocol.trigger;
  const axisCfg =
    trigger.type === "threshold" && trigger.axis
      ? getAxisProfile(neuroType).axes.find((a) => a.key === trigger.axis)
      : undefined;
  const bandLabel =
    axisCfg && trigger.value != null
      ? getBandLabel(trigger.value, axisCfg)
      : "";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-card border bg-white/60 p-5 shadow-soft transition-opacity duration-250",
        isCandidate ? "border-dashed-candidate" : "border-edge",
        isPaused && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-primary">
            WHEN · {protocol.trigger.description}
          </p>
          {bandLabel && (
            <p className="mt-0.5 text-xs text-ink-faint">
              {axisCfg?.label} 达到「{bandLabel}」程度时触发
            </p>
          )}
          <p className="mt-1.5 text-body leading-relaxed text-ink">
            {protocol.action.description}
          </p>
        </div>
        {isCandidate && (
          <span className="shrink-0 rounded-full bg-primary-mist px-2.5 py-1 text-xs text-primary">
            待确认
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
        <span>来源：{SOURCE_LABEL[protocol.source]}</span>
        <span>·</span>
        <span>执行 {protocol.execution_count} 次</span>
        {protocol.last_executed_at && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> 上次：{relativeTime(protocol.last_executed_at)}
            </span>
          </>
        )}
      </div>

      {/* 适用阶段标签 */}
      {protocol.phases && protocol.phases.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {protocol.phases.map((p) => (
            <span
              key={p}
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                PHASE_MAP[p].badgeClass,
              )}
            >
              {PHASE_MAP[p].label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {isCandidate ? (
          <>
            <button
              onClick={() => acceptCandidate(protocol.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-sage py-2 text-small font-medium text-white transition-all duration-250 hover:bg-sage/90 active:scale-[0.98]"
            >
              <Check size={15} /> 接受
            </button>
            <button
              onClick={() => deleteProtocol(protocol.id)}
              className="rounded-full border border-edge px-4 py-2 text-small text-ink-muted transition-all duration-250 hover:bg-white/50"
            >
              <Trash2 size={15} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => toggleStatus(protocol.id)}
              className="flex items-center gap-1.5 rounded-full border border-edge px-4 py-2 text-small text-ink-muted transition-all duration-250 hover:bg-white/50"
            >
              {isPaused ? (
                <>
                  <Play size={14} /> 恢复
                </>
              ) : (
                <>
                  <Pause size={14} /> 暂停
                </>
              )}
            </button>
            <button
              onClick={() => deleteProtocol(protocol.id)}
              className="rounded-full border border-edge px-4 py-2 text-small text-ink-muted transition-all duration-250 hover:bg-warn-mist/40 hover:text-warn"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
    </motion.article>
  );
}
