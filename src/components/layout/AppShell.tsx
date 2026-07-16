import { Link, useLocation } from "react-router-dom";
import { BellRing, Brain, HeartHandshake } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import CrisisSupport from "@/components/common/CrisisSupport";
import SoundScape from "@/components/common/SoundScape";

// 三段主循环：预警 → 理解 → 连接
const TAB_KEYS = [
  { to: "/today", key: "tab_today" as const, icon: BellRing, paths: ["/today"] },
  { to: "/climate", key: "tab_climate" as const, icon: Brain, paths: ["/climate", "/review", "/protocol", "/screen"] },
  { to: "/connect", key: "tab_connect" as const, icon: HeartHandshake, paths: ["/connect"] },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const lowSensoryMode = useStore((s) => s.lowSensoryMode);
  const { tr } = useT();
  const tabs = TAB_KEYS.map((t) => ({ ...t, label: tr(t.key) }));
  // 深度专注页隐藏底部 nav（PRD §09：单一任务空间）
  const hideNav =
    location.pathname === "/onboarding" ||
    location.pathname === "/protocol/new" ||
    location.pathname === "/screen" ||
    location.pathname === "/settings" ||
    location.pathname.startsWith("/review/");

  return (
    <div className={cn("relative mx-auto flex h-screen max-w-md flex-col bg-base", lowSensoryMode && "low-sensory-mode")}>
      <main className="relative z-10 flex-1 overflow-y-auto px-5 pb-5">
        {children}
      </main>

      {!hideNav && (
        <nav className="glass-card fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-edge/60">
          <div className="absolute -top-16 right-3">
            <CrisisSupport compact />
          </div>
          <div className="flex items-stretch justify-around px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            {tabs.map(({ to, label, icon: Icon, paths }) => {
              const isActive = paths.some((path) =>
                path === "/today" || path === "/climate" || path === "/connect"
                  ? location.pathname === path
                  : location.pathname.startsWith(path),
              );
              return (
              <Link
                key={to}
                to={to}
                className="flex flex-1 flex-col items-center gap-1 py-1.5"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    opacity: isActive ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Icon
                    size={22}
                    className={cn(isActive ? "text-primary" : "text-ink-muted")}
                  />
                </motion.div>
                <span
                  className={cn(
                    "text-xs transition-colors duration-250",
                    isActive ? "font-medium text-primary" : "text-ink-muted",
                  )}
                >
                  {label}
                </span>
              </Link>
              );
            })}
          </div>
        </nav>
      )}

      {hideNav || <div className="h-20 shrink-0" />}

      {/* 全局音景控制器（底栏左侧悬浮 · 不在 onboarding 等深度专注页显示） */}
      {!hideNav && <SoundScape />}
    </div>
  );
}
