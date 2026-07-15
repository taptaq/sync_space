import { createPortal } from "react-dom";

// 全局遮罩 Portal
// 将 fixed 遮罩层渲染到 document.body，避免被父级 motion div 的 transform 裁剪
// 这是 framer-motion 路由动画包裹 fixed 元素导致"顶部空白"问题的根本修复
export function ModalPortal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}
