import { Watch, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

export default function WearableSignalPrompt() {
  const signal = useStore((state) => state.pendingWearableSignal);
  const confirmSignal = useStore((state) => state.confirmWearableSignal);
  const setPendingSignal = useStore((state) => state.setPendingWearableSignal);
  const { tr } = useT();

  if (!signal) return null;

  return (
    <section className="rounded-card border border-primary/20 bg-primary-mist/20 p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/65 text-primary">
          <Watch size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{tr("wearable_signal_title")}</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">{signal.summary}</p>
        </div>
        <button
          type="button"
          onClick={() => setPendingSignal(null)}
          aria-label={tr("wearable_signal_later")}
          className="flex h-9 w-9 items-center justify-center text-ink-muted"
        >
          <X size={16} />
        </button>
      </div>

      <p className="mt-4 text-sm text-ink">{tr("wearable_signal_question")}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => confirmSignal("relevant")}
          className="min-h-11 rounded-full bg-primary px-3 text-sm text-white"
        >
          {tr("wearable_signal_relevant")}
        </button>
        <button
          type="button"
          onClick={() => confirmSignal("not_relevant")}
          className="min-h-11 rounded-full border border-edge bg-white/60 px-3 text-sm text-ink-muted"
        >
          {tr("wearable_signal_not_relevant")}
        </button>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-ink-faint">{tr("wearable_signal_note")}</p>
    </section>
  );
}
