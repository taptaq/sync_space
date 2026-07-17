import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useCloudInit } from "@/hooks/useCloudInit";
import { useReminderScheduler, usePostponedTriggerRecheck } from "@/lib/reminderScheduler";
import AppShell from "@/components/layout/AppShell";
import Toast from "@/components/common/Toast";
import ProtocolTrigger from "@/components/protocol/ProtocolTrigger";
import FeedbackPrompt from "@/components/today/FeedbackPrompt";
import Onboarding from "@/pages/Onboarding";
import Today from "@/pages/Today";
import Climate from "@/pages/Climate";
import Protocol from "@/pages/Protocol";
import Review from "@/pages/Review";
import ReviewDetail from "@/pages/ReviewDetail";
import ProtocolNew from "@/pages/ProtocolNew";
import Screen from "@/pages/Screen";
import Connection from "@/pages/Connection";
import Settings from "@/pages/Settings";

// 页面切换过渡：纯 opacity · 不使用 y 位移
// 原因：framer-motion 的 transform 会创建 containing block，
// 导致内部 fixed inset-0 遮罩层被限制在容器宽度内而非全视口
const pageVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// 未完成引导则重定向到 /onboarding
function RequireOnboard({ children }: { children: React.ReactNode }) {
  const onboarded = useStore((s) => s.onboarded);
  if (!onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/onboarding" element={<PageWrapper><Onboarding /></PageWrapper>} />

        <Route
          path="/today"
          element={
            <RequireOnboard>
              <PageWrapper><Today /></PageWrapper>
            </RequireOnboard>
          }
        />
        <Route
          path="/climate"
          element={
            <RequireOnboard>
              <PageWrapper><Climate /></PageWrapper>
            </RequireOnboard>
          }
        />
        <Route
          path="/connect"
          element={
            <RequireOnboard>
              <PageWrapper><Connection /></PageWrapper>
            </RequireOnboard>
          }
        />
        <Route
          path="/protocol"
          element={
            <RequireOnboard>
              <PageWrapper><Protocol /></PageWrapper>
            </RequireOnboard>
          }
        />
        <Route
          path="/review"
          element={
            <RequireOnboard>
              <PageWrapper><Review /></PageWrapper>
            </RequireOnboard>
          }
        />
        <Route
          path="/review/:crashId"
          element={
            <RequireOnboard>
              <PageWrapper><ReviewDetail /></PageWrapper>
            </RequireOnboard>
          }
        />
        <Route
          path="/protocol/new"
          element={
            <RequireOnboard>
              <PageWrapper><ProtocolNew /></PageWrapper>
            </RequireOnboard>
          }
        />
        <Route
          path="/screen"
          element={
            <RequireOnboard>
              <PageWrapper><Screen /></PageWrapper>
            </RequireOnboard>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireOnboard>
              <PageWrapper><Settings /></PageWrapper>
            </RequireOnboard>
          }
        />

        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const cloudStatus = useCloudInit();
  // PWA 每日锚点提醒：全局挂载一次，命中时点推送系统通知
  useReminderScheduler();
  // 推迟协议重弹：30 分钟到点后重新激活触发器（PRD §07：先记后弹）
  usePostponedTriggerRecheck();

  // Supabase 初始化中：显示加载屏（仅配置了 Supabase 时出现）
  if (cloudStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-ink-muted">正在连接云端...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppShell>
        <AnimatedRoutes />
      </AppShell>
      {/* 全局挂载：Toast 通知 + 协议触发推送 + 执行后反馈询问（PRD §09：始终在最上层） */}
      <Toast />
      <ProtocolTrigger />
      <FeedbackPrompt />
    </Router>
  );
}
