import { useMemo } from "react";
import { motion } from "framer-motion";
import type { CheckIn, CrashMark } from "@/types";
import { detectPhase } from "@/lib/stageEngine";
import { mixColors } from "@/lib/colorUtils";
import { useT } from "@/lib/i18n";

// 气候色谱（感知层 · 外化投射 · 一周的颜色记忆）
// 每天的签到颜色形成色谱带，一眼看出情绪走向

export default function ClimateChromatography({
  checkins,
  crashMarks,
}: {
  checkins: CheckIn[];
  crashMarks?: CrashMark[];
}) {
  const { tr } = useT();
  const weekColors = useMemo(() => {
    const now = new Date();
    const days: { date: string; color: string; phase: string }[] = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 86400_000);
      const dayStr = `${day.getMonth() + 1}/${day.getDate()}`;
      const dayCheckins = checkins.filter((c) => {
        const d = new Date(c.checkin_at);
        return d.toDateString() === day.toDateString();
      });

      if (dayCheckins.length > 0) {
        const last = dayCheckins[dayCheckins.length - 1];
        const phase = detectPhase(last.weather_snapshot.climate, crashMarks ?? []);
        days.push({
          date: dayStr,
          color: mixColors({
            sensory: last.axis_sensory,
            social: last.axis_social,
            predictability: last.axis_predictability,
          }),
          phase,
        });
      } else {
        days.push({ date: dayStr, color: "transparent", phase: "none" });
      }
    }
    return days;
  }, [checkins, crashMarks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
    >
      <p className="mb-3 text-xs uppercase tracking-widest text-primary">
        {tr("chromato_week_title")}
      </p>
      <div className="flex items-end gap-2">
        {weekColors.map((day, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            {day.color !== "transparent" ? (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                className="h-12 w-full origin-bottom rounded-lg shadow-sm"
                style={{ backgroundColor: day.color }}
              />
            ) : (
              <div className="flex h-12 w-full items-center justify-center rounded-lg border border-dashed border-edge/60">
                <span className="text-[9px] text-ink-faint">{tr("chromato_none")}</span>
              </div>
            )}
            <span className="text-[10px] text-ink-faint">{day.date}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-ink-faint">
        {tr("chromato_footnote")}
      </p>
    </motion.div>
  );
}
