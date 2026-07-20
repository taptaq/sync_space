import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Inbox, Mic, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";

// ADHD 焦点卡片 · 首屏单一焦点 + 本周状态重述
// 规则 1：以下一个动作开头；规则 5：每次重述状态；规则 9：列表最多 5 项（这里只 1 个焦点）
interface FocusState {
  priority: "capture" | "checkin" | "default";
  ctaKey: StringKey;
  ctaIcon: typeof Inbox;
  ctaPath?: string;
  ctaAction?: () => void;
}

export default function FocusBanner() {
  const navigate = useNavigate();
  const { tr } = useT();
  const captureItems = useStore((s) => s.captureItems);
  const checkins = useStore((s) => s.checkins);
  const executions = useStore((s) => s.executions);
  const personalRules = useStore((s) => s.personalRules);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(t);
  }, []);

  const inboxCount = captureItems.filter((i) => i.status === "inbox").length;

  // 本周数据统计（状态重述）
  const weekAgo = now - 7 * 86400000;
  const weekCheckins = checkins.filter((c) => new Date(c.checkin_at).getTime() > weekAgo).length;
  const weekExecutions = executions.filter((e) => new Date(e.executed_at).getTime() > weekAgo).length;

  // 今天的签到
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCheckin = checkins.find((c) => new Date(c.checkin_at).getTime() > todayStart.getTime());

  // 决定单一焦点（按优先级）
  let focus: FocusState;
  if (inboxCount > 0) {
    // 有未整理捕获 → 最优先
    focus = {
      priority: "capture",
      ctaKey: "adhd_focus_capture_cta" as StringKey,
      ctaIcon: Inbox,
      ctaPath: "/climate",
    };
  } else if (!todayCheckin) {
    // 今天没签到 → 签到焦点
    focus = {
      priority: "checkin",
      ctaKey: "adhd_focus_checkin_cta" as StringKey,
      ctaIcon: Mic,
    };
  } else {
    // 默认：观察当下
    focus = {
      priority: "default",
      ctaKey: "adhd_focus_default_cta" as StringKey,
      ctaIcon: Sparkles,
    };
  }

  const Icon = focus.ctaIcon;
  const titleKey = `adhd_focus_${focus.priority}_title` as StringKey;
  const bodyKey = `adhd_focus_${focus.priority}_body` as StringKey;
  const stateText = tr("adhd_focus_week_state", {
    checkins: weekCheckins,
    rules: personalRules.length,
    executions: weekExecutions,
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-primary/25 bg-primary-mist/20 p-4"
    >
      <p className="text-[11px] font-medium text-ink-faint">{stateText}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{tr(titleKey)}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{tr(bodyKey)}</p>
        </div>
        {focus.ctaPath && (
          <button
            type="button"
            onClick={() => navigate(focus.ctaPath!)}
            className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/25"
          >
            {tr(focus.ctaKey)} <ArrowRight size={12} />
          </button>
        )}
      </div>
    </motion.section>
  );
}
