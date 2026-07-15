import { useEffect, useState } from "react";
import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const START_SECONDS = 5 * 60;
const TASK_STORAGE_KEY = "syncspace-focus-first-step";

export default function FocusStartCard() {
  const [task, setTask] = useState(() => localStorage.getItem(TASK_STORAGE_KEY) ?? "");
  const [secondsLeft, setSecondsLeft] = useState(START_SECONDS);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const { tr } = useT();

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, secondsLeft]);

  useEffect(() => {
    if (task.trim()) localStorage.setItem(TASK_STORAGE_KEY, task);
    else localStorage.removeItem(TASK_STORAGE_KEY);
  }, [task]);

  const reset = () => {
    setSecondsLeft(START_SECONDS);
    setRunning(false);
    setDone(false);
  };

  const toggleTimer = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(START_SECONDS);
      setRunning(true);
      return;
    }
    setRunning((value) => !value);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <section className="rounded-card border border-sage/30 bg-sage-mist/30 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-sage">{tr("focus_title")}</p>
          <h2 className="mt-1 font-serif text-xl text-ink">{tr("focus_subtitle")}</h2>
        </div>
        <span className="shrink-0 font-mono text-lg text-ink" aria-live="polite">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>

      <label className="block text-xs text-ink-muted" htmlFor="first-step">
        {tr("focus_input_label")}
      </label>
      <input
        id="first-step"
        value={task}
        onChange={(event) => {
          setTask(event.target.value);
          setDone(false);
        }}
        placeholder={tr("focus_input_placeholder")}
        className="mt-1.5 w-full rounded-lg border border-edge bg-white/70 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-sage/50"
      />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!task.trim() || done}
          onClick={toggleTimer}
          className={cn(
            "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
            !task.trim() || done
              ? "bg-edge text-ink-faint"
              : "bg-sage text-white hover:bg-sage/90",
          )}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running
            ? tr("focus_pause")
            : secondsLeft === 0
              ? tr("focus_again")
              : secondsLeft < START_SECONDS
                ? tr("focus_continue")
                : tr("focus_start")}
        </button>
        <button
          type="button"
          onClick={() => {
            setDone(true);
            setRunning(false);
          }}
          disabled={!task.trim() || done}
          aria-label={tr("focus_mark_done")}
          title={tr("focus_mark_done")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-edge bg-white/70 text-sage disabled:text-ink-faint"
        >
          <Check size={18} />
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label={tr("focus_reset")}
          title={tr("focus_reset")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-edge bg-white/70 text-ink-muted"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <p className="mt-2 text-xs text-ink-muted" aria-live="polite">
        {done
          ? tr("focus_msg_done")
          : secondsLeft === 0
            ? tr("focus_msg_timeout")
            : tr("focus_msg_default")}
      </p>
      <p className="mt-1 text-[11px] text-ink-faint">{tr("focus_hint")}</p>
    </section>
  );
}
