import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mic, Sliders, Mail, RotateCcw, Languages, Users, User, Sparkles } from "lucide-react";
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
import { ModalPortal } from "@/components/common/ModalPortal";
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
  const adhdSubtype = useStore((s) => s.adhdSubtype);
  const appMode = useStore((s) => s.appMode);
  const setAppMode = useStore((s) => s.setAppMode);
  const qwenEnabled = useStore((s) => s.qwenEnabled);
  const setQwenEnabled = useStore((s) => s.setQwenEnabled);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const pushToast = useStore((s) => s.pushToast);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { showSelector, openSelector, closeSelector } = useNeuroTypeSelector();
  const [checkinMode, setCheckinMode] = useState<"slider" | "voice">("slider");
  const [showReward, setShowReward] = useState(false);
  const [showPostcard, setShowPostcard] = useState(false);
  const [showRecords, setShowRecords] = useState(false);

  const isParentProxy = appMode === "parent_proxy";
  const { tr, tt } = useT();
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
      {/* 0. 顶部设置栏：角色切换 + 语言切换 + 切换神经特质（右上角 · 不折叠） */}
      <div className="flex items-center justify-end gap-2 pt-5">
        <button
          onClick={() => {
            const next = appMode === "self" ? "parent_proxy" : "self";
            setAppMode(next);
            pushToast("info", next === "parent_proxy" ? tr("today_role_switched_parent") : tr("today_role_switched_self"));
          }}
          className="flex items-center gap-1.5 rounded-full border border-edge bg-white/40 px-3 py-1.5 text-xs text-ink-muted transition-all duration-250 hover:bg-white/60"
          aria-label={appMode === "self" ? tr("today_role_parent") : tr("today_role_self")}
        >
          {appMode === "self" ? <User size={11} /> : <Users size={11} />}
          {appMode === "self" ? tr("today_role_self") : tr("today_role_parent")}
        </button>
        <button
          onClick={() => {
            const next = language === "zh" ? "en" : "zh";
            setLanguage(next);
            pushToast("info", next === "en" ? tr("lang_toast_en") : tr("lang_toast_zh"));
          }}
          className="flex items-center gap-1.5 rounded-full border border-edge bg-white/40 px-3 py-1.5 text-xs text-ink-muted transition-all duration-250 hover:bg-white/60"
          aria-label={tr("change_lang")}
        >
          <Languages size={11} />
          {language === "zh" ? "中文" : "EN"}
        </button>
        <button
          onClick={openSelector}
          className="flex items-center gap-1.5 rounded-full border border-edge bg-white/40 px-3 py-1.5 text-xs text-ink-muted transition-all duration-250 hover:bg-white/60"
          aria-label={tr("today_change_neurotype")}
        >
          <RotateCcw size={11} />
          {tr("today_change_neurotype")}·{neuroType === "asd" ? "ASD" : neuroType === "adhd" ? (adhdSubtype === "inattentive" ? "ADHD·注意力缺陷" : adhdSubtype === "hyperactive" ? "ADHD·多动冲动" : adhdSubtype === "combined" ? "ADHD·混合" : "ADHD") : tr("onb_neuro_other")}
        </button>
        <button
          onClick={() => {
            const next = !qwenEnabled;
            setQwenEnabled(next);
            pushToast("info", next ? tr("today_ai_switched_on") : tr("today_ai_switched_off"));
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-250",
            qwenEnabled
              ? "border-primary/40 bg-primary-mist/40 text-primary hover:bg-primary-mist/60"
              : "border-edge bg-white/40 text-ink-muted hover:bg-white/60",
          )}
          aria-label={qwenEnabled ? tr("today_ai_on") : tr("today_ai_off")}
        >
          <Sparkles size={11} />
          {qwenEnabled ? tr("today_ai_on") : tr("today_ai_off")}
        </button>
      </div>

      {/* 1. 天气卡（顶部 · 可预测位置） */}
      <div className="-mt-2">
        <WeatherCard
          weather={currentWeather}
          updatedAt={lastCheckinTime ? formatTime(lastCheckinTime) : undefined}
          crashMarks={crashMarks}
          diff={diff}
          trajectory={trajectory}
          compact
          statusLabel={lastCheckinTime ? tr("weather_recorded_at") : tr("weather_no_record")}
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
            <p className="text-sm font-medium text-ink">{tr("today_postcard_title")}</p>
            <p className="text-xs text-ink-muted">{tr("today_postcard_desc")}</p>
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
                  <span className={axis1.color}>{tt(axis1.label)} {c.axis_sensory.toFixed(1)}</span>
                  <span className={axis2.color}>{tt(axis2.label)} {c.axis_social.toFixed(1)}</span>
                  <span className={axis3.color}>{tt(axis3.label)} {c.axis_predictability.toFixed(1)}</span>
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
        />
      </div>

      {/* 神经特质选择器弹窗 */}
      <AnimatePresence>
        {showSelector && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-sm sm:items-center"
              onClick={closeSelector}
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-t-2xl border-t border-white/30 bg-base/95 p-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:mb-0 sm:rounded-2xl"
              >
                <NeuroTypeSelector onClose={closeSelector} />
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* 协议执行效果反馈 */}
      <ModalPortal>
        <FeedbackPrompt />
      </ModalPortal>

      {/* 签到即时奖励（多巴胺回路 · 3 秒动画） */}
      <ModalPortal>
        <CheckInReward
          show={showReward}
          phase={currentPhase}
          streakDays={streakDays}
          totalCheckins={checkins.length}
          onComplete={() => setShowReward(false)}
        />
      </ModalPortal>

      {/* 气候明信片 */}
      <ModalPortal>
        <ClimatePostcard
          show={showPostcard}
          onClose={() => setShowPostcard(false)}
          checkins={checkins}
          neuroType={neuroType}
          currentWeather={currentWeather}
        />
      </ModalPortal>

    </div>
  );
}
