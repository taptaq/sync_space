import { motion } from "framer-motion";
import { Volume2, VolumeX, Music } from "lucide-react";
import type { Phase } from "@/types";
import { useStore } from "@/store/useStore";
import { detectPhase } from "@/lib/stageEngine";
import { soundScape, SOUND_OPTIONS, getPhaseSound } from "@/lib/soundEngine";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";
import { cn } from "@/lib/utils";

type ActionTone = "calm" | "gentle-urgent" | "urgent" | "recovery";

interface PhaseAction {
  label: string;
  subline: string;
  tone: ActionTone;
}

function getAction(
  phase: Phase,
  neuroType: string,
  tr: (key: StringKey) => string,
): PhaseAction {
  const typeKey = neuroType === "adhd" ? "adhd" : neuroType === "asd" ? "asd" : "other";
  const labelKey = `phase_action_${phase}_${typeKey}_label` as StringKey;
  const sublineKey = `phase_action_${phase}_${typeKey}_subline` as StringKey;

  switch (phase) {
    case "stable":
      return {
        label: tr(labelKey),
        subline: tr(sublineKey),
        tone: "calm",
      };
    case "accumulating":
      return {
        label: tr(labelKey),
        subline: tr(sublineKey),
        tone: "gentle-urgent",
      };
    case "warning":
      return {
        label: tr(labelKey),
        subline: tr(sublineKey),
        tone: "urgent",
      };
    case "overload":
      return {
        label: tr(labelKey),
        subline: tr(sublineKey),
        tone: "urgent",
      };
    case "recovery":
      return {
        label: tr(`phase_action_recovery_label` as StringKey),
        subline: tr(`phase_action_recovery_subline` as StringKey),
        tone: "recovery",
      };
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
  const { tr } = useT();

  const phase = detectPhase(currentWeather.climate, crashMarks);
  const action = getAction(phase, neuroType, tr);
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
      <p className="text-xs text-ink-muted">{tr("phase_action_hint")}</p>
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
                  ? tr("phase_action_silence")
                  : isRecommendedPlaying
                    ? tr("phase_action_playing") + recommendedLabel
                    : tr("phase_action_try") + recommendedLabel}
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
                aria-label={isRecommendedPlaying ? tr("phase_action_stop") : tr("phase_action_play")}
              >
                {isRecommendedPlaying ? tr("phase_action_stop") : tr("phase_action_play")}
              </button>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}
