import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Sparkles } from "lucide-react";
import type { CheckIn, NeuroType, Phase, WeatherSnapshot } from "@/types";
import { detectPhase, getPhaseConfigForType } from "@/lib/stageEngine";
import { getClimateFingerprint } from "@/lib/climateFingerprint";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// 气候明信片 · 本地生成 + 导出
// 设计原则：
// - 无社交压力：只生成图片，用户自主决定分享到哪里
// - 感官安全：柔和色调，无自动播放媒体
// - 隐私保护：不含原始轴值，只有模糊化的气候指纹
// - 可预测性：明信片内容来自当前签到 + 气候指纹，用户可预览后再决定

const FEELING_PROMPT_KEYS = [
  "postcard_feeling_prompt_1",
  "postcard_feeling_prompt_2",
  "postcard_feeling_prompt_3",
] as const;

const POSTCARD_WIDTH = 360;
const POSTCARD_HEIGHT = 540;

export default function ClimatePostcard({
  show,
  onClose,
  checkins,
  neuroType,
  currentWeather,
}: {
  show: boolean;
  onClose: () => void;
  checkins: CheckIn[];
  neuroType: NeuroType;
  currentWeather: WeatherSnapshot;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [feeling, setFeeling] = useState("");
  const [exporting, setExporting] = useState(false);
  const [promptIndex] = useState(() => Math.floor(Math.random() * FEELING_PROMPT_KEYS.length));
  const { tr, tt } = useT();

  const fingerprint = getClimateFingerprint(checkins, neuroType);
  const phase = detectPhase(currentWeather.climate, []);
  const phaseCfg = getPhaseConfigForType(phase, neuroType);

  // Canvas 绘制用的翻译文案
  const brandText = tr("postcard_brand");
  const fingerprintTitleText = tr("postcard_fingerprint_title");
  const anonymousText = tr("postcard_anonymous");
  const checkinCountText = tr("postcard_checkin_count", { count: checkins.length });
  const phaseLabelText = tt(phaseCfg.label);
  const climateLabelText = tt(currentWeather.climate_label);
  const descriptionText = tt(currentWeather.description);

  // 在 Canvas 上绘制明信片
  const drawPostcard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = POSTCARD_WIDTH * dpr;
    canvas.height = POSTCARD_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    // 背景渐变（按阶段色调）
    const colorMap: Record<Phase, [string, string]> = {
      stable: ["#E4EFE8", "#F7FAF6"],
      accumulating: ["#F2E6D6", "#FAF4EC"],
      warning: ["#F5E8D0", "#FBF3E0"],
      overload: ["#F2DDD4", "#FAF0EC"],
      recovery: ["#E8E4F2", "#F4F2FA"],
    };
    const [c1, c2] = colorMap[phase];
    const grad = ctx.createLinearGradient(0, 0, POSTCARD_WIDTH, POSTCARD_HEIGHT);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, POSTCARD_WIDTH, POSTCARD_HEIGHT);

    // 柔光圆（装饰）
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = fingerprint?.colorCode ?? "#6B5FA0";
    ctx.beginPath();
    ctx.arc(POSTCARD_WIDTH - 60, 80, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 品牌标识
    ctx.fillStyle = "#8A8074";
    ctx.font = "500 11px Outfit, sans-serif";
    ctx.fillText(brandText, 24, 36);

    // 阶段标签
    const badgeColor = fingerprint?.colorCode ?? "#6B5FA0";
    ctx.fillStyle = badgeColor;
    ctx.globalAlpha = 0.12;
    roundRect(ctx, 24, 56, 80, 24, 12);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = badgeColor;
    ctx.font = "500 12px Outfit, sans-serif";
    ctx.fillText(phaseLabelText, 36, 72);

    // 气候名称（大标题）
    ctx.fillStyle = "#3A352F";
    ctx.font = "400 28px Georgia, serif";
    ctx.fillText(climateLabelText, 24, 120);

    // 气候描述
    ctx.fillStyle = "#8A8074";
    ctx.font = "400 13px Outfit, sans-serif";
    wrapText(ctx, descriptionText, 24, 142, POSTCARD_WIDTH - 48, 18);

    // 分隔线
    ctx.strokeStyle = "rgba(58, 53, 47, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, 200);
    ctx.lineTo(POSTCARD_WIDTH - 24, 200);
    ctx.stroke();

    // 气候指纹区域
    if (fingerprint) {
      ctx.fillStyle = "#B5AC9E";
      ctx.font = "500 10px Outfit, sans-serif";
      ctx.fillText(fingerprintTitleText, 24, 222);

      ctx.fillStyle = "#3A352F";
      ctx.font = "400 14px Outfit, sans-serif";
      wrapText(ctx, fingerprint.summary, 24, 244, POSTCARD_WIDTH - 48, 20);
    }

    // 用户感言（手写风格区域）
    if (feeling.trim()) {
      ctx.fillStyle = "#6B5FA0";
      ctx.globalAlpha = 0.06;
      roundRect(ctx, 24, 300, POSTCARD_WIDTH - 48, 80, 12);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#3A352F";
      ctx.font = "italic 400 16px Georgia, serif";
      wrapText(ctx, `「${feeling}」`, 36, 328, POSTCARD_WIDTH - 72, 22);
    }

    // 底部签名区
    ctx.strokeStyle = "rgba(58, 53, 47, 0.08)";
    ctx.beginPath();
    ctx.moveTo(24, POSTCARD_HEIGHT - 72);
    ctx.lineTo(POSTCARD_WIDTH - 24, POSTCARD_HEIGHT - 72);
    ctx.stroke();

    // 日期
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
    ctx.fillStyle = "#B5AC9E";
    ctx.font = "400 11px Outfit, sans-serif";
    ctx.fillText(dateStr, 24, POSTCARD_HEIGHT - 48);

    // 匿名标识
    ctx.fillStyle = "#B5AC9E";
    ctx.font = "400 10px Outfit, sans-serif";
    ctx.fillText(anonymousText, 24, POSTCARD_HEIGHT - 30);

    // 签到次数
    ctx.textAlign = "right";
    ctx.fillStyle = "#B5AC9E";
    ctx.fillText(checkinCountText, POSTCARD_WIDTH - 24, POSTCARD_HEIGHT - 30);
    ctx.textAlign = "left";
  }, [fingerprint, phase, phaseCfg, currentWeather, feeling, checkins.length, brandText, fingerprintTitleText, anonymousText, checkinCountText, phaseLabelText, climateLabelText, descriptionText]);

  useEffect(() => {
    if (show) {
      // 延迟绘制确保 DOM 已挂载
      requestAnimationFrame(() => drawPostcard());
    }
  }, [show, drawPostcard, feeling]);

  // 导出图片
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExporting(true);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `syncspace-postcard-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setExporting(false);
    }, "image/png");
  };

  if (!fingerprint) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/30 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm rounded-2xl border border-white/30 bg-base/95 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-base/95 shadow-soft"
            >
              <X size={16} className="text-ink-muted" />
            </button>

            <div>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                <span className="text-xs font-medium text-primary">{tr("postcard_card_title")}</span>
              </div>

              {/* Canvas 预览 */}
              <div className="mb-4 overflow-hidden rounded-card">
                <canvas
                  ref={canvasRef}
                  style={{ width: POSTCARD_WIDTH, height: POSTCARD_HEIGHT, maxWidth: "100%" }}
                  className="block"
                />
              </div>

              {/* 感言输入 */}
              <div className="mb-4">
                <p className="mb-2 text-xs text-ink-muted">{tr(FEELING_PROMPT_KEYS[promptIndex])}</p>
                <input
                  type="text"
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value.slice(0, 50))}
                  placeholder={tr("postcard_feeling_placeholder")}
                  className="w-full rounded-full border border-edge/60 bg-white/50 px-4 py-2.5 text-sm text-ink outline-none transition-all duration-250 focus:border-primary/30 focus:bg-white/70"
                />
                <p className="mt-1 text-right text-[10px] text-ink-faint">{feeling.length}/50</p>
              </div>

              {/* 气候指纹预览 */}
              <div className="mb-4 rounded-card bg-white/40 px-4 py-3">
                <p className="mb-1 text-[10px] font-medium text-ink-faint">{tr("postcard_fingerprint_preview")}</p>
                <p className="text-xs leading-relaxed text-ink-muted">{fingerprint.summary}</p>
              </div>

              {/* 导出按钮 */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-all duration-250",
                  "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]",
                  exporting && "opacity-60",
                )}
              >
                <Download size={16} />
                {exporting ? tr("postcard_exporting") : tr("postcard_save")}
              </button>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-faint">
                {tr("postcard_note_1")}<br />
                {tr("postcard_note_2")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 辅助：圆角矩形
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// 辅助：文本换行
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, maxWidth: number, lineHeight: number,
) {
  const chars = text.split("");
  let line = "";
  let currentY = y;
  for (const char of chars) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line !== "") {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}
