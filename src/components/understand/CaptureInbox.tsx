import { ArrowRight, Check, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

export default function CaptureInbox() {
  const navigate = useNavigate();
  const { tr } = useT();
  const items = useStore((state) => state.captureItems);
  const focusCapture = useStore((state) => state.focusCapture);
  const completeCapture = useStore((state) => state.completeCapture);
  const seedRule = useStore((state) => state.seedRuleFromCapture);
  const inbox = items.filter((item) => item.status === "inbox");
  const item = inbox[0];

  if (!item) return null;

  return (
    <section className="rounded-card border border-edge bg-white/55 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-primary">{tr("inbox_title")}</p>
        <span className="text-xs text-ink-faint">{tr("inbox_remaining", { count: inbox.length })}</span>
      </div>
      <p className="mt-3 text-base leading-relaxed text-ink">{item.text}</p>
      <p className="mt-3 text-xs text-ink-muted">{tr("inbox_prompt")}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={() => { focusCapture(item.id); navigate("/today"); }} className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm text-white">
          {tr("inbox_next")} <ArrowRight size={15} />
        </button>
        <button type="button" onClick={() => seedRule(item.id)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-primary/20 px-3 text-sm text-primary">
          <Lightbulb size={15} /> {tr("inbox_to_understanding")}
        </button>
        <button type="button" onClick={() => completeCapture(item.id)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm text-ink-muted">
          <Check size={15} /> {tr("inbox_done")}
        </button>
      </div>
    </section>
  );
}
