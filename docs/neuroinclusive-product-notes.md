# 神经多样性产品研究笔记

更新：2026-07-11

## 证据边界

- 用户提供的 ADHD 截图用于理解真实体验和提出产品假设，不作为诊断标准或疗效证据。
- “ADHD 优势”“多巴胺不足”“女性平均 30 岁确诊”等概括受样本、情境和定义影响，不直接写成产品事实。
- 产品只提供自我观察与环境/执行支持，不声称诊断或治疗 ADHD、ASD、PTSD 或 HSP。

## 可转化为交互的共识

1. 降低外部干扰、缩短专注时段、用书面指令和可视化提醒，属于 NICE 列举的环境调整方向。
2. 成人 ADHD 的结构化心理支持通常包含组织、计划、时间管理和把复杂任务拆成小步骤；这些是可做成产品脚手架的技能，而不是“靠自律”。
3. 提醒、奖励和计时应由用户控制。频繁自动推送可能增加羞耻、焦虑或通知疲劳，不能假定越多越好。
4. 神经多样性内部差异很大。同一功能必须允许关闭、跳过或降低刺激，避免按标签强制个性化。

## 本轮产品假设

| 假设 | 产品改动 | 需要观察 |
| --- | --- | --- |
| 首屏选项过多会增加启动成本 | 签到前置；协议默认只显示一个 | 首次操作耗时、放弃率 |
| “完成任务”承诺过大会阻碍开始 | ADHD 首页增加 5 分钟第一步 | 计时启动率、5 分钟后自主停止率 |
| 明确动词比抽象目标更易执行 | 输入提示要求写“打开/拿出/写下”等动作 | 输入是否足够具体 |
| 无惩罚的停止权能降低全或无压力 | 明示“可以停”，完成不要求计时归零 | 重复使用率、主观压力反馈 |
| 靠工作记忆保留下一步容易丢失 | 第一动作自动保留在本机 | 返回页面后的继续率 |

## ASD 交互方向

- 不把 ASD 与 ADHD 做成两套孤立产品。共享数据与协议底座，但首页支持模块、签到语义和过载路径分别设计。
- 过载或表达困难时，先提供环境与沟通选择，不要求用户解释原因或准确命名情绪。
- 显式提供减少动效和装饰的开关，保持导航、按钮位置与措辞稳定，变化提前说明。
- 用具体、字面的下一步替代隐喻式鼓励。避免把眼神接触、口语表达或“看起来平静”当作状态依据。
- ASD 与 ADHD 可共现。当前单选 `neuroType` 只是产品限制，后续应改为可组合画像，并以“此刻障碍”决定显示哪个模块。

社区近 30 天检索只获得低相关度样本，不能据此推出普遍偏好；其中较稳定的提醒是：低支持需求不等于没有功能损害，掩饰行为也会让外部观察低估困难。因此本轮不采用自动判断“用户看起来没事”的交互。

## 主要来源

- NICE NG87, *Attention deficit hyperactivity disorder: diagnosis and management*, Recommendations 1.7.2、1.7.4 及环境调整定义：https://www.nice.org.uk/guidance/ng87/chapter/recommendations
- Solanto et al. (2010), *Efficacy of meta-cognitive therapy for adult ADHD*, American Journal of Psychiatry：https://pubmed.ncbi.nlm.nih.gov/20231319/
- Abikoff et al. (2013), *Remediating organizational functioning in children with ADHD*：https://pubmed.ncbi.nlm.nih.gov/22889336/
- WCAG 2.2, 2.3.3 Animation from Interactions：https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- NICE CG142, *Autism spectrum disorder in adults: diagnosis and management*：https://www.nice.org.uk/guidance/cg142/chapter/Recommendations
- *A scoping review of inclusive and adaptive human-AI interaction design for neurodivergent users* (2026)：https://pubmed.ncbi.nlm.nih.gov/41223358/
- AASPIRE Healthcare Toolkit, communication and accommodations：https://autismandhealth.org/

## 下一轮研究

- 用 5-8 名成年 ADHD 用户做任务启动可用性测试，不以诊断标签替代行为观察。
- 分别测试“5 分钟”“2 分钟”和不显示时长，避免把倒计时变成压力源。
- 补充女性、晚诊断与合并焦虑/抑郁人群的研究，但在样本差异明确前不做性别化默认交互。
