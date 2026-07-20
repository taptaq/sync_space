import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Ear,
  Shuffle,
  Zap,
  Clock,
  MessageCircle,
  Focus,
  X,
  ChevronRight,
  ChevronDown,
  BellRing,
} from "lucide-react";
import type { DifficultyType, Phase, SessionMode } from "@/types";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { detectPhase } from "@/lib/stageEngine";
import {
  getDifficultyPack,
  getOrderedDifficultyTypes,
  getDifficultyLabel,
} from "@/lib/difficultyPacks";
import CheckInCard from "@/components/checkin/CheckInCard";
import ParentCheckInCard from "@/components/checkin/ParentCheckInCard";
import VoiceCheckIn from "@/components/qwen/VoiceCheckIn";
import QuickCapture from "@/components/today/QuickCapture";
import ClimateFamiliar from "@/components/weather/ClimateFamiliar";
import ActionRunner from "@/components/today/ActionRunner";
import FocusStartCard from "@/components/today/FocusStartCard";
import HyperfocusGuard from "@/components/today/HyperfocusGuard";
import SensoryBattery from "@/components/today/SensoryBattery";
import TomorrowPreview from "@/components/today/TomorrowPreview";
import NeuroOnboardingGuide from "@/components/today/NeuroOnboardingGuide";
import WearableSignalPrompt from "@/components/today/WearableSignalPrompt";
import Toolbox from "@/components/today/Toolbox";
import ParentGuidanceCard from "@/components/parent/ParentGuidanceCard";

