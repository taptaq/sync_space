import { Sunrise } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { getTomorrowForecast } from "@/lib/tomorrowForecast";
import type { StringKey } from "@/lib/translations";

// 明日预告 · ASD 友好：基于历史同星期几签到给明日预告，安抚"不知道接下来会怎样"的焦虑
export default function TomorrowPreview() {
  const checkins = useStore((s) => s.checkins);
  const { tr } = useT();

  const forecast = getTomorrowForecast(checkins);

  // 数据不足（<3 同星期几签到）时不显示组件
  if (!forecast) return null;

  return (
    <section data-tour-id="tomorrow-preview" className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-mist/50 text-sage">
          <Sunrise size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary">
            {tr("tomorrow_preview_title" as StringKey)}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-faint">
            {tr("tomorrow_preview_desc" as StringKey)}
          </p>
          <p className="mt-2 font-serif text-sm leading-relaxed text-ink">
            {forecast.summary}
          </p>
        </div>
      </div>
    </section>
  );
}
