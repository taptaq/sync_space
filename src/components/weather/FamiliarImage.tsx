import type { Phase } from "@/types";

import stableImg from "@/assets/familiar-stable.webp";
import accumulatingImg from "@/assets/familiar-accumulating.webp";
import warningImg from "@/assets/familiar-warning.webp";
import overloadImg from "@/assets/familiar-overload.webp";
import recoveryImg from "@/assets/familiar-recovery.webp";

// 气候精灵生图 prompt（"小小的我" 视觉设计）
// 风格统一：柔和 · 治愈系 · 极简 · 无恐怖谷 · ND 友好
// 本地图片优先加载 · API 生图 URL 作为兜底（离线可用）

const FAMILIAR_IMAGES: Record<Phase, string> = {
  stable: stableImg,
  accumulating: accumulatingImg,
  warning: warningImg,
  overload: overloadImg,
  recovery: recoveryImg,
};

const FAMILIAR_PROMPTS: Record<Phase, { prompt: string; size: string; fallback: string }> = {
  stable: {
    prompt:
      "A tiny round creature with soft green fur, lying down peacefully with relaxed half-closed eyes and a small smile, minimalist kawaii style, soft pastel green and cream colors, gentle glow, no background, clip art style, comforting and calm, suitable for children",
    size: "square_hd",
    fallback: "🌿",
  },
  accumulating: {
    prompt:
      "A tiny round creature with warm clay-colored fur, sitting upright with attentive open eyes and slightly raised ears, minimalist kawaii style, soft orange and cream colors, gentle glow, no background, clip art style, curious and alert, suitable for children",
    size: "square_hd",
    fallback: "⚡",
  },
  warning: {
    prompt:
      "A tiny round creature with golden fur, standing alert with wide open eyes and perked ears, slight tension in posture, minimalist kawaii style, warm amber and cream colors, soft warning glow, no background, clip art style, ready and vigilant, suitable for children",
    size: "square_hd",
    fallback: "🔶",
  },
  overload: {
    prompt:
      "A tiny round creature with soft pinkish fur, curled into a tight protective ball with eyes closed tightly, minimalist kawaii style, muted rose and cream colors, gentle protective aura, no background, clip art style, self-soothing and safe, suitable for children",
    size: "square_hd",
    fallback: "🫧",
  },
  recovery: {
    prompt:
      "A tiny round creature with soft lavender fur, slowly peeking out from behind a small cloud with half-open cautious eyes, minimalist kawaii style, gentle purple and cream colors, soft hope glow, no background, clip art style, brave and gentle, suitable for children",
    size: "square_hd",
    fallback: "💜",
  },
};

// 获取本地精灵图片 URL（优先使用）
export function getFamiliarLocalImage(phase: Phase): string {
  return FAMILIAR_IMAGES[phase] ?? FAMILIAR_IMAGES.stable;
}

// 生成气候精灵的图片 URL（API 兜底 · 如需在线更新）
export function getFamiliarImageUrl(phase: Phase): string {
  const cfg = FAMILIAR_PROMPTS[phase];
  const encoded = encodeURIComponent(cfg.prompt);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encoded}&image_size=${cfg.size}`;
}

// 获取所有阶段的 prompt（用于参考或手动生成）
export function getAllFamiliarPrompts(): Record<Phase, string> {
  return {
    stable: FAMILIAR_PROMPTS.stable.prompt,
    accumulating: FAMILIAR_PROMPTS.accumulating.prompt,
    warning: FAMILIAR_PROMPTS.warning.prompt,
    overload: FAMILIAR_PROMPTS.overload.prompt,
    recovery: FAMILIAR_PROMPTS.recovery.prompt,
  };
}
