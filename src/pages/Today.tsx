import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Mic, Sliders, Sparkles } from "lucide-react";
import WeatherCard from "@/components/weather/WeatherCard";
import CheckInCard from "@/components/checkin/CheckInCard";
import ParentCheckInCard from "@/components/checkin/ParentCheckInCard";
import ParentGuidanceCard from "@/components/parent/ParentGuidanceCard";
import VoiceCheckIn from "@/components/qwen/VoiceCheckIn";
import VoiceCrashNote from "@/components/qwen/VoiceCrashNote";
import EnvSensoryScan from "@/components/qwen/EnvSensoryScan";
import CrashButton from "@/components/crash/CrashButton";
import AttentionBanner from "@/components/today/AttentionBanner";
import RecommendedProtocolsCard from "@/components/today/RecommendedProtocolsCard";
import FeedbackPrompt from "@/components/today/FeedbackPrompt";
import { useStore } from "@/store/useStore";
import { formatTime, isToday } from "@/lib/format";
import { getAxisProfile } from "@/lib/axisConfig";
import {
  compareCheckins,
  recentPhaseTrajectory,
} from "@/lib/checkinCompare";
import { detectPhase } from "@/lib/stageEngine";
import { cn } from "@/lib/utils";

// 今日页 · 每日循环（PRD §05 页面1：90% 的使用场景）
export default function Today() {
  const currentWeather = useStore((s) => s.currentWeather);
  const checkins = useStore((s) => s.checkins);
  const crashMarks = useStore((s) => s.crashMarks);
  const neuroType = useStore((s) => s.neuroType);
  const appMode = useStore((s) => s.appMode);
  const qwenEnabled = useStore((s) => s.qwenEnabled);
  const lowSensoryMode = useStore((s) => s.lowSensoryMode);
  const setLowSensoryMode = useStore((s) => s.setLowSensoryMode);
  const pushToast = useStore((s) => s.pushToast);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  // 签到方式切换：滑块 / 语音（仅 qwenEnabled 且自主模式时可用）
  const [checkinMode, setCheckinMode] = useState<"slider" | "voice">("slider");

  const isParentProxy = appMode === "parent_proxy";
  // 语音签到仅在平稳/累积/恢复期可用——预警/过载期 ASD 人士可能无法组织语言
  // PRD §04：过载时"无法组织语言的状态"，此时语音输入是反同频的
  const currentPhase = detectPhase(currentWeather.climate, crashMarks);
  const voiceCheckinBlocked = currentPhase === "warning" || currentPhase === "overload";
  const canUseVoiceCheckin = qwenEnabled && !isParentProxy && !voiceCheckinBlocked;
  const effectiveCheckinMode =
    canUseVoiceCheckin && checkinMode === "voice" ? "voice" : "slider";

  const axisProfile = getAxisProfile(neuroType);
  const [axis1, axis2, axis3] = axisProfile.axes;

  const todayCheckins = checkins
    .filter((c) => isToday(c.checkin_at))
    .sort(
      (a, b) =>
        new Date(b.checkin_at).getTime() - new Date(a.checkin_at).getTime(),
    );

  const lastCheckinTime = todayCheckins[0]?.checkin_at;

  // Before/After 对比：今天倒数第一次 vs 当前最新
  const diff = useMemo(() => {
    if (todayCheckins.length < 2) return null;
    return compareCheckins(todayCheckins[1], todayCheckins[0], neuroType);
  }, [todayCheckins, neuroType]);

  // 最近 5 次签到的阶段轨迹（全局）
  const trajectory = useMemo(
    () => recentPhaseTrajectory(checkins, 5),
    [checkins],
  );

  return (
    <div className="space-y-5">
      {/* 顶部天气卡（无缝贴顶 · 五阶段色调 · 前后对比 + 轨迹） */}
      <div className="-mx-5 -mt-5">
        <WeatherCard
          weather={currentWeather}
          updatedAt={lastCheckinTime ? formatTime(lastCheckinTime) : undefined}
          crashMarks={crashMarks}
          diff={diff}
          trajectory={trajectory}
        />
      </div>

      {/* 今日关注横幅（主动反馈：签到提醒 / 趋势预警 / 待处理事项） */}
      <AttentionBanner />

      {/* 阶段匹配协议推荐（当前阶段优先推适用协议） */}
      <RecommendedProtocolsCard />

      {/* 今日签到 · 根据模式切换：自主签到 / 家长代理签到 / 语音签到 */}
      {isParentProxy ? (
        <ParentCheckInCard />
      ) : canUseVoiceCheckin && effectiveCheckinMode === "voice" ? (
        <VoiceCheckIn />
      ) : (
        <CheckInCard />
      )}

      {/* 语音被阶段屏蔽时的温和提示 */}
      {qwenEnabled && !isParentProxy && voiceCheckinBlocked && (
        <p className="text-center text-xs text-ink-faint">
          现在不太适合说话记录 · 用滑块就好
        </p>
      )}

      {/* 签到方式切换（仅 qwenEnabled 且自主模式） */}
      {canUseVoiceCheckin && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCheckinMode("slider")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-250",
              checkinMode === "slider"
                ? "bg-primary text-white"
                : "bg-white/50 text-ink-muted hover:bg-white/70",
            )}
          >
            <Sliders size={12} /> 滑块
          </button>
          <button
            onClick={() => setCheckinMode("voice")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-250",
              checkinMode === "voice"
                ? "bg-primary text-white"
                : "bg-white/50 text-ink-muted hover:bg-white/70",
            )}
          >
            <Mic size={12} /> 语音
          </button>
        </div>
      )}

      {/* 家长引导卡片（仅家长代理模式显示） */}
      {isParentProxy && <ParentGuidanceCard />}

      {/* 崩溃标记 · qwenEnabled 时用语音补记版 */}
      {qwenEnabled ? <VoiceCrashNote /> : <CrashButton />}

      {/* 环境感官友好度扫描（仅 qwenEnabled） */}
      {qwenEnabled && <EnvSensoryScan />}

      {/* 今日已签到记录 */}
      {todayCheckins.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-card border border-edge bg-white/40 p-5"
        >
          <h3 className="mb-3 font-serif text-lg text-ink">今日已记录</h3>
          <div className="space-y-3">
            {todayCheckins.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between text-small"
              >
                <span className="font-mono text-xs text-ink-muted">
                  {formatTime(c.checkin_at)}
                </span>
                <div className="flex gap-3 font-mono text-xs">
                  <span className={axis1.color}>
                    {axis1.label} {c.axis_sensory.toFixed(1)}
                  </span>
                  <span className={axis2.color}>
                    {axis2.label} {c.axis_social.toFixed(1)}
                  </span>
                  <span className={axis3.color}>
                    {axis3.label} {c.axis_predictability.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* 非诊断声明（PRD §11：首页底部常驻此声明） */}
      <div className="pt-2">
        <button
          onClick={() => setShowDisclaimer((v) => !v)}
          className="flex w-full items-center justify-center gap-1 text-xs text-ink-muted/70 transition-colors hover:text-ink-muted"
        >
          SyncSpace 不是医疗工具，不做任何诊断
          <ChevronDown
            size={12}
            className={cn(
              "transition-transform duration-250",
              showDisclaimer && "rotate-180",
            )}
          />
        </button>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 space-y-3"
          >
            <p className="px-4 text-center text-xs leading-relaxed text-ink-muted">
              {isParentProxy ? (
                <>
                  家长引导建议是温柔的支持，不替代专业评估。
                  <br />
                  如孩子出现自伤或伤人倾向，请保护安全并联系专业人士。
                  <br />
                  孩子的所有数据仅存储在家长设备本地。
                </>
              ) : (
                <>
                  如果你正在经历严重困扰，请联系专业人士。
                  <br />
                  SyncSpace 面向能自主签到的人（建议 13+）。
                  <br />
                  你的所有数据仅存储在本地，只有你自己可见。
                </>
              )}
            </p>
            {/* 低感官模式切换（感官安全工程 · WCAG 2.3.3 · 光敏感/前庭敏感/HSP 友好） */}
            <button
              onClick={() => {
                const next = !lowSensoryMode;
                setLowSensoryMode(next);
                pushToast("info", next ? "已开启低感官模式" : "已关闭低感官模式");
              }}
              className={cn(
                "mx-auto flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-all duration-250",
                lowSensoryMode
                  ? "border-primary/30 bg-primary-mist/40 text-primary"
                  : "border-edge bg-white/40 text-ink-muted hover:bg-white/60",
              )}
            >
              <Sparkles size={12} />
              {lowSensoryMode ? "低感官模式已开启" : "开启低感官模式"}
            </button>
            <p className="px-4 text-center text-[11px] leading-relaxed text-ink-faint">
              降低色彩饱和度、减少动效和阴影。如果你对光/动效敏感，或正在过载恢复期，这个模式可能更舒适。
            </p>
          </motion.div>
        )}
      </div>

      {/* 协议执行效果反馈（延时轻量 bottom sheet） */}
      <FeedbackPrompt />
    </div>
  );
}
