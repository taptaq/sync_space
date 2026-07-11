import { useState } from "react";
import { ArrowLeft, Eye, MessageSquareOff, Route, VolumeX } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

const SUPPORTS = [
  {
    id: "sensory",
    label: "刺激太多",
    icon: VolumeX,
    action: "先减少一个刺激",
    detail: "戴上耳机、调暗屏幕，或离开人群。只选一个就够了。",
  },
  {
    id: "speech",
    label: "现在不想说话",
    icon: MessageSquareOff,
    action: "可以暂时不解释",
    detail: "需要时给别人看：我现在需要少说话，等恢复后再回应。",
  },
  {
    id: "change",
    label: "变化让我不安",
    icon: Route,
    action: "只确认下一步",
    detail: "先弄清接下来会发生什么、在哪里、和谁一起。其余稍后再看。",
  },
] as const;

type SupportId = (typeof SUPPORTS)[number]["id"];

export default function ASDRegulationCard() {
  const lowSensoryMode = useStore((state) => state.lowSensoryMode);
  const setLowSensoryMode = useStore((state) => state.setLowSensoryMode);
  const [selected, setSelected] = useState<SupportId | null>(null);
  const support = SUPPORTS.find((item) => item.id === selected);

  return (
    <section className="rounded-card border border-primary/20 bg-primary-mist/20 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-primary">此刻需要什么</p>
          <h2 className="mt-1 font-serif text-xl text-ink">
            {support ? support.action : "不需要先说清感受"}
          </h2>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={lowSensoryMode}
          onClick={() => setLowSensoryMode(!lowSensoryMode)}
          className="flex shrink-0 items-center gap-1.5 text-xs text-ink-muted"
        >
          <Eye size={14} />
          <span>{lowSensoryMode ? "已简化" : "简化页面"}</span>
          <span
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              lowSensoryMode ? "bg-primary" : "bg-edge",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                lowSensoryMode ? "translate-x-[18px]" : "translate-x-0.5",
              )}
            />
          </span>
        </button>
      </div>

      {support ? (
        <div className="mt-4">
          <p className="text-sm leading-relaxed text-ink">{support.detail}</p>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mt-4 flex min-h-11 items-center gap-2 text-sm text-primary"
          >
            <ArrowLeft size={16} /> 换一个需要
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-2">
          {SUPPORTS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className="flex min-h-12 w-full items-center gap-3 rounded-lg border border-edge bg-white/60 px-4 text-left text-sm text-ink transition-colors hover:border-primary/30"
            >
              <Icon size={17} className="shrink-0 text-primary" />
              {label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
