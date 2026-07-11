import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Timer } from "lucide-react";
import { useStore } from "@/store/useStore";
import { formatTime } from "@/lib/format";
import { getAxisProfile, getBandLabel } from "@/lib/axisConfig";
import RecoveryTransition from "@/components/protocol/RecoveryTransition";
import type { Protocol } from "@/types";

// 协议触发推送（PRD §05 F-03 + §09 不用突然弹窗，用 slide-up + backdrop fade）
// 一次 tap 完成（"去"开始计时 / "推迟"30 分钟后再提醒）
export default function ProtocolTrigger() {
  const activeTrigger = useStore((s) => s.activeTrigger);
  const executeProtocol = useStore((s) => s.executeProtocol);
  const postponeProtocol = useStore((s) => s.postponeProtocol);
  const dismissTrigger = useStore((s) => s.dismissTrigger);
  const pushToast = useStore((s) => s.pushToast);
  const neuroType = useStore((s) => s.neuroType);

  // 气候恢复视觉状态：协议执行计时期间显示恢复过渡层
  const [executingRecovery, setExecutingRecovery] = useState(false);
  const [recoveryProtocol, setRecoveryProtocol] = useState<Protocol | null>(
    null,
  );

  // 算出触发条件的程度描述，让用户明白此刻达到了什么程度
  const trigger = activeTrigger?.protocol.trigger;
  const axisCfg =
    trigger && trigger.type === "threshold" && trigger.axis
      ? getAxisProfile(neuroType).axes.find((a) => a.key === trigger.axis)
      : undefined;
  const bandLabel =
    axisCfg && trigger?.value != null
      ? getBandLabel(trigger.value, axisCfg)
      : "";

  // 判断协议是否走气候恢复视觉：有 timer 且时长 ≥ 5 分钟
  const shouldShowRecovery = (p: Protocol) =>
    p.action.timer && p.action.duration_minutes >= 5;

  // 执行协议：若符合恢复视觉条件，进入恢复过渡；否则走原有逻辑
  const handleExecute = (protocol: Protocol) => {
    if (shouldShowRecovery(protocol)) {
      // 进入气候恢复视觉，先收起触发推送卡（恢复层会覆盖全屏）
      // 执行记录等恢复过渡结束后再标记
      setRecoveryProtocol(protocol);
      setExecutingRecovery(true);
      dismissTrigger();
    } else {
      executeProtocol(protocol.id);
    }
  };

  return (
    <>
    <AnimatePresence>
      {activeTrigger && (
        <>
          {/* backdrop fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => handleExecute(activeTrigger.protocol)}
            className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-[2px]"
          />
          {/* slide-up 推送卡 */}
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md p-4 pb-8"
          >
            <div className="rounded-bowl border border-edge bg-base p-6 shadow-lift">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-primary">
                  协议触发
                </span>
                <span className="font-mono text-xs text-ink-muted">
                  {formatTime(activeTrigger.triggeredAt)}
                </span>
              </div>

              <p className="text-body leading-relaxed text-ink">
                {activeTrigger.reason}
              </p>

              <div className="mt-2 rounded-card bg-primary-mist/50 p-3">
                <p className="text-small text-ink-muted">
                  <span className="font-mono text-primary">WHEN</span>{" "}
                  {activeTrigger.protocol.trigger.description}
                </p>
                {bandLabel && (
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {axisCfg?.label}已达到「{bandLabel}」程度
                  </p>
                )}
                <p className="mt-1 text-small text-ink-muted">
                  <span className="font-mono text-sage">THEN</span>{" "}
                  {activeTrigger.protocol.action.description}
                </p>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => handleExecute(activeTrigger.protocol)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-body font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
                >
                  <Timer size={18} />
                  去 · 开始 {activeTrigger.protocol.action.duration_minutes} 分钟计时
                </button>
                <button
                  onClick={() => postponeProtocol(activeTrigger.protocol.id)}
                  className="rounded-full border border-edge px-5 py-3 text-body text-ink-muted transition-all duration-250 hover:bg-white/50 active:scale-[0.98]"
                >
                  推迟
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-ink-muted">
                推迟 30 分钟后再提醒 · 最多推迟 2 次
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* 气候恢复视觉：协议执行计时期间，背景色从陶土红缓慢过渡到鼠尾草绿 */}
    <AnimatePresence>
      {executingRecovery && recoveryProtocol && (
        <RecoveryTransition
          key="recovery"
          durationMinutes={recoveryProtocol.action.duration_minutes}
          onComplete={() => {
            // 标记执行完成：记录执行、清空恢复状态
            const id = recoveryProtocol.id;
            setExecutingRecovery(false);
            setRecoveryProtocol(null);
            executeProtocol(id);
          }}
          onEarlyExit={() => {
            // 提前退出：无负罪感，只轻声说"好的，回到现在"
            setExecutingRecovery(false);
            setRecoveryProtocol(null);
            pushToast("info", "好的，回到现在");
          }}
        />
      )}
    </AnimatePresence>
    </>
  );
}
