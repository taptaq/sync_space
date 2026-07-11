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
import type { AppMode, CollaboratorRole, NeuroType } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

// Onboarding · 神经特质设置（PRD §05 F-12）
// 全程可跳过 · 通俗语言知情同意 · 非病理化叙事
const NEURO_OPTIONS: {
  key: NeuroType;
  label: string;
  desc: string;
  icon: typeof Brain;
}[] = [
  {
    key: "asd",
    label: "ASD",
    desc: "感官敏感 · 社交电量有限 · 需要可预测性",
    icon: Brain,
  },
  {
    key: "adhd",
    label: "ADHD",
    desc: "注意力起伏 · 多巴胺电量不稳定 · 启动困难",
    icon: Sparkles,
  },
  {
    key: "other",
    label: "其他",
    desc: "我还不太确定，先看看",
    icon: CloudSun,
  },
];

// 应用模式选项（自主签到 / 家长代理签到）
const MODE_OPTIONS: {
  key: AppMode;
  label: string;
  desc: string;
  icon: typeof User;
}[] = [
  {
    key: "self",
    label: "我自己用",
    desc: "面向能自主签到的人（建议 13+）· 三轴滑块自填",
    icon: User,
  },
  {
    key: "parent_proxy",
    label: "帮孩子用",
    desc: "家长代理签到 · 观察行为选择 · 给家长引导建议",
    icon: Baby,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const setOnboarded = useStore((s) => s.setOnboarded);
  const setCollaborator = useStore((s) => s.setCollaborator);
  const setAppMode = useStore((s) => s.setAppMode);
  const setQwenEnabled = useStore((s) => s.setQwenEnabled);
  const [step, setStep] = useState(0);
  const [neuro, setNeuro] = useState<NeuroType>("asd");
  const collab: CollaboratorRole = "self";
  const [mode, setMode] = useState<AppMode>("self");
  const [qwenOn, setQwenOn] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const finish = (skipProtocol: boolean) => {
    setAppMode(mode);
    setQwenEnabled(qwenOn);
    setCollaborator(collab);
    setOnboarded(neuro);
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
          跳过
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col"
          >
            <h1 className="font-serif text-4xl leading-tight text-ink">
              这不是情绪日记，
              <br />
              也不是 AI 安慰机器人。
            </h1>
            <p className="mt-5 text-body leading-relaxed text-ink-muted">
              这是一个让你在过载前
              <span className="text-primary">而非过载后</span>
              被推一把的预警系统。
              <br />
              <br />
              协议是你和自己签的，AI 是秘书。
            </p>

            {/* 模式选择：自主签到 / 家长代理签到 */}
            <div className="mt-7 space-y-3">
              <p className="text-small font-medium text-ink">先选一个使用方式</p>
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
                    <p className="text-body font-medium text-ink">{label}</p>
                    <p className="text-xs text-ink-muted">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-3 rounded-bowl bg-primary-mist/40 p-5">
              <p className="text-small text-ink">
                我们会用通俗的语言告诉你：
              </p>
              <ul className="space-y-2 text-small text-ink-muted">
                <li>· 你的数据存在哪里、谁能看到</li>
                <li>· AI 会做什么、不会做什么</li>
                <li>· 你随时可以删除一切</li>
                {mode === "parent_proxy" ? (
                  <li>· 家长代理模式：家长代为签到，孩子不需要拿手机</li>
                ) : (
                  <li>· 面向能自主签到的人（建议 13+）</li>
                )}
              </ul>
            </div>

            <div className="mt-auto pb-8 pt-6">
              <button
                onClick={() => setStep(1)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-body font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
              >
                开始 <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="neuro"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              第一步
            </p>
            <h2 className="mt-1 font-serif text-3xl text-ink">
              你的神经特质
            </h2>
            <p className="mt-2 text-small text-ink-muted">
              这不是诊断。只是帮我们配置适合你的签到维度和默认协议。
              <br />
              神经多样性是差异，不是疾病。
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
                    <p className="text-body font-medium text-ink">{label}</p>
                    <p className="text-xs text-ink-muted">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

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
                  不太确定？做一份自评更了解自己
                </p>
                <p className="text-xs text-ink-muted">
                  AQ-10 / ASRS-5 · 非诊断
                </p>
              </div>
              <ChevronRight size={14} className="shrink-0 text-ink-faint" />
            </button>

            <div className="mt-auto pb-8 pt-6">
              <button
                onClick={() => setStep(2)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-body font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
              >
                下一步 <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="consent"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              第二步
            </p>
            <h2 className="mt-1 font-serif text-3xl text-ink">
              你的数据，你做主
            </h2>

            <div className="mt-6 space-y-4 rounded-bowl bg-white/50 p-5 text-small leading-relaxed text-ink">
              <div>
                <p className="font-medium text-ink">数据存哪里？</p>
                <p className="mt-1 text-ink-muted">
                  全部存在你这台设备上。不传云端，不共享，只有你自己可见。
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">AI 会做什么？</p>
                <p className="mt-1 text-ink-muted">
                  AI 是秘书。它帮你记住协议、在合适的时候提醒你、帮你看自己注意不到的模式。
                  它绝不替你做决定。
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">我能删吗？</p>
                <p className="mt-1 text-ink-muted">
                  随时。可以删单条记录，也可以一键清空。删除后不留痕迹。
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">边界与帮助</p>
                <p className="mt-1 text-ink-muted">
                  SyncSpace 是自我调节辅助工具，不提供诊断或治疗，不能替代专业帮助。
                  如果你正在经历危机或有自伤念头，请直接联系下面的资源——和专业的人聊聊，是照顾自己的方式。
                </p>
                <div className="mt-2 space-y-0.5">
                  <p className="text-ink-muted">
                    · 全国 24 小时心理危机干预热线：400-161-9995
                  </p>
                  <p className="text-ink-muted">
                    · 北京心理危机研究与干预中心：010-82951332
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
                我理解了，愿意开始
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
                下一步 <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full text-center text-xs text-ink-muted underline-offset-2 hover:underline"
              >
                跳过 AI 增强功能
              </button>
              {!agreed && (
                <button
                  onClick={() => setStep(2)}
                  className="w-full text-center text-xs text-ink-muted underline-offset-2 hover:underline"
                >
                  我不太理解，再解释一下
                </button>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="qwen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              第三步
            </p>
            <h2 className="mt-1 font-serif text-3xl text-ink">
              AI 增强（可选）
            </h2>
            <p className="mt-2 text-small leading-relaxed text-ink-muted">
              开启后，你可以用语音签到、语音补记崩溃、拍环境照片分析感官友好度，AI 还会基于你的阶段生成个性化建议。
            </p>

            {/* 隐私告知 */}
            <div className="mt-5 space-y-3 rounded-bowl bg-white/50 p-5 text-small leading-relaxed text-ink">
              <div>
                <p className="font-medium text-ink">合规格式说明</p>
                <ul className="mt-1.5 space-y-1.5 text-ink-muted">
                  <li>· 语音只转文字，不做声纹/语音情绪识别</li>
                  <li>· 环境照片只分析光线/噪音/杂乱度，不识别人脸</li>
                  <li>· 不涉及生物识别，不需要算法备案</li>
                  {mode === "parent_proxy" && (
                    <li>· 家长代理模式：所有 AI 功能由家长操作</li>
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
                  <p className="text-body font-medium text-ink">开启 AI 增强</p>
                  <p className="text-xs text-ink-muted">
                    语音签到 · 语音补记 · 环境扫描 · 智能建议
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
                  <p className="text-body font-medium text-ink">先用基础版</p>
                  <p className="text-xs text-ink-muted">
                    三轴滑块签到 · 之后随时可开启
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-auto pb-8 pt-6">
              <button
                onClick={() => setStep(4)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-body font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
              >
                下一步 <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="first-protocol"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              最后一步
            </p>
            <h2 className="mt-1 font-serif text-3xl text-ink">
              和自己签第一份协议
            </h2>
            <p className="mt-2 text-small text-ink-muted">
              协议是"当 X 发生时，我给自己约定 Y"。
              <br />
              这是 SyncSpace 最核心的东西——AI 帮你记住，在对的时候提醒你。
            </p>

            {/* 协议参与者叙事（轻量 · 未来扩展口） */}
            <div className="mt-4 rounded-xl bg-white/40 px-4 py-3">
              <p className="text-[11px] leading-relaxed text-ink-muted">
                协议默认只和你自己有关。
                未来如果你想让伴侣、家人或治疗师参与，SyncSpace 会帮他们理解你的状态，少一些解释。
              </p>
            </div>

            <div className="mt-6 rounded-bowl bg-sage-mist/40 p-5">
              <p className="text-small text-ink-muted">示例</p>
              <p className="mt-2 font-mono text-xs text-sage">WHEN · 感官负载 &gt; 7</p>
              <p className="mt-1.5 text-body text-ink">
                15 分钟内撤退到安静空间，不等别人同意
              </p>
            </div>

            <p className="mt-5 text-center text-xs text-ink-muted">
              我们已经为你预置了几条协议，你可以稍后在「气候」页调整。
            </p>

            <div className="mt-auto pb-8 pt-6 space-y-3">
              <button
                onClick={() => finish(false)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-body font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
              >
                创建我的第一份协议
              </button>
              <button
                onClick={() => finish(true)}
                className="w-full text-center text-xs text-ink-muted underline-offset-2 hover:underline"
              >
                先用预置协议，稍后再说
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
