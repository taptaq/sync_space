import type { ClimateType } from "@/types";

// 气候符号（PRD §09：统一用柔和线条，不用 emoji——emoji 色彩过于丰富）
// 抽象化降低感官负载
export default function ClimateIcon({
  climate,
  size = 56,
}: {
  climate: ClimateType;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (climate) {
    case "stuffy_rain":
      // 闷热待雨：云 + 几滴雨
      return (
        <svg {...common} className="text-primary">
          <path d="M18 38a10 10 0 0 1 1-19 13 13 0 0 1 25 4 8 8 0 0 1-2 15H18z" />
          <path d="M24 46v6M32 46v8M40 46v6" opacity="0.6" />
        </svg>
      );
    case "clear_breeze":
      // 晴朗微风：太阳 + 风线
      return (
        <svg {...common} className="text-sage">
          <circle cx="32" cy="28" r="9" />
          <path d="M32 12v4M32 40v4M16 28h4M44 28h4M20 18l3 3M41 41l3 3M44 18l-3 3M23 41l-3 3" opacity="0.7" />
          <path d="M14 50h14M14 54h22" opacity="0.5" />
        </svg>
      );
    case "warm_fog":
      // 暖雾弥漫：雾线
      return (
        <svg {...common} className="text-clay">
          <path d="M10 24h36M14 32h32M10 40h36M16 48h28" opacity="0.7" />
          <path d="M22 18h20" opacity="0.4" />
        </svg>
      );
    case "storm_warning":
      // 雷暴预警：云 + 闪电
      return (
        <svg {...common} className="text-warn">
          <path d="M18 36a10 10 0 0 1 1-19 13 13 0 0 1 25 4 8 8 0 0 1-2 15H18z" />
          <path d="M30 38l-6 10h7l-3 8 8-12h-6l4-6z" opacity="0.8" />
        </svg>
      );
    default:
      return null;
  }
}
