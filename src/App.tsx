import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import AppShell from "@/components/layout/AppShell";
import Toast from "@/components/common/Toast";
import ProtocolTrigger from "@/components/protocol/ProtocolTrigger";
import Onboarding from "@/pages/Onboarding";
import Today from "@/pages/Today";
import Climate from "@/pages/Climate";
import Review from "@/pages/Review";
import ReviewDetail from "@/pages/ReviewDetail";
import ProtocolNew from "@/pages/ProtocolNew";
import Screen from "@/pages/Screen";

// 页面切换过渡：左右滑入呼应 PRD §09 方向一致动效
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
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

        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell>
        <AnimatedRoutes />
      </AppShell>
      {/* 全局挂载：Toast 通知 + 协议触发推送（PRD §09：始终在最上层） */}
      <Toast />
      <ProtocolTrigger />
    </Router>
  );
}
