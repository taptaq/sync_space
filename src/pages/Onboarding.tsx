import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  ChevronRight,
  CloudSun,
  Sparkles,
  User,
  Baby,
} from "lucide-react";
import type { AppMode, CollaboratorRole, NeuroType, ADHDSubtype } from "@/types";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";
import { cn } from "@/lib/utils";

// Onboarding · 神经特质设置（PRD §05 F-12）
// 全程可跳过 · 通俗语言知情同意 · 非病理化叙事
const NEURO_OPTIONS: {
  key: NeuroType;
  label: StringKey;
  desc: StringKey;
  icon: typeof Brain;
}[] = [
  {
    key: "asd",
    label: "neuro_asd",
    desc: "onb_neuro_asd",
    icon: Brain,
  },
  {
    key: "adhd",
    label: "neuro_adhd",
    desc: "onb_neuro_adhd",
    icon: Sparkles,
  },
  {
    key: "other",
    label: "onb_neuro_other",
    desc: "onb_neuro_other_desc",
    icon: CloudSun,
  },
];

// 应用模式选项（自主签到 / 家长代理签到）
const MODE_OPTIONS: {
  key: AppMode;
  label: StringKey;
  desc: StringKey;
  icon: typeof User;
}[] = [
  {
    key: "self",
    label: "onb_mode_self",
    desc: "onb_mode_self_desc",
    icon: User,
  },
  {
    key: "parent_proxy",
    label: "onb_mode_parent",
    desc: "onb_mode_parent_desc",
    icon: Baby,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const setOnboarded = useStore((s) => s.setOnboarded);
  const setStoreAdhdSubtype = useStore((s) => s.setAdhdSubtype);
  const setCollaborator = useStore((s) => s.setCollaborator);
  const setAppMode = useStore((s) => s.setAppMode);
  const setQwenEnabled = useStore((s) => s.setQwenEnabled);
  const { tr } = useT();
  const [step, setStep] = useState(0);
  const [neuro, setNeuro] = useState<NeuroType>("asd");
  const [adhdSub, setAdhdSub] = useState<ADHDSubtype>("unknown");
  const collab: CollaboratorRole = "self";
  const [mode, setMode] = useState<AppMode>("self");
  const [qwenOn, setQwenOn] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const finish = (skipProtocol: boolean) => {
    setAppMode(mode);
    setQwenEnabled(qwenOn);
    setCollaborator(collab);
    setOnboarded(neuro);
    if (neuro === "adhd") setStoreAdhdSubtype(adhdSub);
    if (skipProtocol) {
      navigate("/today");
    } else {
      navigate("/protocol/new");
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-6 pt-16">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudSun size={22} className="text-primary" />
          <span className="font-serif text-xl text-ink">SyncSpace</span>
        </div>
        <button
          onClick={() => finish(true)}
          className="text-xs text-ink-muted transition-colors hover:text-ink"
        >
          {tr("onb_skip")}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col"
          >
            <h1 className="font-serif text-4xl leading-tight text-ink">
              {tr("onb_intro_title_1")}
              <br />
              {tr("onb_intro_title_2")}
            </h1>
            <p className="mt-5 text-body leading-relaxed text-ink-muted">
              {tr("onb_intro_body_1")}
              <span className="text-primary">{tr("onb_intro_body_2")}</span>
              {tr("onb_intro_body_3")}
              <br />
              <br />
              {tr("onb_intro_body_4")}
            </p>

            {/* 模式选择：自主签到 / 家长代理签到 */}
            <div className="mt-7 space-y-3">
              <p className="text-small font-medium text-ink">{tr("onb_choose_mode")}</p>
              {MODE_OPTIONS.map(({ key, label, desc, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-card border p-4 text-left transition-all duration-250",
                    mode === key
                      ? "border-primary bg-primary-mist/40 shadow-glow"
                      : "border-edge bg-white/40 hover:bg-white/60",
                  )}
                >
                  <Icon
                    size={22}
                    className={cn(
                      mode === key ? "text-primary" : "text-ink-muted",
                    )}
                  />
                  <div>
                    <p className="text-body font-medium text-ink">{tr(label)}</p>
                    <p className="text-xs text-ink-muted">{tr(desc)}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-3 rounded-bowl bg-primary-mist/40 p-5">
              <p className="text-small text-ink">
                {tr("onb_what_we_tell")}
              </p>
              <ul className="space-y-2 text-small text-ink-muted">
                <li>{tr("onb_bullet_data")}</li>
                <li>{tr("onb_bullet_ai")}</li>
                <li>{tr("onb_bullet_delete")}</li>
                {mode === "parent_proxy" ? (
                  <li>{tr("onb_bullet_parent")}</li>
                ) : (
                  <li>{tr("onb_bullet_age")}</li>
                )}
              </ul>
            </div>

            <div className="mt-auto pb-8 pt-6">
              <button
                onClick={() => setStep(1)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-body font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
              >
                {tr("onb_start")} <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="neuro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              {tr("onb_step1")}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-ink">
              {tr("onb_neuro_title")}
            </h2>
            <p className="mt-2 text-small text-ink-muted">
              {tr("onb_neuro_desc")}
              <br />
              {tr("onb_neuro_diversity")}
            </p>

            <div className="mt-6 space-y-3">
              {NEURO_OPTIONS.map(({ key, label, desc, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setNeuro(key)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-card border p-4 text-left transition-all duration-250",
                    neuro === key
                      ? "border-primary bg-primary-mist/40 shadow-glow"
                      : "border-edge bg-white/40 hover:bg-white/60",
                  )}
                >
                  <Icon
                    size={22}
                    className={cn(
                      neuro === key ? "text-primary" : "text-ink-muted",
                    )}
                  />
                  <div>
                    <p className="text-body font-medium text-ink">{tr(label)}</p>
                    <p className="text-xs text-ink-muted">{tr(desc)}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* ADHD 子类型选择 · 仅当选了 ADHD 时显示 */}
            {neuro === "adhd" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mt-4"
              >
                <p className="mb-1 text-xs font-medium text-primary">
                  {tr("adhd_subtype_title")}
                </p>
                <p className="mb-3 text-[11px] text-ink-muted">
                  {tr("adhd_subtype_desc")}
                </p>
                <div className="space-y-2">
                  {([
                    { key: "inattentive" as const, label: "adhd_subtype_inattentive", desc: "adhd_subtype_inattentive_desc" },
                    { key: "hyperactive" as const, label: "adhd_subtype_hyperactive", desc: "adhd_subtype_hyperactive_desc" },
                    { key: "combined" as const, label: "adhd_subtype_combined", desc: "adhd_subtype_combined_desc" },
                    { key: "unknown" as const, label: "adhd_subtype_unknown", desc: "adhd_subtype_unknown_desc" },
                  ]).map(({ key, label, desc }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setAdhdSub(key);
                        if (key === "unknown") {
                          setOnboarded(neuro);
                          navigate("/screen?scale=dsm5a18b");
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-card border p-3 text-left transition-all duration-250",
                        adhdSub === key
                          ? "border-primary bg-primary-mist/30"
                          : "border-edge bg-white/30 hover:bg-white/50",
                      )}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{tr(label as StringKey)}</p>
                        <p className="text-[11px] text-ink-muted">{tr(desc as StringKey)}</p>
                      </div>
                      {adhdSub === key && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 神经特质自评可选入口（PRD §11 非诊断 · 让更多人有效加入） */}
            <button
              onClick={() => {
                setOnboarded(neuro);
                navigate("/screen");
              }}
              className="mt-3 flex w-full items-center gap-3 rounded-card border border-dashed-candidate bg-white/30 p-3.5 text-left transition-all duration-250 hover:bg-white/50 active:scale-[0.99]"
            >
              <Sparkles size={16} className="shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-small text-ink">
                  {tr("onb_self_assess")}
                </p>
                <p className="text-xs text-ink-muted">
                  {tr("onb_self_assess_desc")}
                </p>
              </div>
              <ChevronRight size={14} className="shrink-0 text-ink-faint" />
            </button>

            <div className="mt-auto pb-8 pt-6">
              <button
                onClick={() => setStep(2)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-body font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
              >
                {tr("onb_next")} <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="consent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              {tr("onb_step2")}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-ink">
              {tr("onb_consent_title")}
            </h2>

            <div className="mt-6 space-y-4 rounded-bowl bg-white/50 p-5 text-small leading-relaxed text-ink">
              <div>
                <p className="font-medium text-ink">{tr("onb_consent_data_q")}</p>
                <p className="mt-1 text-ink-muted">
                  {tr("onb_consent_data_a")}
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">{tr("onb_consent_ai_q")}</p>
                <p className="mt-1 text-ink-muted">
                  {tr("onb_consent_ai_a")}
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">{tr("onb_consent_delete_q")}</p>
                <p className="mt-1 text-ink-muted">
                  {tr("onb_consent_delete_a")}
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">{tr("onb_consent_boundary_q")}</p>
                <p className="mt-1 text-ink-muted">
                  {tr("onb_consent_boundary_a")}
                </p>
                <div className="mt-2 space-y-0.5">
                  <p className="text-ink-muted">
                    {tr("onb_crisis_hotline_1")}
                  </p>
                  <p className="text-ink-muted">
                    {tr("onb_crisis_hotline_2")}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setAgreed(true)}
              className={cn(
                "mt-5 flex items-center gap-2.5 rounded-card border p-4 transition-all duration-250",
                agreed
                  ? "border-sage bg-sage-mist/40"
                  : "border-edge bg-white/40 hover:bg-white/60",
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                  agreed ? "border-sage bg-sage" : "border-ink-faint",
                )}
              >
                {agreed && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4l2.5 2.5L9 1"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-small text-ink">
                {tr("onb_agree")}
              </span>
            </button>

            <div className="mt-auto pb-8 pt-6 space-y-3">
              <button
                disabled={!agreed}
                onClick={() => setStep(3)}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-body font-medium transition-all duration-250",
                  agreed
                    ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
                    : "cursor-not-allowed bg-edge text-ink-muted",
                )}
              >
                {tr("onb_next")} <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full text-center text-xs text-ink-muted underline-offset-2 hover:underline"
              >
                {tr("onb_skip_ai")}
              </button>
              {!agreed && (
                <button
                  onClick={() => setStep(2)}
                  className="w-full text-center text-xs text-ink-muted underline-offset-2 hover:underline"
                >
                  {tr("onb_dont_understand")}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="qwen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              {tr("onb_step3")}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-ink">
              {tr("onb_ai_title")}
            </h2>
            <p className="mt-2 text-small leading-relaxed text-ink-muted">
              {tr("onb_ai_desc")}
            </p>

            {/* 隐私告知 */}
            <div className="mt-5 space-y-3 rounded-bowl bg-white/50 p-5 text-small leading-relaxed text-ink">
              <div>
                <p className="font-medium text-ink">{tr("onb_ai_compliance_title")}</p>
                <ul className="mt-1.5 space-y-1.5 text-ink-muted">
                  <li>{tr("onb_ai_compliance_voice")}</li>
                  <li>{tr("onb_ai_compliance_photo")}</li>
                  <li>{tr("onb_ai_compliance_bio")}</li>
                  {mode === "parent_proxy" && (
                    <li>{tr("onb_ai_compliance_parent")}</li>
                  )}
                </ul>
              </div>
            </div>

            {/* 开关选择 */}
            <div className="mt-5 space-y-3">
              <button
                onClick={() => setQwenOn(true)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-card border p-4 text-left transition-all duration-250",
                  qwenOn
                    ? "border-primary bg-primary-mist/40 shadow-glow"
                    : "border-edge bg-white/40 hover:bg-white/60",
                )}
              >
                <Sparkles
                  size={22}
                  className={cn(qwenOn ? "text-primary" : "text-ink-muted")}
                />
                <div>
                  <p className="text-body font-medium text-ink">{tr("onb_ai_on")}</p>
                  <p className="text-xs text-ink-muted">
                    {tr("onb_ai_on_desc")}
                  </p>
                </div>
              </button>
              <button
                onClick={() => setQwenOn(false)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-card border p-4 text-left transition-all duration-250",
                  !qwenOn
                    ? "border-primary bg-primary-mist/40 shadow-glow"
                    : "border-edge bg-white/40 hover:bg-white/60",
                )}
              >
                <User
                  size={22}
                  className={cn(!qwenOn ? "text-primary" : "text-ink-muted")}
                />
                <div>
                  <p className="text-body font-medium text-ink">{tr("onb_ai_off")}</p>
                  <p className="text-xs text-ink-muted">
                    {tr("onb_ai_off_desc")}
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-auto pb-8 pt-6">
              <button
                onClick={() => setStep(4)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-body font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
              >
                {tr("onb_next")} <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="first-protocol"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              {tr("onb_step4")}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-ink">
              {tr("onb_protocol_title")}
            </h2>
            <p className="mt-2 text-small text-ink-muted">
              {tr("onb_protocol_desc_1")}
              <br />
              {tr("onb_protocol_desc_2")}
            </p>

            {/* 协议参与者叙事（轻量 · 未来扩展口） */}
            <div className="mt-4 rounded-xl bg-white/40 px-4 py-3">
              <p className="text-[11px] leading-relaxed text-ink-muted">
                {tr("onb_protocol_narrative")}
              </p>
            </div>

            <div className="mt-6 rounded-bowl bg-sage-mist/40 p-5">
              <p className="text-small text-ink-muted">{tr("onb_protocol_example")}</p>
              <p className="mt-2 font-mono text-xs text-sage">{tr("onb_protocol_example_when")}</p>
              <p className="mt-1.5 text-body text-ink">
                {tr("onb_protocol_example_then")}
              </p>
            </div>

            <p className="mt-5 text-center text-xs text-ink-muted">
              {tr("onb_protocol_hint")}
            </p>

            <div className="mt-auto pb-8 pt-6 space-y-3">
              <button
                onClick={() => finish(false)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-body font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
              >
                {tr("onb_protocol_create")}
              </button>
              <button
                onClick={() => finish(true)}
                className="w-full text-center text-xs text-ink-muted underline-offset-2 hover:underline"
              >
                {tr("onb_protocol_later")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
