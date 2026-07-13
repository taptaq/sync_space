import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mic, Sliders, Mail } from "lucide-react";
import WeatherCard from "@/components/weather/WeatherCard";
import CheckInCard from "@/components/checkin/CheckInCard";
import ParentCheckInCard from "@/components/checkin/ParentCheckInCard";
import ParentGuidanceCard from "@/components/parent/ParentGuidanceCard";
import VoiceCheckIn from "@/components/qwen/VoiceCheckIn";
import FeedbackPrompt from "@/components/today/FeedbackPrompt";
import CheckInReward from "@/components/today/CheckInReward";
import ClimatePostcard from "@/components/today/ClimatePostcard";
import { getClimateFingerprint } from "@/lib/climateFingerprint";
import NeuroTypeSelector, { useNeuroTypeSelector } from "@/components/common/NeuroTypeSelector";
import Toolbox from "@/components/today/Toolbox";
import PhaseActionCard from "@/components/today/PhaseActionCard";
import QuickCapture from "@/components/today/QuickCapture";
import Disclaimer from "@/components/common/Disclaimer";
import { useStore } from "@/store/useStore";
import { formatTime, isToday } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { getAxisProfile } from "@/lib/axisConfig";
import {
  compareCheckins,
  recentPhaseTrajectory,
} from "@/lib/checkinCompare";
import { detectPhase } from "@/lib/stageEngine";
import { cn } from "@/lib/utils";

