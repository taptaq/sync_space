import { motion } from "framer-motion";
import type { Phase } from "@/types";
import { useStore } from "@/store/useStore";
import { detectPhase } from "@/lib/stageEngine";
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
  const phase = detectPhase(currentWeather.climate, crashMarks);
  const action = getAction(phase, neuroType);

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
    </motion.section>
  );
}
