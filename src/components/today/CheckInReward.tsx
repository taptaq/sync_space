import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import type { Phase } from "@/types";

// 签到即时奖励（多巴胺回路 · ADHD 友好）
// 每次签到后展示一个短暂的正面反馈动画
// 连续签到天数解锁不同等级的精灵鼓励语
// Phase 不同时奖励文案不同（过载期不庆祝，而是肯定"你注意到了"）

const REWARD_MESSAGES: Record<Phase, string[]> = {
  stable: ["你做到了，继续保持着 ✨", "又一次签到，气候在跟着你变化"],
  accumulating: ["你注意到了信号，这本身就很厉害", "提前看见，就还有选择的空间"],
  warning: ["你抓住了预警，这就是保护自己", "在最难的时候还在签到，你很勇敢"],
  overload: ["你撑过来了，现在只需要休息", "此刻签到本身就是一种自救"],
  recovery: ["允许自己慢一点，回血中", "低电量也没关系，你在照顾自己"],
};

const STREAK_MESSAGES: { days: number; msg: string }[] = [
  { days: 1, msg: "第一次签到，欢迎来到你的内在气候" },
  { days: 3, msg: "连续 3 天，你开始了解自己了" },
  { days: 7, msg: "整整一周！你的气候图谱在成形" },
  { days: 14, msg: "两周了，你对自己的理解在加深" },
  { days: 30, msg: "一个月！你在构建自己的调节系统" },
];

function getStreakMessage(streak: number): string | null {
  let result: string | null = null;
  for (const { days, msg } of STREAK_MESSAGES) {
    if (streak >= days) result = msg;
  }
  return result;
}

export default function CheckInReward({
  show,
  phase,
  streakDays,
  totalCheckins,
  onComplete,
}: {
  show: boolean;
  phase: Phase;
  streakDays: number;
  totalCheckins: number;
  onComplete: () => void;
}) {
  const phaseMessages = REWARD_MESSAGES[phase] ?? REWARD_MESSAGES.stable;
  const randomMsg = phaseMessages[Math.floor(Math.random() * phaseMessages.length)];
  const streakMsg = getStreakMessage(streakDays);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 backdrop-blur-sm"
          onClick={onComplete}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="mx-6 max-w-xs rounded-bowl bg-white/80 p-6 text-center shadow-lift"
          >
            {/* 光晕扩散 */}
            <motion.div
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary-mist"
            />
            {/* 核心反馈 */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="font-handwriting text-xl text-ink"
            >
              {randomMsg}
            </motion.p>

            {/* 连续签到里程碑 */}
            {streakMsg && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="mt-2 rounded-full bg-primary-mist/50 px-3 py-1 text-xs text-primary"
              >
                {streakMsg}
              </motion.p>
            )}

            {/* 总签到次数 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-3 text-xs text-ink-muted"
            >
              第 {totalCheckins} 次签到 · 连续 {streakDays} 天
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