// 今日页 · 重构：单条主路径 + 可预测布局 + 低频功能折叠
// ASD/ADHD 友好：不再根据神经类型显示/隐藏卡片 → 布局始终一致
// 签到是 Today 的唯一核心动作；其他功能收进工具箱，默认收起
export default function Today() {
  const currentWeather = useStore((s) => s.currentWeather);
  const checkins = useStore((s) => s.checkins);
  const crashMarks = useStore((s) => s.crashMarks);
  const neuroType = useStore((s) => s.neuroType);
  const appMode = useStore((s) => s.appMode);
  const qwenEnabled = useStore((s) => s.qwenEnabled);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { showSelector, openSelector, closeSelector } = useNeuroTypeSelector();
  const [checkinMode, setCheckinMode] = useState<"slider" | "voice">("slider");
  const [showReward, setShowReward] = useState(false);
  const [showPostcard, setShowPostcard] = useState(false);
  const [showRecords, setShowRecords] = useState(false);

  const isParentProxy = appMode === "parent_proxy";
  const { tr } = useT();
  const currentPhase = detectPhase(currentWeather.climate, crashMarks);
  const voiceCheckinBlocked = currentPhase === "warning" || currentPhase === "overload";
  const canUseVoiceCheckin = qwenEnabled && !isParentProxy && !voiceCheckinBlocked;
  const effectiveCheckinMode =
    canUseVoiceCheckin && checkinMode === "voice" ? "voice" : "slider";

  const axisProfile = getAxisProfile(neuroType);
  const [axis1, axis2, axis3] = axisProfile.axes;

  const todayCheckins = checkins
    .filter((c) => isToday(c.checkin_at))
    .sort((a, b) => new Date(b.checkin_at).getTime() - new Date(a.checkin_at).getTime());

  const lastCheckinTime = todayCheckins[0]?.checkin_at;

  const diff = useMemo(() => {
    if (todayCheckins.length < 2) return null;
    return compareCheckins(todayCheckins[1], todayCheckins[0], neuroType);
  }, [todayCheckins, neuroType]);

  const trajectory = useMemo(() => recentPhaseTrajectory(checkins, 5), [checkins]);

  // 连续签到天数
  const streakDays = useMemo(() => {
    if (checkins.length === 0) return 0;
    const daySet = new Set(
      checkins.map((c) => {
        const d = new Date(c.checkin_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
    );
    let count = 0;
    const cursor = new Date();
    for (let i = 0; i < 365; i++) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (daySet.has(key)) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [checkins]);

  // 签到提交后触发奖励
  const handleCheckinSubmitted = () => {
    setShowReward(true);
  };

  // 气候指纹：签到 3+ 次后解锁明信片
  const fingerprint = useMemo(
    () => getClimateFingerprint(checkins, neuroType),
    [checkins, neuroType],
  );

  return (
    <div className="space-y-6">
      {/* 1. 天气卡（顶部 · 可预测位置） */}
      <div className="pt-5">
        <WeatherCard
          weather={currentWeather}
          updatedAt={lastCheckinTime ? formatTime(lastCheckinTime) : undefined}
          crashMarks={crashMarks}
          diff={diff}
          trajectory={trajectory}
          compact
          statusLabel={lastCheckinTime ? "上次记录的气候" : "还没有状态记录"}
        />
      </div>

      <div className="flex items-center justify-between border-b border-edge/70 px-1 pb-3">
        <div>
          <p className="text-xs font-medium text-primary">{tr("today_section_label")}</p>
          <p className="mt-1 text-sm text-ink">{tr("today_section_desc")}</p>
        </div>
        <span className="rounded-full bg-white/55 px-2.5 py-1 text-xs text-ink-muted">
          {todayCheckins.length} {tr("today_records_count")}
        </span>
      </div>

      {/* 1.5 阶段行动衔接（天气→行动 · 单一建议 · 消除选择瘫痪） */}
      {!isParentProxy && <PhaseActionCard />}

      {/* ADHD：所有零散想法先进入同一个外部收件箱 */}
      {!isParentProxy && neuroType === "adhd" && <QuickCapture />}

      {/* 2. 核心动作：签到（自主 or 家长代理） */}
      {isParentProxy ? (
        <ParentCheckInCard />
      ) : canUseVoiceCheckin && effectiveCheckinMode === "voice" ? (
        <VoiceCheckIn />
      ) : (
        <CheckInCard onSubmitted={handleCheckinSubmitted} />
      )}

      {/* 语音被阶段屏蔽时的温和提示 */}
      {qwenEnabled && !isParentProxy && voiceCheckinBlocked && (
        <p className="text-center text-xs text-ink-faint">{tr("today_voice_blocked")}</p>
      )}

      {/* 签到方式切换 */}
      {canUseVoiceCheckin && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCheckinMode("slider")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-250",
              checkinMode === "slider" ? "bg-primary text-white" : "bg-white/50 text-ink-muted hover:bg-white/70",
            )}
          >
            <Sliders size={12} /> {tr("today_slider")}
          </button>
          <button
            onClick={() => setCheckinMode("voice")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-250",
              checkinMode === "voice" ? "bg-primary text-white" : "bg-white/50 text-ink-muted hover:bg-white/70",
            )}
          >
            <Mic size={12} /> {tr("today_voice")}
          </button>
        </div>
      )}

      {/* 家长引导卡片 */}
      {isParentProxy && <ParentGuidanceCard />}

      {/* 3. 唯一低频出口：过载补记 */}
      <Toolbox qwenEnabled={qwenEnabled} />

      {/* 3.5 气候明信片入口（签到 3+ 次解锁） */}
      {fingerprint && !isParentProxy && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => setShowPostcard(true)}
          className="flex w-full items-center gap-3 rounded-card border border-edge/60 bg-white/40 px-4 py-3 text-left transition-all duration-250 hover:bg-white/60"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-mist/50">
            <Mail size={15} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">生成气候明信片</p>
            <p className="text-xs text-ink-muted">把此刻的气候做成图片，你可以自己决定分享到哪里</p>
          </div>
        </motion.button>
      )}

      {/* 4. 今日记录默认收起，避免和当前签到竞争 */}
      {todayCheckins.length > 0 && (
        <section className="border-t border-edge/70 pt-1">
          <button
            type="button"
            onClick={() => setShowRecords((value) => !value)}
            className="flex min-h-12 w-full items-center justify-between text-sm text-ink-muted"
          >
            <span>{tr("today_recorded")} · {todayCheckins.length}</span>
            <ChevronDown size={15} className={cn("transition-transform", showRecords && "rotate-180")} />
          </button>
          {showRecords && <div className="space-y-3 pb-3">
            {todayCheckins.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between text-small"
              >
                <span className="font-mono text-xs text-ink-muted">{formatTime(c.checkin_at)}</span>
                <div className="flex gap-3 font-mono text-xs">
                  <span className={axis1.color}>{axis1.label} {c.axis_sensory.toFixed(1)}</span>
                  <span className={axis2.color}>{axis2.label} {c.axis_social.toFixed(1)}</span>
                  <span className={axis3.color}>{axis3.label} {c.axis_predictability.toFixed(1)}</span>
                </div>
              </motion.div>
            ))}
          </div>}
        </section>
      )}

      {/* 6. 底部声明 + 设置 */}
      <div className="pt-2">
        <Disclaimer
          showDisclaimer={showDisclaimer}
          setShowDisclaimer={setShowDisclaimer}
          isParentProxy={isParentProxy}
          onOpenNeuroTypeSelector={openSelector}
        />
      </div>

      {/* 神经特质选择器弹窗 */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 sm:items-center"
            onClick={closeSelector}
          >
            <div onClick={(e) => e.stopPropagation()} className="mb-20 w-full max-w-sm px-4">
              <NeuroTypeSelector onClose={closeSelector} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 协议执行效果反馈 */}
      <FeedbackPrompt />

      {/* 签到即时奖励（多巴胺回路 · 3 秒动画） */}
      <CheckInReward
        show={showReward}
        phase={currentPhase}
        streakDays={streakDays}
        totalCheckins={checkins.length}
        onComplete={() => setShowReward(false)}
      />

      {/* 气候明信片 */}
      <ClimatePostcard
        show={showPostcard}
        onClose={() => setShowPostcard(false)}
        checkins={checkins}
        neuroType={neuroType}
        currentWeather={currentWeather}
      />

    </div>
  );
}
