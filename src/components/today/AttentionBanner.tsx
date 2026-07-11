import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, TrendingUp, AlertTriangle, Clock, Heart } from "lucide-react";
import { useStore } from "@/store/useStore";
import { analyzeTrend } from "@/lib/trendAlert";
import { cn } from "@/lib/utils";
import { isToday } from "@/lib/format";

// 今日关注横幅（PRD §01：在过载前而非过载后被推一把）
// 三类主动反馈：签到提醒 / 趋势预警 / 待处理事项
// 只在有内容时出现，放在天气卡和签到卡之间

interface AttentionItem {
  id: string;
  type: "checkin" | "trend" | "pending";
  level: "hint" | "warning";
  icon: typeof Bell;
  message: string;
  action?: { label: string; to: string };
}

export default function AttentionBanner() {
  const navigate = useNavigate();
  const checkinTimes = useStore((s) => s.checkinTimes);
  const checkins = useStore((s) => s.checkins);
  const neuroType = useStore((s) => s.neuroType);
  const crashMarks = useStore((s) => s.crashMarks);
  const observation = useStore((s) => s.observation);

  const items = useMemo<AttentionItem[]>(() => {
    const list: AttentionItem[] = [];

    // 1. 签到提醒：到点未签到（行动导向，非羞耻导向）
    const todayCheckins = checkins.filter((c) => isToday(c.checkin_at));
    if (todayCheckins.length === 0) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const slots = [
        { time: checkinTimes.morning, label: "早上" },
        { time: checkinTimes.noon, label: "中午" },
        { time: checkinTimes.evening, label: "晚上" },
      ];
      for (const slot of slots) {
        const [h, m] = slot.time.split(":").map(Number);
        const slotMinutes = h * 60 + m;
        if (currentMinutes >= slotMinutes && currentMinutes < slotMinutes + 180) {
          list.push({
            id: "checkin",
            type: "checkin",
            level: "hint",
            icon: Bell,
            message: `${slot.label}好 · 15 秒签到，帮你看到现在的状态`,
          });
          break;
        }
      }
    }

    // 2. 趋势预警：最近签到 strain 持续上升
    const trend = analyzeTrend(checkins, neuroType);
    if (trend) {
      list.push({
        id: "trend",
        type: "trend",
        level: trend.level,
        icon: trend.level === "warning" ? AlertTriangle : TrendingUp,
        message: trend.message,
        action: { label: "查看协议", to: "/climate" },
      });
    }

    // 3. 待处理事项（措辞非病理化：过载回溯而非崩溃）
    // 3a. 未复盘的过载事件
    const unreviewedCrashes = crashMarks.filter((c) => !c.reviewed);
    if (unreviewedCrashes.length > 0) {
      list.push({
        id: "crash",
        type: "pending",
        level: "hint",
        icon: Clock,
        message: `有 ${unreviewedCrashes.length} 次过载记录还没整理，随时可以回来看看`,
        action: { label: "去看看", to: "/review" },
      });
    }

    // 3b. 新 AI 观察
    if (observation && observation.status === "pending") {
      list.push({
        id: "observation",
        type: "pending",
        level: "hint",
        icon: Heart,
        message: "秘书注意到一个你可能关心的规律",
        action: { label: "看看", to: "/climate" },
      });
    }

    // 横幅数量上限 2 条（ADHD 通知疲劳是卸载主因 · 超过 2 条会触发"啥都紧急啥都不干"的瘫痪）
    return list.slice(0, 2);
  }, [checkinTimes, checkins, neuroType, crashMarks, observation]);

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-2"
        >
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex items-center gap-3 rounded-card border p-3.5",
                item.level === "warning"
                  ? "border-warn/40 bg-warn/5"
                  : "border-primary/20 bg-primary-mist/20",
              )}
            >
              <item.icon
                size={18}
                className={cn(
                  "shrink-0",
                  item.level === "warning" ? "text-warn" : "text-primary",
                )}
              />
              <p className="flex-1 text-small leading-relaxed text-ink">
                {item.message}
              </p>
              {item.action && (
                <button
                  onClick={() => navigate(item.action!.to)}
                  className="shrink-0 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-primary transition-all duration-250 hover:bg-white/90 active:scale-95"
                >
                  {item.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
