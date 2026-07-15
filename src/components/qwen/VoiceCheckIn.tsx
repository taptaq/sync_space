import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Check, Sparkles, ChevronDown } from "lucide-react";
import type { AxisKey } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { getAxisProfile } from "@/lib/axisConfig";
import { voiceToCheckin, type VoiceCheckinResult } from "@/lib/qwenService";
import { useT } from "@/lib/i18n";

// 语音输入签到（Qwen ASR + 文本语义提取）
// 说话描述状态 → 转文字 → 提取三轴建议值 → 用户确认后签到
// 合规：只做语音转文字，不做声纹/语音情绪识别

type Status = "idle" | "recording" | "processing" | "result" | "done";

export default function VoiceCheckIn() {
  const { tr, tt } = useT();
  const addCheckIn = useStore((s) => s.addCheckIn);
  const neuroType = useStore((s) => s.neuroType);
  const pushToast = useStore((s) => s.pushToast);
  const axisProfile = getAxisProfile(neuroType);
  const [axis1, axis2, axis3] = axisProfile.axes;

  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<VoiceCheckinResult | null>(null);
  const [values, setValues] = useState<Record<AxisKey, number>>({
    sensory: 5,
    social: 5,
    predictability: 5,
  });
  const [showDetail, setShowDetail] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStartRecord = () => {
    setStatus("recording");
    // 模拟录音 3 秒后自动停止
    timerRef.current = setTimeout(() => {
      handleStopRecord();
    }, 3000);
  };

  const handleStopRecord = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("processing");
    try {
      const res = await voiceToCheckin(null);
      setResult(res);
      setValues(res.suggestedValues);
      setStatus("result");
      pushToast("success", tr("voice_checkin_recognized"));
    } catch {
      pushToast("error", tr("voice_checkin_recognize_failed"));
      setStatus("idle");
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("idle");
    setResult(null);
  };

  const handleSubmit = () => {
    addCheckIn(values.sensory, values.social, values.predictability, 0);
    setStatus("done");
    pushToast("success", tr("voice_checkin_recorded"));
    setTimeout(() => {
      setStatus("idle");
      setResult(null);
    }, 2500);
  };

  const adjustValue = (key: AxisKey, delta: number) => {
    setValues((v) => ({
      ...v,
      [key]: Math.max(0, Math.min(10, v[key] + delta)),
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-ink">{tr("voice_checkin_title")}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
            <Sparkles size={11} className="text-primary" />
            {tr("voice_checkin_subtitle")}
          </p>
        </div>
        <span className="rounded-full bg-primary-mist/60 px-2 py-0.5 text-[10px] text-primary">
          {tr("today_voice")}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-4"
          >
            <button
              onClick={handleStartRecord}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-glow transition-all duration-250 hover:bg-primary/90 active:scale-95"
              aria-label={tr("voice_checkin_start_record")}
            >
              <Mic size={28} />
            </button>
            <p className="mt-3 text-xs text-ink-muted">
              {tr("voice_checkin_tap_to_speak")}
            </p>
            <p className="mt-1 text-[11px] text-ink-faint">
              {tr("voice_checkin_speak_example")}
            </p>
          </motion.div>
        )}

        {status === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-4"
          >
            <div className="flex items-center gap-1.5 py-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.span
                  key={i}
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: "easeInOut",
                  }}
                  className="h-8 w-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-muted">{tr("voice_checkin_recording")}</p>
            <button
              onClick={handleStopRecord}
              className="mt-3 flex items-center gap-1.5 rounded-full bg-edge px-4 py-2 text-xs text-ink-muted transition-all duration-250 hover:bg-edge/80"
            >
              <MicOff size={14} /> {tr("voice_checkin_end_early")}
            </button>
          </motion.div>
        )}

        {status === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-6"
          >
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="mt-3 text-xs text-ink-muted">
              {tr("voice_checkin_processing")}
            </p>
          </motion.div>
        )}

        {status === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* 转写结果 */}
            <div className="rounded-xl bg-primary-mist/30 p-3">
              <p className="mb-1 text-[11px] text-primary">{tr("voice_checkin_you_said")}</p>
              <p className="text-small leading-relaxed text-ink">
                {result.transcript}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    result.confidence === "high"
                      ? "bg-sage-mist/60 text-sage"
                      : result.confidence === "mid"
                        ? "bg-clay-mist/60 text-clay"
                        : "bg-edge text-ink-muted",
                  )}
                >
                  {tr("voice_checkin_confidence")} {result.confidence === "high" ? tr("voice_checkin_conf_high") : result.confidence === "mid" ? tr("voice_checkin_conf_mid") : tr("voice_checkin_conf_low")}
                </span>
                <button
                  onClick={() => setShowDetail((v) => !v)}
                  className="flex items-center gap-0.5 text-[11px] text-ink-muted hover:text-ink"
                >
                  {tr("voice_checkin_adjust_values")}
                  <ChevronDown
                    size={11}
                    className={cn("transition-transform duration-250", showDetail && "rotate-180")}
                  />
                </button>
              </div>
            </div>

            {/* 三轴建议值 */}
            <div className="space-y-2.5">
              {([axis1, axis2, axis3] as const).map((axis) => (
                <div key={axis.key} className="flex items-center gap-3">
                  <span className={cn("w-16 shrink-0 text-xs", axis.color)}>
                    {tt(axis.label)}
                  </span>
                  <div className="relative h-2 flex-1 rounded-full bg-edge">
                    <div
                      className="absolute left-0 top-0 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${values[axis.key] * 10}%`,
                        backgroundColor: axis.stroke,
                      }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-center font-mono text-xs text-ink">
                    {values[axis.key].toFixed(0)}
                  </span>
                  {showDetail && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => adjustValue(axis.key, -1)}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-edge text-xs text-ink-muted hover:bg-edge/80"
                      >
                        −
                      </button>
                      <button
                        onClick={() => adjustValue(axis.key, 1)}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-edge text-xs text-ink-muted hover:bg-edge/80"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-full border border-edge py-2.5 text-small text-ink-muted transition-all duration-250 hover:bg-white/60"
              >
                {tr("voice_checkin_rerecord")}
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-full bg-primary py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
              >
                {tr("voice_checkin_confirm")}
              </button>
            </div>
          </motion.div>
        )}

        {status === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-6"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage text-white">
              <Check size={26} />
            </div>
            <p className="mt-3 text-small text-ink">{tr("voice_checkin_done")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
