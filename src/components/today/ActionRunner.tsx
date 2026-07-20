import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Timer, Pencil, Clock } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { ModalPortal } from "@/components/common/ModalPortal";

// 动作执行器：让困难包里的每个动作点击后都有明确的下一步
// 不是弹重型模态，而是覆盖一层简洁的执行面板

type ActionKind =
  | "micro_start" // 5 分钟倒计时
  | "paper_externalize" // 把脑子里的事写下来
  | "body_double" // body doubling 提示
  | "time_visualize" // 输入截止时间，显示剩余
  | "anchor_endpoint" // 输入任务 + 中止点
  | "now_only_x" // 现在只做 X
  | "next_2_hours" // 列出接下来 2 小时
  | "today_timeline" // 可视化今日时间线
  | "find_anchor" // 确认一个确定的事
  | "generic"; // 通用提示

interface ActionRunnerProps {
  actionId: string;
  label: string;
  description: string;
  onClose: () => void;
}

const ACTION_KIND_MAP: Record<string, ActionKind> = {
  micro_start: "micro_start",
  paper_externalize: "paper_externalize",
  body_double: "body_double",
  time_visualize: "time_visualize",
  anchor_endpoint: "anchor_endpoint",
  now_only_x: "now_only_x",
  next_2_hours: "next_2_hours",
  today_timeline: "today_timeline",
  find_anchor: "find_anchor",
};

export default function ActionRunner({ actionId, label, description, onClose }: ActionRunnerProps) {
  const { tr } = useT();
  const kind = ACTION_KIND_MAP[actionId] ?? "generic";
  const pushToast = useStore((s) => s.pushToast);
  const addCapture = useStore((s) => s.addCapture);
  // body_double / generic：直接显示提示
  if (kind === "body_double" || kind === "generic") {
    return (
      <Overlay onClose={onClose}>
        <Panel title={label} onClose={onClose}>
          <p className="text-sm leading-7 text-ink">{description}</p>
          {kind === "body_double" && (
            <div className="mt-4 rounded-lg bg-primary-mist/20 p-3 text-xs leading-5 text-ink-muted">
              {tr("action_body_double_tip")}
            </div>
          )}
          <ActionDoneButton onDone={() => { pushToast("success", tr("action_done")); onClose(); }} />
        </Panel>
      </Overlay>
    );
  }

  if (kind === "micro_start") {
    return (
      <Overlay onClose={onClose}>
        <MicroStartPanel label={label} description={description} onClose={onClose} />
      </Overlay>
    );
  }

  if (kind === "paper_externalize" || kind === "now_only_x" || kind === "find_anchor") {
    return (
      <Overlay onClose={onClose}>
        <TextInputPanel
          label={label}
          description={description}
          placeholder={tr(`action_placeholder_${kind}`)}
          onSave={(text) => {
            addCapture(text);
            pushToast("success", tr("action_saved_to_inbox"));
            onClose();
          }}
          onClose={onClose}
        />
      </Overlay>
    );
  }

  if (kind === "time_visualize" || kind === "anchor_endpoint") {
    return (
      <Overlay onClose={onClose}>
        <DeadlinePanel kind={kind} label={label} description={description} onClose={onClose} />
      </Overlay>
    );
  }

  if (kind === "next_2_hours" || kind === "today_timeline") {
    return (
      <Overlay onClose={onClose}>
        <TextInputPanel
          label={label}
          description={description}
          placeholder={tr(`action_placeholder_${kind}`)}
          onSave={(text) => {
            addCapture(text);
            pushToast("success", tr("action_saved_to_inbox"));
            onClose();
          }}
          onClose={onClose}
          multiline
        />
      </Overlay>
    );
  }

  return null;
}

// ============ 通用结构 ============
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      >
        {children}
      </motion.div>
    </ModalPortal>
  );
}

function Panel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { tr } = useT();
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-md rounded-t-2xl border-t border-white/30 bg-base/95 p-5 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg text-ink">{title}</h3>
        <button
          onClick={onClose}
          aria-label={tr("close")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-ink-muted"
        >
          <X size={16} />
        </button>
      </div>
      {children}
    </motion.div>
  );
}

function ActionDoneButton({ onDone }: { onDone: () => void }) {
  const { tr } = useT();
  return (
    <button
      type="button"
      onClick={onDone}
      className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-sage text-sm text-white"
    >
      <Check size={16} /> {tr("action_done")}
    </button>
  );
}

