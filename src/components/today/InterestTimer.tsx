import { useEffect, useRef, useState } from "react";
import { Heart, Pause, Play, Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MAX_SECONDS = 2 * 60 * 60; // 最多 2 小时
const STORAGE_KEY = "syncspace-interest-active";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type ActiveState = {
  topic: string;
  elapsedSec: number;
  running: boolean;
  lastActiveAt: string | null;
};

const formatHMS = (totalSec: number): string => {
  const s = Math.max(0, Math.min(MAX_SECONDS, Math.floor(totalSec)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => v.toString().padStart(2, "0")).join(":");
};

const loadActive = (): ActiveState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { topic: "", elapsedSec: 0, running: false, lastActiveAt: null };
    const parsed = JSON.parse(raw) as Partial<ActiveState>;
    return {
      topic: typeof parsed.topic === "string" ? parsed.topic : "",
      elapsedSec:
        Number.isFinite(parsed.elapsedSec) && (parsed.elapsedSec ?? 0) >= 0
          ? Math.floor(parsed.elapsedSec as number)
          : 0,
      running: Boolean(parsed.running),
      lastActiveAt: typeof parsed.lastActiveAt === "string" ? parsed.lastActiveAt : null,
    };
  } catch {
    return { topic: "", elapsedSec: 0, running: false, lastActiveAt: null };
  }
};

export default function InterestTimer() {
  const interestSessions = useStore((state) => state.interestSessions);
  const addInterestSession = useStore((state) => state.addInterestSession);
  const { tr } = useT();

  const [initial] = useState(loadActive);
  const [topic, setTopic] = useState(initial.topic);
  const [elapsedSec, setElapsedSec] = useState(initial.elapsedSec);
  const [running, setRunning] = useState(
    initial.running && initial.elapsedSec < MAX_SECONDS,
  );
  const lastActiveRef = useRef<string | null>(initial.lastActiveAt);

  // 恢复时若正在计时，按 lastActiveAt 补回离线期间的秒数
  useEffect(() => {
    if (!running) return;
    const last = lastActiveRef.current;
    if (last) {
      const diffMs = Date.now() - new Date(last).getTime();
      if (diffMs > 0) {
        const addSec = Math.floor(diffMs / 1000);
        setElapsedSec((prev) => Math.min(MAX_SECONDS, prev + addSec));
      }
    }
    lastActiveRef.current = new Date().toISOString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 计时
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 1;
        if (next >= MAX_SECONDS) {
          setRunning(false);
          lastActiveRef.current = null;
          return MAX_SECONDS;
        }
        lastActiveRef.current = new Date().toISOString();
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // 持久化当前状态
  useEffect(() => {
    const payload: ActiveState = {
      topic,
      elapsedSec,
      running,
      lastActiveAt: running ? (lastActiveRef.current ?? new Date().toISOString()) : null,
    };
    if (!topic && !running && elapsedSec === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  }, [topic, elapsedSec, running]);

  const weekTotalSec = interestSessions.reduce((sum, session) => {
    const startedAt = new Date(session.started_at).getTime();
    if (!Number.isFinite(startedAt)) return sum;
    if (Date.now() - startedAt > WEEK_MS) return sum;
    return sum + Math.max(0, Math.floor(session.duration_sec));
  }, 0);

  const atMax = elapsedSec >= MAX_SECONDS;
  const canStart = Boolean(topic.trim()) && !atMax;
  const canDone = Boolean(topic.trim()) || elapsedSec > 0;

  const handleStart = () => {
    if (!canStart) return;
    lastActiveRef.current = new Date().toISOString();
    setRunning(true);
  };

  const handlePause = () => {
    setRunning(false);
    lastActiveRef.current = null;
  };

  const handleDone = () => {
    const trimmed = topic.trim();
    if (trimmed && elapsedSec > 0) {
      addInterestSession(trimmed, Math.min(MAX_SECONDS, elapsedSec));
    }
    setRunning(false);
    lastActiveRef.current = null;
    setTopic("");
    setElapsedSec(0);
  };

  return (
    <section className="rounded-card border border-clay/30 bg-clay-mist/20 p-5 shadow-soft">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-clay">
            <Sparkles size={14} />
            {tr("interest_timer_title")}
          </p>
          <h2 className="mt-1 font-serif text-xl text-ink">{tr("interest_timer_subtitle")}</h2>
        </div>
        <span
          className="shrink-0 font-mono text-2xl text-ink tabular-nums"
          aria-live="polite"
        >
          {formatHMS(elapsedSec)}
        </span>
      </div>

      <input
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
        placeholder={tr("interest_timer_topic_placeholder")}
        className="mt-1 w-full rounded-lg border border-edge bg-white/70 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-clay/50"
      />

      <div className="mt-3 flex gap-2">
        {running ? (
          <button
            type="button"
            onClick={handlePause}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-edge bg-white/70 px-4 text-sm font-medium text-ink-muted transition-colors hover:bg-white"
          >
            <Pause size={16} />
            {tr("interest_timer_pause")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
              !canStart ? "bg-edge text-ink-faint" : "bg-clay text-white hover:bg-clay/90",
            )}
          >
            <Play size={16} />
            {tr("interest_timer_start")}
          </button>
        )}
        <button
          type="button"
          onClick={handleDone}
          disabled={!canDone}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-sage/40 bg-sage-mist/40 px-4 text-sm font-medium text-sage transition-colors hover:bg-sage-mist/60 disabled:text-ink-faint"
        >
          <Heart size={16} />
          {tr("interest_timer_done")}
        </button>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
        <Heart size={12} className="shrink-0 text-sage" />
        <span>
          {tr("interest_timer_week_total")} {formatHMS(weekTotalSec)}
        </span>
      </p>
    </section>
  );
}
