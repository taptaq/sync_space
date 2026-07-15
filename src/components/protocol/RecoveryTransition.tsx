import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type AnimationPlaybackControls,
} from "framer-motion";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

// 气候恢复视觉（协议执行计时期间，背景从雷暴预警陶土红缓慢过渡到晴朗微风鼠尾草绿）
// 让用户视觉上感到"暴风雨过去了"而非"计时结束"
// 颜色过渡色阶：陶土红 → 暖琥珀 → 浅鼠尾草 → 鼠尾草绿
const COLOR_STOPS = ["#C4715A", "#C4956A", "#8FB5A0", "#6B9E8A"];

export default function RecoveryTransition({
  durationMinutes,
  onComplete,
  onEarlyExit,
}: {
  durationMinutes: number;
  onComplete: () => void;
  onEarlyExit: () => void;
}) {
  // 总秒数，至少 1 秒避免除零
  const totalSeconds = Math.max(1, Math.round(durationMinutes * 60));
  // 低感官模式：降低装饰性动效，颜色过渡本身已足够柔和
  const lowSensoryMode = useStore((s) => s.lowSensoryMode);
  const { tr } = useT();

  // 进度 0 → 1，用 motion value + animate 驱动（JS 驱动以便可暂停）
  const progress = useMotionValue(0);
  // 背景色随进度在四个色阶间平滑插值
  const backgroundColor = useTransform(progress, [0, 0.34, 0.67, 1], COLOR_STOPS);

  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const completedRef = useRef(false);
  // 用 ref 持有回调，避免回调身份变化导致动画重启
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // 驱动进度动画：linear 持续整段时长，完成后触发 onComplete
  useEffect(() => {
    const controls = animate(progress, 1, {
      duration: totalSeconds,
      ease: "linear",
      onComplete: () => {
        if (completedRef.current) return;
        completedRef.current = true;
        onCompleteRef.current();
      },
    });
    controlsRef.current = controls;
    return () => controls.stop();
  }, [progress, totalSeconds]);

  // 暂停 / 恢复：直接控制动画播放
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    if (paused) c.pause();
    else c.play();
  }, [paused]);

  // 剩余秒数跟随进度更新
  useMotionValueEvent(progress, "change", (latest) => {
    const remain = Math.max(0, Math.ceil((1 - latest) * totalSeconds));
    setRemainingSeconds(remain);
  });

  // mm:ss 格式
  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(remainingSeconds % 60).padStart(2, "0");

  // 快结束时（最后约 15%，且不少于 30 秒）文案变为"天晴了"
  const isClearing =
    remainingSeconds <= Math.max(30, Math.round(totalSeconds * 0.15));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ backgroundColor }}
      className="fixed inset-0 z-50 flex select-none flex-col items-center justify-center px-6"
    >
      {/* 呼吸圆：吸气放大、呼气缩小，4 秒一个周期；低感官模式下静止不放大 */}
      <motion.div
        animate={lowSensoryMode ? { scale: 1 } : { scale: [1, 1.06, 1] }}
        transition={
          lowSensoryMode
            ? { duration: 0 }
            : { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
        className="flex h-44 w-44 flex-col items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
      >
        <span className="font-mono text-3xl tracking-wide text-white/90 tabular-nums">
          {mm}:{ss}
        </span>
        <span className="mt-1 text-xs text-white/60">{tr("recovery_remaining")}</span>
      </motion.div>

      {/* 底部文案：暴风雨正在过去 → 天晴了 */}
      <p className="mt-10 font-serif text-2xl text-white/90">
        {isClearing ? tr("recovery_clearing") : tr("recovery_passing")}
      </p>
      <p className="mt-2 text-sm text-white/50">
        {paused ? tr("recovery_paused") : tr("recovery_breath_hint")}
      </p>

      {/* 低刺激控制区：暂停 / 提前结束（无负罪感退出） */}
      <div className="absolute bottom-10 flex items-center gap-6">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="text-sm text-white/70 transition-colors hover:text-white/90"
        >
          {paused ? tr("recovery_continue") : tr("recovery_pause")}
        </button>
        <span className="text-white/20">·</span>
        <button
          type="button"
          onClick={onEarlyExit}
          className="text-sm text-white/70 transition-colors hover:text-white/90"
        >
          {tr("recovery_end_early")}
        </button>
      </div>
    </motion.div>
  );
}