// 今日页 · 卡住时的即时帮助
// 理念：现在怎样 → 做一件事 → 有没有用
// ASD/ADHD 走查优化：
// - 删除模式切换栏 3 按钮（低感官/恢复自动激活，专注模式单独按钮）
// - 删除阶段标签（太抽象，对 ADHD 无 actionable 价值）
// - 删除困难类型 direction 副标题 + "上次使用"标记（认知过载）
// - 签到默认按 neuroType 选模式（ADHD=语音，ASD=滑块），去掉切换按钮
// - 干预包第一个动作标"先做这个"（ASD 可预测性 + ADHD 减少选择）
export default function Today() {
  const navigate = useNavigate();
  const currentWeather = useStore((s) => s.currentWeather);
  const crashMarks = useStore((s) => s.crashMarks);
  const neuroType = useStore((s) => s.neuroType);
  const appMode = useStore((s) => s.appMode);
  const qwenEnabled = useStore((s) => s.qwenEnabled);
  const sessionMode = useStore((s) => s.sessionMode);
  const setSessionMode = useStore((s) => s.setSessionMode);
  const setLowSensoryMode = useStore((s) => s.setLowSensoryMode);
  const setSoundScape = useStore((s) => s.setSoundScape);
  const pushToast = useStore((s) => s.pushToast);
  const isParentProxy = appMode === "parent_proxy";
  const { tr, tt } = useT();

  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyType | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [runnerAction, setRunnerAction] = useState<{ id: string; label: string; description: string } | null>(null);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showAllDifficulties, setShowAllDifficulties] = useState(false);
  const actionPackRef = useRef<HTMLDivElement>(null);

  const currentPhase = detectPhase(currentWeather.climate, crashMarks);
  const voiceCheckinBlocked = currentPhase === "warning" || currentPhase === "overload";
  const canUseVoiceCheckin = qwenEnabled && !isParentProxy && !voiceCheckinBlocked;
  // ADHD 默认语音签到（减少 friction），ASD/其他默认滑块
  const defaultCheckinMode: "voice" | "slider" = neuroType === "adhd" ? "voice" : "slider";

  // 过载时自动进入低感官模式：仅 ASD（ADHD 过载路径不同，更需要紧急制动而非降亮度）
  useEffect(() => {
    if (currentPhase === "overload" && sessionMode === "normal" && neuroType === "asd") {
      setSessionMode("low_sensory");
      setLowSensoryMode(true);
    }
  }, [currentPhase, sessionMode, neuroType, setSessionMode, setLowSensoryMode]);

  // ASD 累积期主动提示低感官（拒绝后本次累积期不再提示，进入预警/过载/恢复时重置）
  const [showLowSensoryPrompt, setShowLowSensoryPrompt] = useState(false);
  const lowSensoryPromptDeclinedRef = useRef(false);
  useEffect(() => {
    if (neuroType !== "asd") return;
    if (currentPhase === "accumulating" && sessionMode === "normal" && !lowSensoryPromptDeclinedRef.current) {
      setShowLowSensoryPrompt(true);
    } else if (currentPhase !== "accumulating") {
      // 离开累积期（进入预警/过载/恢复/稳定）重置拒绝标记，下次累积期重新提示
      lowSensoryPromptDeclinedRef.current = false;
      setShowLowSensoryPrompt(false);
    }
  }, [currentPhase, sessionMode, neuroType]);

  const handleLowSensoryPrompt = (accept: boolean) => {
    setShowLowSensoryPrompt(false);
    if (accept) {
      setSessionMode("low_sensory");
      setLowSensoryMode(true);
      pushToast("info", tr("mode_low_sensory_active"));
    } else {
      lowSensoryPromptDeclinedRef.current = true;
    }
  };

  // 恢复期自动进入恢复模式
  useEffect(() => {
    if (currentPhase === "recovery" && sessionMode === "normal") {
      setSessionMode("recovery");
    }
  }, [currentPhase, sessionMode, setSessionMode]);

  const orderedTypes = useMemo(() => getOrderedDifficultyTypes(neuroType), [neuroType]);
  const visibleTypes = showAllDifficulties ? orderedTypes : orderedTypes.slice(0, 3);

  const handleSelectDifficulty = (type: DifficultyType) => {
    setSelectedDifficulty(type);
    setShowMoreActions(false);
  };

  // 选完困难后把“现在能做什么”带入视口，避免用户不知道页面下方已经出现内容。
  useEffect(() => {
    if (!selectedDifficulty) return;
    actionPackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedDifficulty]);

  const handleModeSwitch = (mode: SessionMode) => {
    if (sessionMode === mode) {
      setSessionMode("normal");
      if (mode === "low_sensory") setLowSensoryMode(false);
      pushToast("info", tr("mode_exited"));
    } else {
      setSessionMode(mode);
      if (mode === "low_sensory") {
        setLowSensoryMode(true);
      } else if (sessionMode === "low_sensory") {
        setLowSensoryMode(false);
      }
      const toastKey =
        mode === "focus" ? "mode_focus_active"
        : mode === "low_sensory" ? "mode_low_sensory_active"
        : mode === "recovery" ? "mode_recovery_active"
        : "mode_exited";
      pushToast("info", tr(toastKey));
    }
  };

  // 低感官/恢复模式下隐藏困难选择，直接给 1 个动作
  const showDifficultyEntry = sessionMode === "normal";
  const isInSpecialMode = sessionMode === "low_sensory" || sessionMode === "recovery" || sessionMode === "focus";

  // 获取当前要显示的干预包
  const activePack = selectedDifficulty ? getDifficultyPack(selectedDifficulty) : null;
  const defaultPack =
    sessionMode === "low_sensory" || sessionMode === "recovery"
      ? getDifficultyPack("sensory")
      : null;
  const displayPack = activePack ?? defaultPack;

  return (
    <div className="space-y-5">
      {/* 神经特质新手引导 · 首次进入 Today 显示一次 */}
      <NeuroOnboardingGuide />
      {/* 0. 顶部：特殊模式退出 + 专注入口 + 设置 */}
      <div className="flex items-center justify-between pt-5">
        <div className="flex items-center gap-2">
          {isInSpecialMode ? (
            <button
              onClick={() => handleModeSwitch(sessionMode)}
              className="flex items-center gap-1.5 rounded-full border border-edge bg-white/40 px-3 py-1.5 text-xs text-ink-muted transition-all duration-250 hover:bg-white/60"
            >
              <X size={12} />
              {tr("mode_exit_current")}
            </button>
          ) : (
            !isParentProxy && (
              <button
                data-tour-id="focus-mode-entry"
                onClick={() => handleModeSwitch("focus")}
                className="flex items-center gap-1.5 rounded-full border border-edge bg-white/40 px-3 py-1.5 text-xs text-ink-muted transition-all duration-250 hover:bg-white/60"
                title={tr("mode_focus")}
              >
                <Focus size={12} />
                {tr("mode_focus")}
              </button>
            )
          )}
        </div>
        <button
          data-tour-id="settings-entry"
          onClick={() => navigate("/settings")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-white/40 text-ink-muted transition-all duration-250 hover:bg-white/60 hover:text-ink"
          aria-label={tr("settings_title")}
          title={tr("settings_title")}
        >
          <SettingsIcon size={17} />
        </button>
      </div>

      {/* ADHD 外部记忆优先：想到的事先安全落地，再决定是否处理 */}
      {!isParentProxy && neuroType === "adhd" && <QuickCapture />}

      {/* 0.5 状态小精灵 + 阶段锚点 · ASD 可预测性：明确"我现在在哪里" */}
      <div className="flex flex-col items-center pt-2 pb-1">
        <ClimateFamiliar phase={currentPhase} size={64} />
        <span className={cn(
          "mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
          getPhaseBadgeClass(currentPhase),
        )}>
          {tr(getPhaseShortKey(currentPhase))}
        </span>
      </div>

      {/* 可选设备只提供待确认线索；纯软件模式下不渲染任何占位。 */}
      <WearableSignalPrompt />

      {/* 0.55 ASD 友好直觉化：感官预算电池 + 明日预告（早期意识区） */}
      {/* ASD 累积期弹窗时降低周围密度，让弹窗成为唯一视觉焦点 */}
      {!isParentProxy && (
        <div className={cn("transition-all duration-300", showLowSensoryPrompt && "opacity-40 pointer-events-none")}>
          <SensoryBattery />
        </div>
      )}
      {!isParentProxy && (
        <div className={cn("transition-all duration-300", showLowSensoryPrompt && "opacity-40 pointer-events-none")}>
          <TomorrowPreview />
        </div>
      )}

      {/* 0.6 专注模式：5 分钟微启动 + ADHD hyperfocus 保护 */}
      {sessionMode === "focus" && !isParentProxy && <FocusStartCard />}
      {sessionMode === "focus" && !isParentProxy && neuroType === "adhd" && <HyperfocusGuard />}

      {/* 1. ASD 累积期主动提示低感官（拒绝后本次累积期不再弹） */}
      {showLowSensoryPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-card border border-primary/20 bg-primary-mist/25 p-4 shadow-soft"
        >
          <p className="text-sm font-medium text-ink">{tr("low_sensory_prompt_title")}</p>
          <p className="mt-1 text-xs text-ink-muted">{tr("low_sensory_prompt_body")}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleLowSensoryPrompt(true)}
              className="min-h-10 flex-1 rounded-full bg-primary px-3 text-xs text-white"
            >
              {tr("low_sensory_prompt_open")}
            </button>
            <button
              type="button"
              onClick={() => handleLowSensoryPrompt(false)}
              className="min-h-10 flex-1 rounded-full border border-edge bg-white/55 px-3 text-xs text-ink-muted"
            >
              {tr("low_sensory_prompt_skip")}
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. 低感官/恢复模式提示（更明确 · ASD 可预测性） */}
      {(sessionMode === "low_sensory" || sessionMode === "recovery") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-card bg-white/40 px-4 py-3"
        >
          <p className="text-xs text-ink-muted">
            {sessionMode === "low_sensory"
              ? tr("mode_low_sensory_hint")
              : tr("mode_recovery_hint")}
          </p>
        </motion.div>
      )}

      {/* 2. 困难类型入口（"你现在卡在哪？"）· 简化版 */}
      {showDifficultyEntry && !isParentProxy && (
        <div data-tour-id="difficulty-entry" className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
          <h2 className="mb-4 font-serif text-lg text-ink">{tr("today_stuck_question")}</h2>
          <div className="space-y-2">
            {visibleTypes.map((type) => {
              const label = getDifficultyLabel(type);
              const icon = getDifficultyIcon(type);
              const isSelected = selectedDifficulty === type;
              return (
                <button
                  key={type}
                  onClick={() => handleSelectDifficulty(type)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-250 active:scale-[0.99]",
                    isSelected
                      ? "border-primary/30 bg-primary-mist/30"
                      : "border-edge/50 bg-white/40 hover:bg-white/60",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      isSelected ? "bg-primary-mist/60" : "bg-white/50",
                    )}
                  >
                    {icon}
                  </div>
                  <p className={cn("flex-1 text-sm font-medium", isSelected ? "text-primary" : "text-ink")}>
                    {tt(label)}
                  </p>
                </button>
              );
            })}
            {orderedTypes.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllDifficulties((value) => !value)}
                className="flex min-h-10 w-full items-center justify-center gap-1 text-xs text-ink-muted"
              >
                {showAllDifficulties ? tr("today_fewer_difficulties") : tr("today_other_difficulties")}
                <ChevronDown size={13} className={cn("transition-transform", showAllDifficulties && "rotate-180")} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. 干预包内容（第一个动作标"先做这个"） */}
      {displayPack && !isParentProxy && (
        <motion.div
          ref={actionPackRef}
          key={displayPack.type}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
        >
          <div className="mb-4">
            <h3 className="font-serif text-base text-ink">{tt(displayPack.title)}</h3>
          </div>
          <div className="space-y-2">
            {(showMoreActions ? displayPack.actions : displayPack.actions.slice(0, 1)).map((action, idx) => (
              <button
                key={action.id}
                onClick={() => handleExecuteAction(action.id, tt(action.label), tt(action.description))}
                className="flex w-full items-center gap-3 rounded-xl bg-white/50 px-4 py-3 text-left transition-all duration-250 hover:bg-white/70 active:scale-[0.99]"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{tt(action.label)}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    <span className="font-medium text-ink-muted">{tr("today_after_tap")}</span>
                    {tt(action.description)}
                  </p>
                </div>
                {idx === 0 && (
                  <span className="rounded-full bg-primary-mist/50 px-2 py-0.5 text-[10px] text-primary">
                    {tr("today_do_first")}
                  </span>
                )}
                {action.duration_minutes && (
                  <span className="rounded-full bg-edge/50 px-2 py-0.5 text-[10px] text-ink-muted">
                    {action.duration_minutes}min
                  </span>
                )}
                {action.instant && idx > 0 && (
                  <span className="rounded-full bg-sage-mist/40 px-2 py-0.5 text-[10px] text-sage">
                    {tr("today_instant")}
                  </span>
                )}
              </button>
            ))}
            {displayPack.actions.length > 1 && (
              <button
                type="button"
                onClick={() => setShowMoreActions((value) => !value)}
                className="flex min-h-10 w-full items-center justify-center gap-1 text-xs text-ink-muted"
              >
                {showMoreActions ? tr("today_less_options") : tr("today_more_options")}
                <ChevronDown size={13} className={cn("transition-transform", showMoreActions && "rotate-180")} />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* 4. 快速签到入口（折叠态 · 默认按 neuroType 选模式） */}
      {!isParentProxy && (
        <div>
          {!showCheckin ? (
            <button
              onClick={() => setShowCheckin(true)}
              className="flex w-full items-center justify-between rounded-card border border-edge/60 bg-white/40 px-4 py-3 text-left transition-all duration-250 hover:bg-white/60"
            >
              <div className="flex items-center gap-2">
                <BellRing size={15} className="text-ink-muted" />
                <span className="text-sm text-ink-muted">{tr("today_quick_checkin")}</span>
              </div>
              <ChevronRight size={15} className="text-ink-faint" />
            </button>
          ) : (
            <div className="space-y-3">
              {canUseVoiceCheckin && defaultCheckinMode === "voice" ? (
                <VoiceCheckIn />
              ) : (
                <CheckInCard onSubmitted={() => setShowCheckin(false)} />
              )}

              <button
                onClick={() => setShowCheckin(false)}
                className="flex w-full items-center justify-center gap-1 text-xs text-ink-faint"
              >
                <X size={12} /> {tr("today_close_checkin")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. 动作执行器浮层 */}
      {runnerAction && (
        <ActionRunner
          actionId={runnerAction.id}
          label={runnerAction.label}
          description={runnerAction.description}
          onClose={() => setRunnerAction(null)}
        />
      )}

      {/* 家长代理签到 · 家长观察行为选择 → 映射三轴 */}
      {isParentProxy && <ParentCheckInCard />}

      {/* 家长引导卡 · 按当前阶段展示措施/话术/不要做/环境调整 */}
      {isParentProxy && <ParentGuidanceCard />}

      {/* 工具箱：补记过载低频出口 · 可折叠 */}
      {!isParentProxy && <Toolbox qwenEnabled={qwenEnabled} />}

      {/* 兴趣沉浸计时已移至理解页 · ASD 能量档案 */}

    </div>
  );

  function handleExecuteAction(actionId: string, label: string, description: string) {
    if (actionId === "low_sensory_toggle" || actionId === "low_sensory_mode") {
      handleModeSwitch("low_sensory");
      return;
    }
    if (actionId === "brown_noise") {
      setSoundScape("brown_noise", 0.3);
      pushToast("success", tr("today_sound_started"));
      return;
    }
    if (actionId === "pause_communication" || actionId === "resend_last" || actionId === "need_message" || actionId === "choose_trusted") {
      navigate("/connect");
      return;
    }
    if (actionId === "send_last_message") {
      navigate("/connect");
      return;
    }
    // 其他困难包动作：用 ActionRunner 给出明确的执行下一步
    setRunnerAction({ id: actionId, label, description });
  }
}

// ============ 困难类型图标映射 ============
function getDifficultyIcon(type: DifficultyType) {
  const icons: Record<DifficultyType, React.ReactNode> = {
    sensory: <Ear size={17} className="text-primary" />,
    change: <Shuffle size={17} className="text-clay" />,
    startup: <Zap size={17} className="text-sage" />,
    time: <Clock size={17} className="text-clay" />,
    communication: <MessageCircle size={17} className="text-primary" />,
  };
  return icons[type];
}

// ============ 阶段锚点配色 + 翻译 key ============
// 给 ASD 用户提供"我现在在哪里"的轻量视觉锚点
function getPhaseBadgeClass(phase: Phase): string {
  switch (phase) {
    case "stable": return "bg-sage-mist/60 text-sage";
    case "accumulating": return "bg-clay-mist/60 text-clay";
    case "warning": return "bg-warn-mist/60 text-warn";
    case "overload": return "bg-warn-mist/60 text-warn";
    case "recovery": return "bg-primary-mist/60 text-primary";
    default: return "bg-edge text-ink-muted";
  }
}

function getPhaseShortKey(phase: Phase): StringKey {
  switch (phase) {
    case "stable": return "phase_short_stable";
    case "accumulating": return "phase_short_accumulating";
    case "warning": return "phase_short_warning";
    case "overload": return "phase_short_overload";
    case "recovery": return "phase_short_recovery";
    default: return "phase_short_checkin";
  }
}
