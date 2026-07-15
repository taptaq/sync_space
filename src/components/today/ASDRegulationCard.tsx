import { useState } from "react";
import { ArrowLeft, Eye, MessageSquareOff, Route, VolumeX } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SUPPORTS = [
  {
    id: "sensory",
    labelKey: "asd_reg_support_sensory_label",
    icon: VolumeX,
    actionKey: "asd_reg_support_sensory_action",
    detailKey: "asd_reg_support_sensory_detail",
  },
  {
    id: "speech",
    labelKey: "asd_reg_support_speech_label",
    icon: MessageSquareOff,
    actionKey: "asd_reg_support_speech_action",
    detailKey: "asd_reg_support_speech_detail",
  },
  {
    id: "change",
    labelKey: "asd_reg_support_change_label",
    icon: Route,
    actionKey: "asd_reg_support_change_action",
    detailKey: "asd_reg_support_change_detail",
  },
] as const;

type SupportId = (typeof SUPPORTS)[number]["id"];

export default function ASDRegulationCard() {
  const lowSensoryMode = useStore((state) => state.lowSensoryMode);
  const setLowSensoryMode = useStore((state) => state.setLowSensoryMode);
  const [selected, setSelected] = useState<SupportId | null>(null);
  const { tr } = useT();
  const support = SUPPORTS.find((item) => item.id === selected);

  return (
    <section className="rounded-card border border-primary/20 bg-primary-mist/20 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-primary">{tr("asd_reg_subtitle")}</p>
          <h2 className="mt-1 font-serif text-xl text-ink">
            {support ? tr(support.actionKey) : tr("asd_reg_default_title")}
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
          <span>{lowSensoryMode ? tr("asd_reg_simplified") : tr("asd_reg_simplify")}</span>
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
          <p className="text-sm leading-relaxed text-ink">{tr(support.detailKey)}</p>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mt-4 flex min-h-11 items-center gap-2 text-sm text-primary"
          >
            <ArrowLeft size={16} /> {tr("asd_reg_change_need")}
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-2">
          {SUPPORTS.map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className="flex min-h-12 w-full items-center gap-3 rounded-lg border border-edge bg-white/60 px-4 text-left text-sm text-ink transition-colors hover:border-primary/30"
            >
              <Icon size={17} className="shrink-0 text-primary" />
              {tr(labelKey)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