// ============ 5 分钟倒计时面板 ============
function MicroStartPanel({ label, description, onClose }: { label: string; description: string; onClose: () => void }) {
  const { tr } = useT();
  const addCapture = useStore((s) => s.addCapture);
  const pushToast = useStore((s) => s.pushToast);
  const [seconds, setSeconds] = useState(300);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 防止 React StrictMode 双调用导致重复落盘
  const loggedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = () => {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setFinished(true);
          setRunning(false);
          // 落盘：完成一次微启动即产生效果数据（收件箱 → 规则形成线）
          if (!loggedRef.current) {
            loggedRef.current = true;
            addCapture(tr("action_micro_start_logged"));
            pushToast("success", tr("action_micro_start_logged"));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <Panel title={label} onClose={onClose}>
      <p className="text-sm leading-7 text-ink-muted">{description}</p>
      <div className="my-6 flex flex-col items-center">
        <div className={cn("font-serif text-5xl tabular-nums text-ink", running && "text-primary")}>
          {fmt(seconds)}
        </div>
        <p className="mt-2 text-xs text-ink-muted">{finished ? tr("action_timer_finished") : running ? tr("action_timer_running") : tr("action_timer_ready")}</p>
      </div>
      {!finished && (
        <button
          type="button"
          onClick={running ? stop : start}
          className={cn(
            "flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-sm",
            running ? "border border-edge bg-white/55 text-ink-muted" : "bg-sage text-white"
          )}
        >
          {running ? <X size={16} /> : <Timer size={16} />}
          {running ? tr("action_timer_stop") : tr("action_timer_start")}
        </button>
      )}
      {finished && (
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-sage text-sm text-white"
        >
          <Check size={16} /> {tr("action_done")}
        </button>
      )}
    </Panel>
  );
}

// ============ 文本输入面板 ============
function TextInputPanel({
  label,
  description,
  placeholder,
  onSave,
  onClose,
  multiline,
}: {
  label: string;
  description: string;
  placeholder: string;
  onSave: (text: string) => void;
  onClose: () => void;
  multiline?: boolean;
}) {
  const { tr } = useT();
  const [text, setText] = useState("");

  return (
    <Panel title={label} onClose={onClose}>
      <p className="text-sm leading-7 text-ink-muted">{description}</p>
      {multiline ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="mt-4 w-full rounded-lg border border-edge bg-white/70 p-3 text-sm text-ink placeholder:text-ink-faint"
        />
      ) : (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="mt-4 min-h-11 w-full rounded-lg border border-edge bg-white/70 px-3 text-sm text-ink placeholder:text-ink-faint"
        />
      )}
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => onSave(text.trim())}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-sage text-sm text-white disabled:opacity-40"
      >
        <Pencil size={16} /> {tr("action_save")}
      </button>
    </Panel>
  );
}

// ============ 截止时间面板 ============
function DeadlinePanel({
  kind,
  label,
  description,
  onClose,
}: {
  kind: "time_visualize" | "anchor_endpoint";
  label: string;
  description: string;
  onClose: () => void;
}) {
  const { tr } = useT();
  const [deadline, setDeadline] = useState("");
  const [task, setTask] = useState("");
  const [showResult, setShowResult] = useState(false);

  const calcRemaining = () => {
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) return null;
    const diff = d.getTime() - Date.now();
    if (diff <= 0) return tr("action_deadline_passed");
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return tr("action_deadline_remaining_hm", { h: hours, m: minutes });
    return tr("action_deadline_remaining_m", { m: minutes });
  };

  return (
    <Panel title={label} onClose={onClose}>
      <p className="text-sm leading-7 text-ink-muted">{description}</p>

      {kind === "anchor_endpoint" && (
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder={tr("action_placeholder_anchor_task")}
          className="mt-4 min-h-11 w-full rounded-lg border border-edge bg-white/70 px-3 text-sm text-ink placeholder:text-ink-faint"
        />
      )}

      <div className="mt-3 flex items-center gap-2">
        <Clock size={16} className="text-ink-muted" />
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => { setDeadline(e.target.value); setShowResult(false); }}
          className="min-h-11 flex-1 rounded-lg border border-edge bg-white/70 px-3 text-sm text-ink"
        />
      </div>

      <button
        type="button"
        disabled={!deadline}
        onClick={() => setShowResult(true)}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-sage text-sm text-white disabled:opacity-40"
      >
        {tr("action_calc_remaining")}
      </button>

      {showResult && (
        <div className="mt-4 rounded-card bg-primary-mist/25 p-4 text-center">
          <p className="text-xs text-ink-muted">{tr("action_remaining_label")}</p>
          <p className="mt-1 font-serif text-2xl text-primary">{calcRemaining()}</p>
          {kind === "anchor_endpoint" && task && (
            <p className="mt-2 text-xs text-ink-muted">{tr("action_anchor_stop_at", { task })}</p>
          )}
        </div>
      )}
    </Panel>
  );
}
