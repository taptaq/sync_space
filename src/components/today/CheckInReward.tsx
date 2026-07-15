import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo } from "react";
import type { Phase } from "@/types";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";

// 签到即时奖励（多巴胺回路 · ADHD 友好）
// 每次签到后展示一个短暂的正面反馈动画
// 连续签到天数解锁不同等级的精灵鼓励语
// Phase 不同时奖励文案不同（过载期不庆祝，而是肯定"你注意到了"）

const REWARD_MESSAGE_KEYS: Record<Phase, [StringKey, StringKey]> = {
  stable: ["reward_stable_1", "reward_stable_2"],
  accumulating: ["reward_accumulating_1", "reward_accumulating_2"],
  warning: ["reward_warning_1", "reward_warning_2"],
  overload: ["reward_overload_1", "reward_overload_2"],
  recovery: ["reward_recovery_1", "reward_recovery_2"],
};

const STREAK_MESSAGE_KEYS: { days: number; key: StringKey }[] = [
  { days: 1, key: "reward_streak_1" },
  { days: 3, key: "reward_streak_3" },
  { days: 7, key: "reward_streak_7" },
  { days: 14, key: "reward_streak_14" },
  { days: 30, key: "reward_streak_30" },
];

function getStreakKey(streak: number): StringKey | null {
  let result: StringKey | null = null;
  for (const { days, key } of STREAK_MESSAGE_KEYS) {
    if (streak >= days) result = key;
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
  const { tr } = useT();
  const phaseKeys = REWARD_MESSAGE_KEYS[phase] ?? REWARD_MESSAGE_KEYS.stable;
  const randomMsg = useMemo(() => tr(phaseKeys[Math.floor(Math.random() * phaseKeys.length)]), [phaseKeys, tr]);
  const streakKey = useMemo(() => getStreakKey(streakDays), [streakDays]);

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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 backdrop-blur-sm"
          onClick={onComplete}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="mx-6 max-w-xs rounded-2xl border border-white/30 bg-base/95 p-6 text-center shadow-2xl"
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
            {streakKey && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="mt-2 rounded-full bg-primary-mist/50 px-3 py-1 text-xs text-primary"
              >
                {tr(streakKey)}
              </motion.p>
            )}

            {/* 总签到次数 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-3 text-xs text-ink-muted"
            >
              {tr("reward_count", { count: totalCheckins, streak: streakDays })}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
