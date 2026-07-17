import { useEffect, useMemo, useState } from "react";
import { Check, CornerDownLeft, Inbox, RotateCcw, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

const FOCUS_SECONDS = 10 * 60;

export default function QuickCapture() {
  const navigate = useNavigate();
  const items = useStore((state) => state.captureItems);
  const addCapture = useStore((state) => state.addCapture);
  const startTimer = useStore((state) => state.startCaptureTimer);
  const complete = useStore((state) => state.completeCapture);
  const returnToInbox = useStore((state) => state.returnCaptureToInbox);
  const pushToast = useStore((state) => state.pushToast);
  const [text, setText] = useState("");
  const [now, setNow] = useState(Date.now());
  const { tr } = useT();

  const focusItem = items.find((item) => item.status === "focus");
  const inboxCount = items.filter((item) => item.status === "inbox").length;
  const remaining = useMemo(() => {
    if (!focusItem?.focus_started_at) return null;
    const elapsed = Math.floor((now - new Date(focusItem.focus_started_at).getTime()) / 1000);
    return Math.max(0, FOCUS_SECONDS - elapsed);
  }, [focusItem?.focus_started_at, now]);

  useEffect(() => {
    if (!focusItem?.focus_started_at) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [focusItem?.focus_started_at]);

  const submit = () => {
    if (!text.trim()) return;
    addCapture(text);
    setText("");
  };

  if (focusItem) {
    const minutes = remaining === null ? null : Math.floor(remaining / 60);
    const seconds = remaining === null ? null : remaining % 60;
    return (
      <section data-tour-id="quick-capture" className="rounded-card border border-primary/20 bg-white/55 p-5">
        <p className="text-xs font-medium text-primary">{tr("quick_capture_focus_label")}</p>
        <p className="mt-2 text-base font-medium leading-relaxed text-ink">{focusItem.text}</p>
        <p className="mt-1 text-xs text-ink-muted">{tr("quick_capture_focus_hint")}</p>
        {remaining !== null && (
          <p className="mt-3 font-mono text-2xl text-ink" aria-live="polite">
            {remaining > 0
              ? `${minutes}:${String(seconds).padStart(2, "0")}`
              : tr("quick_capture_time_up")}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {remaining === null && (
            <button type="button" onClick={() => startTimer(focusItem.id)} className="flex min-h-11 items-center gap-1.5 rounded-full border border-primary/25 px-4 text-sm text-primary">
              <Timer size={15} /> {tr("quick_capture_timer_option")}
            </button>
          )}
          <button type="button" onClick={() => { complete(focusItem.id); pushToast("success", tr("quick_capture_complete_toast")); }} className="flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm text-white">
            <Check size={15} /> {tr("quick_capture_complete")}
          </button>
          <button type="button" onClick={() => { returnToInbox(focusItem.id); pushToast("info", tr("quick_capture_return_toast")); }} className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-ink-muted">
            <RotateCcw size={14} /> {tr("quick_capture_return")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section data-tour-id="quick-capture" className="rounded-card border border-edge bg-white/45 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">{tr("quick_capture_inbox_title")}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{tr("quick_capture_inbox_desc")}</p>
        </div>
        {inboxCount > 0 && (
          <button type="button" onClick={() => navigate("/climate")} className="flex min-h-10 items-center gap-1.5 text-xs text-primary">
            <Inbox size={14} /> {tr("quick_capture_inbox_count", { inboxCount })}
          </button>
        )}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={tr("quick_capture_input_placeholder")}
          aria-label={tr("quick_capture_input_aria")}
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-edge bg-white/75 px-3 text-sm text-ink placeholder:text-ink-faint focus:border-primary/40"
        />
        <button type="submit" disabled={!text.trim()} aria-label={tr("quick_capture_submit_aria")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white disabled:bg-edge disabled:text-ink-faint">
          <CornerDownLeft size={17} />
        </button>
      </form>
    </section>
  );
}
