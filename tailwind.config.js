/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // 设计系统色板（PRD §09）
        base: "#FAF7F2", // 暖白/奶油底色
        primary: {
          DEFAULT: "#6B5FA0", // 柔和雾紫
          soft: "#9A8FC4",
          mist: "#E8E4F2",
        },
        sage: {
          DEFAULT: "#6B9E8A", // 鼠尾草绿
          soft: "#9BC2B0",
          mist: "#E4EFE8",
        },
        clay: {
          DEFAULT: "#C4956A", // 暖陶色
          soft: "#DCB894",
          mist: "#F2E6D6",
        },
        ink: {
          DEFAULT: "#3A352F", // 暖深灰正文
          muted: "#8A8074", // 暖灰次要文字
          faint: "#B5AC9E",
        },
        warn: {
          DEFAULT: "#C4715A", // 降饱和陶土红
          soft: "#D89A87",
          mist: "#F2DDD4",
        },
        edge: "#E0D9CC", // 暖米色边框
      },
      fontFamily: {
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ['"Outfit"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // 正文 15px 最小 14px，不追求信息密度
        body: ["15px", { lineHeight: "1.8" }],
        small: ["14px", { lineHeight: "1.7" }],
      },
      borderRadius: {
        card: "12px",
        bowl: "20px",
      },
      boxShadow: {
        // 柔和大范围阴影，模拟自然光下柔和层次（PRD 禁忌：不用硬阴影 blur<8px）
        soft: "0 2px 12px rgba(58,53,47,0.06)",
        lift: "0 6px 24px rgba(58,53,47,0.08)",
        glow: "0 0 24px rgba(107,95,160,0.12)",
      },
      transitionTimingFunction: {
        // 200-300ms ease-out，不用 ease-in-out（回弹感不适）
        calm: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        250: "250ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "glow-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.3" },
          "33%": { transform: "translate(30px, -20px) scale(1.1)", opacity: "0.5" },
          "66%": { transform: "translate(-20px, 15px) scale(0.95)", opacity: "0.35" },
        },
        "float-particle": {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "0" },
          "20%": { opacity: "0.6" },
          "80%": { opacity: "0.4" },
          "100%": { transform: "translateY(-60px) translateX(10px)", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slide-down 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        breathe: "breathe 4s ease-in-out infinite",
        "glow-drift": "glow-drift 20s ease-in-out infinite",
        "float-particle": "float-particle 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
