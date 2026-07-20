import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Pause, Play, PlayCircle, Trash2 } from "lucide-react";
import type { Protocol } from "@/types";
import { useStore } from "@/store/useStore";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getAxisProfile, getBandLabel } from "@/lib/axisConfig";
import { PHASE_MAP } from "@/lib/stageEngine";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";
import ProtocolRehearsal from "./ProtocolRehearsal";

const SOURCE_LABEL_KEY: Record<Protocol["source"], StringKey> = {
  manual: "protocol_card_source_manual",
  ai_suggestion: "protocol_card_source_ai",
  crash_reflection: "protocol_card_source_crash",
};

// 协议列表项（PRD §05 F-06 协议管理）
export default function ProtocolCard({ protocol }: { protocol: Protocol }) {
  const toggleStatus = useStore((s) => s.toggleProtocolStatus);
  const acceptCandidate = useStore((s) => s.acceptCandidateProtocol);
  const deleteProtocol = useStore((s) => s.deleteProtocol);
  const neuroType = useStore((s) => s.neuroType);
  const pushToast = useStore((s) => s.pushToast);
  const { tr, tt } = useT();
  const [rehearsing, setRehearsing] = useState(false);

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
            {tr("protocol_when_label")} · {tt(protocol.trigger.description)}
          </p>
          {bandLabel && (
            <p className="mt-0.5 text-xs text-ink-faint">
              {tr("protocol_card_threshold_trigger", { axis: tt(axisCfg?.label ?? ""), band: tt(bandLabel) })}
            </p>
          )}
          <p className="mt-1.5 text-body leading-relaxed text-ink">
            {tt(protocol.action.description)}
          </p>
        </div>
        {isCandidate && (
          <span className="shrink-0 rounded-full bg-primary-mist px-2.5 py-1 text-xs text-primary">
            {tr("protocol_card_pending")}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
        <span>{tr("protocol_card_source_label")}{tr(SOURCE_LABEL_KEY[protocol.source])}</span>
        <span>·</span>
        <span>{tr("protocol_card_exec_count", { count: protocol.execution_count })}</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Clock size={11} /> {tr("protocol_card_time_estimate", { minutes: protocol.action.duration_minutes })}
        </span>
        {protocol.last_executed_at && (
          <>
            <span>·</span>
            <span>
              {tr("protocol_card_last_label")}{relativeTime(protocol.last_executed_at)}
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
              {tt(PHASE_MAP[p].label)}
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
              <Check size={15} /> {tr("protocol_card_accept")}
            </button>
            <button
              onClick={() => setRehearsing(true)}
              className="flex items-center gap-1.5 rounded-full border border-edge px-4 py-2 text-small text-ink-muted transition-all duration-250 hover:bg-white/50 active:scale-[0.98]"
            >
              <PlayCircle size={15} /> {tr("protocol_card_rehearse")}
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
                  <Play size={14} /> {tr("protocol_card_resume")}
                </>
              ) : (
                <>
                  <Pause size={14} /> {tr("protocol_card_pause")}
                </>
              )}
            </button>
            <button
              onClick={() => setRehearsing(true)}
              className="flex items-center gap-1.5 rounded-full border border-edge px-4 py-2 text-small text-ink-muted transition-all duration-250 hover:bg-white/50 active:scale-[0.98]"
            >
              <PlayCircle size={15} /> {tr("protocol_card_rehearse")}
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

      {/* 协议演练模式（纯模拟 · 不写入 executions） */}
      <AnimatePresence>
        {rehearsing && (
          <ProtocolRehearsal
            protocol={protocol}
            onExit={() => setRehearsing(false)}
            onFeedback={(helpful) => {
              pushToast(
                "info",
                helpful ? tr("protocol_card_toast_recorded") : tr("protocol_card_toast_adjust"),
              );
              setRehearsing(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.article>
  );
}
