import { motion } from "framer-motion";
import { Volume2, VolumeX, Music } from "lucide-react";
import type { Phase } from "@/types";
import { useStore } from "@/store/useStore";
import { detectPhase } from "@/lib/stageEngine";
import { soundScape, SOUND_OPTIONS, getPhaseSound } from "@/lib/soundEngine";
import { cn } from "@/lib/utils";

type ActionTone = "calm" | "gentle-urgent" | "urgent" | "recovery";

interface PhaseAction {
  label: string;
  subline: string;
  tone: ActionTone;
}

function getAction(phase: Phase, neuroType: string): PhaseAction {
  switch (phase) {
    case "stable":
      return neuroType === "adhd"
        ? { label: "现在先选一件事", subline: "只写下第一步，不规划全部", tone: "calm" }
        : { label: "保持现在的节奏", subline: "不需要额外增加安排", tone: "calm" };
    case "accumulating":
      return neuroType === "adhd"
        ? { label: "离开任务 5 分钟", subline: "喝水或走动，只做一种重置", tone: "gentle-urgent" }
        : { label: "先减少一个刺激", subline: "声音、光线或人群，只选一个", tone: "gentle-urgent" };
    case "warning":
      return neuroType === "adhd"
        ? { label: "停止增加新任务", subline: "保留眼前这一件，其他先记下", tone: "urgent" }
        : { label: "退出当前刺激", subline: "少说话，去更安静和确定的地方", tone: "urgent" };
    case "overload":
      return neuroType === "adhd"
        ? { label: "停下来，不做任何决定", subline: "多巴胺见底了，此刻不做就是最好的做", tone: "urgent" }
        : neuroType === "asd"
          ? { label: "现在不用做决定", subline: "先保证安全，停止一切感官输入", tone: "urgent" }
          : { label: "现在不用做决定", subline: "先保证安全，停止输入和要求", tone: "urgent" };
    case "recovery":
      return { label: "先恢复身体", subline: "喝水、进食或躺下，只选一个", tone: "recovery" };
  }
}

const TONE_STYLES: Record<ActionTone, string> = {
  calm: "border-sage/30 bg-sage-mist/40 text-sage",
  "gentle-urgent": "border-clay/30 bg-clay-mist/40 text-clay",
  urgent: "border-warn/30 bg-warn-mist/40 text-warn",
  recovery: "border-primary/30 bg-primary-mist/40 text-primary",
};

export default function PhaseActionCard() {
  const neuroType = useStore((state) => state.neuroType);
  const crashMarks = useStore((state) => state.crashMarks);
  const currentWeather = useStore((state) => state.currentWeather);
  const soundScapeVolume = useStore((s) => s.soundScapeVolume);
  const soundScapeType = useStore((s) => s.soundScapeType);
  const soundScapeEnabled = useStore((s) => s.soundScapeEnabled);
  const setSoundScape = useStore((s) => s.setSoundScape);
  const stopSoundScape = useStore((s) => s.stopSoundScape);
  const pushToast = useStore((s) => s.pushToast);

  const phase = detectPhase(currentWeather.climate, crashMarks);
  const action = getAction(phase, neuroType);
  const phaseSound = getPhaseSound(phase, neuroType);

  const recommendedLabel = phaseSound
    ? SOUND_OPTIONS.find((o) => o.type === phaseSound.sound)?.label
    : null;

  const isRecommendedPlaying =
    !!phaseSound &&
    phaseSound.sound !== "silence" &&
    soundScapeEnabled &&
    soundScapeType === phaseSound.sound;

  const handleToggleRecommend = () => {
    if (!phaseSound || phaseSound.sound === "silence") return;
    if (isRecommendedPlaying) {
      soundScape.stop();
      stopSoundScape();
    } else {
      soundScape.play(phaseSound.sound, soundScapeVolume);
      setSoundScape(phaseSound.sound);
      pushToast("info", "正在播放：" + (recommendedLabel ?? ""));
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn("glass-card rounded-card border px-5 py-4", TONE_STYLES[action.tone])}
    >
      <p className="text-xs text-ink-muted">现在只做这一步</p>
      <p className="mt-1 text-base font-medium">{action.label}</p>
      <p className="mt-1 text-xs text-ink-muted">{action.subline}</p>

      {phaseSound && recommendedLabel && (
        <div className="mt-3 border-t border-current/15 pt-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/60 text-current">
              {phaseSound.sound === "silence" ? (
                <VolumeX size={13} />
              ) : isRecommendedPlaying ? (
                <Volume2 size={13} className="animate-pulse-slow" />
              ) : (
                <Music size={13} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium leading-tight">
                {phaseSound.sound === "silence"
                  ? "此刻建议：静音"
                  : isRecommendedPlaying
                    ? "正在播放 · " + recommendedLabel
                    : "试试 · " + recommendedLabel}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-ink-muted">
                {phaseSound.reason}
              </p>
            </div>
            {phaseSound.sound !== "silence" && (
              <button
                onClick={handleToggleRecommend}
                className={cn(
                  "flex h-7 items-center gap-1 rounded-full px-3 text-[11px] font-medium transition-all duration-250",
                  isRecommendedPlaying
                    ? "bg-white/70 text-ink-muted hover:bg-white/90"
                    : "bg-primary text-white hover:bg-primary-soft",
                )}
                aria-label={isRecommendedPlaying ? "停止音景" : "播放推荐音景"}
              >
                {isRecommendedPlaying ? "停止" : "播放"}
              </button>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}
