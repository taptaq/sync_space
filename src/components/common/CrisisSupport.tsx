import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HeartPulse,
  LifeBuoy,
  Phone,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";

// 危机支持组件（常驻 · 非病理化 · 低刺激）
// 伦理底线：非治疗类工具必须提供危机转介路径（参考 PTSD Coach 类 App 负面反应研究）
// 文案刻意避开"你有病/需要就医"，改用"和专业的人聊聊"，避免羞耻化
//
// compact 模式：底部导航栏旁的小入口（图标按钮），点击弹出 bottom sheet
// 默认模式：内联可展开卡片，收起为"需要帮助"按钮，展开为三层支持内容

// 三层支持内容：即时危机 / 专业支持 / 同伴支持
function CrisisContent() {
  const { tr } = useT();
  return (
    <div className="space-y-5">
      {/* 即时危机 · 热线 */}
      <section>
        <div className="flex items-center gap-2">
          <LifeBuoy size={16} className="text-primary" />
          <p className="text-small font-medium text-ink">{tr("crisis_hotline_title")}</p>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
          {tr("crisis_hotline_desc")}
        </p>
        <div className="mt-3 space-y-2">
          <a
            href="tel:4001619995"
            className="flex items-center justify-between gap-3 rounded-card border border-edge bg-white/60 px-3.5 py-2.5 transition-colors duration-250 hover:bg-white/80"
          >
            <div className="min-w-0">
              <p className="text-small text-ink">{tr("crisis_national_hotline")}</p>
              <p className="text-xs text-ink-muted">
                {tr("crisis_national_hotline_detail")}
              </p>
            </div>
            <Phone size={16} className="shrink-0 text-primary" />
          </a>
          <a
            href="tel:01082951332"
            className="flex items-center justify-between gap-3 rounded-card border border-edge bg-white/60 px-3.5 py-2.5 transition-colors duration-250 hover:bg-white/80"
          >
            <div className="min-w-0">
              <p className="text-small text-ink">{tr("crisis_beijing_center")}</p>
              <p className="text-xs text-ink-muted">{tr("crisis_beijing_center_detail")}</p>
            </div>
            <Phone size={16} className="shrink-0 text-primary" />
          </a>
        </div>
      </section>

      {/* 专业支持 */}
      <section>
        <div className="flex items-center gap-2">
          <Stethoscope size={16} className="text-primary" />
          <p className="text-small font-medium text-ink">{tr("crisis_pro_support")}</p>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
          {tr("crisis_pro_desc")}
          <br />
          {tr("crisis_pro_brave")}
        </p>
      </section>

      {/* 同伴支持 */}
      <section>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <p className="text-small font-medium text-ink">{tr("crisis_peer_support")}</p>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
          {tr("crisis_peer_desc")}
        </p>
      </section>
    </div>
  );
}

export default function CrisisSupport({ compact }: { compact?: boolean }) {
  const { tr } = useT();
  const [expanded, setExpanded] = useState(false);

  // compact 模式：导航栏旁的小入口，点击弹出 bottom sheet
  if (compact) {
    return (
      <>
        <button
          onClick={() => setExpanded(true)}
          aria-label={tr("crisis_need_help")}
          className="flex items-center justify-center rounded-full border border-primary/20 bg-white/60 p-2.5 text-primary shadow-soft transition-all duration-250 hover:bg-white/80 active:scale-95"
        >
          <HeartPulse size={18} />
        </button>

        <AnimatePresence>
          {expanded && (
            <>
              {/* 遮罩层 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setExpanded(false)}
                className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm"
              />
              {/* 底部弹出层 */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl border-t border-white/30 bg-base/95 p-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] shadow-2xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={18} className="text-primary" />
                    <span className="font-serif text-lg text-ink">{tr("crisis_need_help")}</span>
                  </div>
                  <button
                    onClick={() => setExpanded(false)}
                    aria-label={tr("close")}
                    className="rounded-full p-1.5 text-ink-muted transition-colors duration-250 hover:bg-white/60 hover:text-ink"
                  >
                    <X size={18} />
                  </button>
                </div>
                <CrisisContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // 默认模式：内联可展开卡片
  return (
    <div className="rounded-card border border-primary/20 bg-white/40 p-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-center gap-2 text-primary"
      >
        <HeartPulse size={18} />
        <span className="text-body font-medium">{tr("crisis_need_help")}</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              <CrisisContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
