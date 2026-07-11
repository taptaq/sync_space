import { NavLink, useLocation } from "react-router-dom";
import { CalendarDays, CloudSun, History, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import CrisisSupport from "@/components/common/CrisisSupport";

// 主布局 + 底部四 Tab（今日·气候·协议·回看 · 职责单一降低注意力疲劳）
const tabs = [
  { to: "/today", label: "今日", icon: CalendarDays },
  { to: "/climate", label: "气候", icon: CloudSun },
  { to: "/protocol", label: "协议", icon: Layers },
  { to: "/review", label: "回看", icon: History },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const lowSensoryMode = useStore((s) => s.lowSensoryMode);
  // 深度专注页隐藏底部 nav（PRD §09：单一任务空间）
  const hideNav =
    location.pathname === "/onboarding" ||
    location.pathname === "/protocol/new" ||
    location.pathname === "/screen" ||
    location.pathname.startsWith("/review/");

  return (
    <div className={cn("mx-auto flex min-h-screen max-w-md flex-col bg-base", lowSensoryMode && "low-sensory-mode")}>
      <main
        className={cn(
          "flex-1 px-5",
          hideNav ? "pb-5" : "pb-28",
        )}
      >
        {children}
      </main>

      {!hideNav && (
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-edge bg-base/90 backdrop-blur-md">
          {/* 常驻危机支持入口（伦理底线 · 低刺激可发现 · 不占用 Tab 位） */}
          <div className="absolute -top-16 right-3">
            <CrisisSupport compact />
          </div>
          <div className="flex items-stretch justify-around px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className="flex flex-1 flex-col items-center gap-1 py-1.5"
              >
                {({ isActive }) => (
                  <>
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
                        isActive
                          ? "font-medium text-primary"
                          : "text-ink-muted",
                      )}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
