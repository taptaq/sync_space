// 温暖短语池 · 完成动作后随机嵌入 toast
// ADHD 对变量奖励敏感（谨慎使用：不上瘾、不弹窗、只是 toast 末尾一句）
// ASD/PTSD/HSP 偏好温和、不夸张、不评判的语气
// 不与具体动作绑定（避免"奖励 = 必须做"的暗示），只是完成时刻的轻陪伴
//
// 用法：pushToast("success", `${baseMessage} · ${getWarmPhrase()}`)

import type { Lang } from "@/lib/translations";

const PHRASES_ZH = [
  "看见本身就是一种自我连接",
  "停顿也是行动",
  "你不必做完，做一点就够了",
  "今天又多看见自己一点",
  "不必完美，够用就好",
  "慢一点也没关系",
  "你已经在做",
  "可以给自己一个深呼吸",
];

const PHRASES_EN = [
  "Seeing itself is self-connection",
  "Pausing is also an action",
  "You don't have to finish — a little is enough",
  "You saw yourself a bit more today",
  "Good enough is enough",
  "Going slow is okay",
  "You're already doing it",
  "Take a breath",
];

export function getWarmPhrase(lang: Lang = "zh"): string {
  const pool = lang === "en" ? PHRASES_EN : PHRASES_ZH;
  return pool[Math.floor(Math.random() * pool.length)];
}
