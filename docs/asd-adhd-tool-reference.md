# ASD / ADHD 辅助工具与可迁移设计参考

更新：2026-07-19

## 1. 文档用途

这份资料用于帮助产品、设计和开发团队理解市面上 ASD / ADHD 辅助工具正在解决什么问题，以及哪些机制适合迁移到 SyncSpace。

它不是竞品功能清单，也不表示被列出的产品具有诊断或治疗效果。迁移时应优先复用交互机制，不复制庞大的功能集合。

SyncSpace 当前目标仍是：

```text
预警 → 立即支持 → 理解 → 连接
```

面向用户的表达是：

```text
现在发生了什么 → 只做一件事 → 这个方法适合吗 → 是否需要表达需要
```

## 2. 证据等级

| 等级 | 含义 | 使用方式 |
| --- | --- | --- |
| A | 监管文件、随机对照试验、系统综述 | 可支持机制和风险边界，仍不能直接证明 SyncSpace 有效 |
| B | 产品官网、官方帮助文档、应用商店说明 | 可确认产品功能，不等于确认实际效果 |
| C | 用户社区、访谈、可用性研究 | 可提出产品假设，不能推广为所有 ASD / ADHD 用户的共同偏好 |
| D | 二手媒体、营销文章、未经核对的竞品总结 | 只能作为待验证线索，不进入产品事实或医疗表述 |

## 3. 总体市场观察

1. 市面上的产品大多只解决一个局部问题，例如时间可视化、任务启动、身体陪伴、AAC、变化预告或感官降载。
2. 很多用户的问题不是缺少功能，而是工具需要主动打开、录入和维护，最后形成“工具墓地”。
3. ADHD 工具最值得参考的是外部记忆、任务拆解、视觉时间、启动陪伴和无惩罚暂停。
4. ASD 工具最值得参考的是可预测性、低语言沟通、稳定布局、多种输入输出方式和感官调节。
5. ASD 和 ADHD 不应做成互斥的两套产品。共享数据和核心链路，以此刻障碍决定支持模块的排序。
6. 使用负担必须和帮助程度一起评估。一个理论上有效但需要大量维护的功能，仍可能产生负收益。

## 4. 视觉计划、时间感和任务启动

| 产品 | 已确认做法 | 对 SyncSpace 的启发 | 迁移边界 | 证据 |
| --- | --- | --- | --- | --- |
| Tiimo | 视觉时间轴、待办、专注计时、温和提醒、AI 拆解和重排 | 将脑内倾倒转成一个今天计划；只高亮当前动作和下一步 | 不复制完整日历；AI 估时需可修改 | [官网](https://www.tiimoapp.com/)、[FAQ](https://www.tiimoapp.com/faq)，B |
| Structured | 将日历、任务和收件箱合并到一条视觉时间轴；支持能量记录和多时间尺度视图 | 保留一个外部收件箱和一条今天时间轴 | 不把周、月、能量、周期等全部带回核心页 | [官网](https://structured.app/)、[4.0 设计说明](https://structured.app/blog/4-0)，B |
| Routinery | 逐步运行固定流程；支持计时、语音提示、暂停、跳过和调整 | 从“计划模式”进入“一次一步”的执行模式 | 倒计时和语音必须可关闭 | [官网](https://www.routinery.app/)、[产品比较说明](https://www.routinery.app/blog/best-routines-planner-apps)，B |
| Goblin Tools | Magic ToDo 拆解任务；Compiler 将脑内倾倒转为行动；Estimator 估时；Taskmaster 一次显示一个任务 | 输入大任务后最多给 3 个微步骤；允许“还是太大”继续拆第一步 | AI 不能代替行动，也不应自动排满日程 | [Magic ToDo](https://goblin.tools/ToDo)、[Compiler](https://goblin.tools/Compiler)、[Taskmaster](https://goblin.tools/Taskmaster)，B |
| Focusmate | 预约 25 / 50 / 75 分钟视频身体陪伴；开始前说目标，结束后确认 | 增加“陪我开始”的具体求助卡，优先邀请熟人 | 摄像头和陌生人可能增加社交负担 | [官网](https://www.focusmate.com/)，B |
| Due | 快速创建提醒；可持续重复提醒，直到完成、推迟或关闭 | 只允许高风险事项启用持续提醒 | 普通任务不能都持续催促 | [官网](https://www.dueapp.com/)，B |
| Time Timer | 用逐渐消失的色盘显示剩余时间；支持静音和自定义时间 | 提供可选视觉倒计时，不要求用户计算钟表 | 部分用户会产生计时焦虑；必须支持不计时和正向计时 | [官网](https://www.timetimer.com/)、[应用功能](https://support.timetimer.com/hc/en-us/articles/29258432418203-Time-Timer-App-Free-vs-Paid-Premium-Features)，B |
| one sec | 在打开高风险应用前加入呼吸、意图确认、延迟或阻断 | 只在容易失控的瞬间增加一点摩擦 | 必须允许绕过，避免惩罚式设计 | [官网](https://one-sec.app/)，B |

### 建议迁移的统一行动执行器

当前任务执行不应分散在多个组件中。建议统一为：

```text
任务输入
  ↓
最多 3 个微步骤
  ↓
只高亮第一步
  ↓
不计时 / 正向计时 / 视觉倒计时
  ↓
适合 / 没变化 / 不适合 / 使用本身有负担
```

对应文件：

- `src/components/today/ActionRunner.tsx`
- `src/components/today/FocusStartCard.tsx`
- `src/lib/difficultyPacks.ts`
- `src/lib/qwenService.ts`

## 5. 自我理解、教育和真人支持

| 产品 | 已确认做法 | 对 SyncSpace 的启发 | 迁移边界 | 证据 |
| --- | --- | --- | --- | --- |
| Inflow | 短篇 ADHD 心理教育、CBT 原则练习、日记、社区、身体陪伴和教练 | 一次解释一个现象，随后尝试一个生活动作 | 不把自测分型放回首次引导；社区和课程库不是近期核心 | [官方说明](https://www.getinflow.io/get-help)、[How it works](https://www.getinflow.io/how-it-works)，B |
| Shimmer | 真人 ADHD 教练、行动跟踪和反思；AI 用于辅助教练 | AI 总结已有记录，真人保留解释和关系工作 | 不让 AI 模拟治疗师或诊断者 | [真人教练说明](https://www.shimmer.care/flexible)、[AI 与教练边界](https://www.shimmer.care/blog/adhd-coaching-2-ai-launch)，B |
| Indy by Shimmer | 长期目标、每日和每周脚手架、模式反思 | 每周最多生成一个可编辑的模式假设 | 不演变为复杂人生规划器 | [官方介绍](https://www.shimmer.care/blog/indy-app-for-adhd-wellbeing)，B |
| Brain in Hand | 个性化策略库、计划、反思、教练和按需真人支持 | “先看自己的方法，仍解决不了再连接真人”；一键提出具体求助 | 真人服务需要运营和资金体系，近期只迁移求助卡机制 | [How it works](https://www.braininhand.co.uk/users/how-it-works/)、[应用说明](https://apps.apple.com/us/app/brain-in-hand/id607805378)，B |
| SAM | 记录压力、触发因素和应对方式，由自闭症人士共同参与设计 | 将记录变成“什么信号出现时，哪种支持更适合我” | 频繁自评本身可能增加压力 | [随机对照试验](https://journals.sagepub.com/doi/10.1177/13623613251346885)，A |

### SAM 的重要正反结果

SAM 在 214 名自闭症成人中进行了一个月随机对照试验：

- 感知压力、心理福祉和应对自信出现小幅改善；
- 每日使用依从率为 40.2%；
- 42.9% 的用户表示应用本身增加了压力。

因此，SyncSpace 的方法反馈必须同时记录：

```text
帮助程度 + 使用负担
```

不能只追求签到率、完成率或打开次数。

## 6. ASD 视觉支持、过渡和低语言沟通

| 产品 | 已确认做法 | 对 SyncSpace 的启发 | 迁移边界 | 证据 |
| --- | --- | --- | --- | --- |
| Choiceworks | 日程板、等待板、感受板；支持照片、文字、音频、视频和视觉计时 | 变化预告包含原计划、变化、不变、下一步和等待期间能做什么 | 原产品偏儿童和照护场景，需成人化语言和视觉 | [应用商店说明](https://apps.apple.com/us/app/choiceworks/id486210964)、[官网](https://www.beevisual.com/)，B |
| MagnusCards | 将登机、乘车、购物、洗衣等真实场景拆成步骤卡，由自闭症顾问参与反馈 | 为用户自己的高风险生活场景建立可预演步骤卡 | 不做大型模板市场 | [官网](https://www.magnusmode.com/)、[应用说明](https://apps.apple.com/us/app/magnuscards-life-skills-guide/id703031651)，B |
| Proloquo4Text | 面向能够打字但不能稳定依靠口语的人，提供文本转语音和常用短语 | 预存成人化需求短句；过载或 shutdown 时一键展示 | SyncSpace 不能自称 AAC，也不能替代专业评估 | [官网](https://www.assistiveware.com/products/proloquo4text)，B |
| TD Snap | 文字、符号、运动规划等页面集；支持触摸、眼控和开关操作 | 同一意图允许文字、图标、语音提纲和大字展示；保持按钮位置稳定 | 不自研完整 AAC 系统 | [官网](https://www.tobiidynavox.com/products/td-snap)，B |
| Aidova | 成人模式、需求与感受按钮、句子组合、视觉计时 | 使用成人化视觉语言，把“我需要什么”放在情绪解释之前 | 仍需真实 AAC 使用者参与测试 | [官网](https://www.aidova.app/)，B |

### 建议内置的低语言沟通卡

- 我现在说话比较困难，请用文字。
- 我需要十分钟不交流。
- 请不要碰我。
- 请只告诉我下一步。
- 请提醒一次，不要连续催。
- 我不是不在乎，我现在组织不出回复。
- 计划变化让我有点困难，请告诉我哪些部分不变。
- 我需要你陪我开始，不需要监督结果。

所有短句都必须允许用户预先修改。应用不能自动替用户声明情绪或严重程度。

## 7. 感官与环境支持

| 工具 | 已确认做法 | 对 SyncSpace 的启发 | 证据 |
| --- | --- | --- | --- |
| Loop Earplugs | 降低噪音，同时尽量保留对话可听性 | 感官预警后优先呈现用户确认过的实体工具 | [官方 ASD 页面](https://www.loopearplugs.com/en-at/pages/earplugs-for-autism)，B |
| 降噪耳机、帽子、墨镜、重量毯 | 降低声音、视觉或身体输入 | 建立用户自己的“感官急救包”和固定存放位置 | 用户自定义，C |
| 白板、便签、锁屏卡片 | 让提示持续存在于环境中 | 支持打印、桌面组件或锁屏展示，不要求主动打开应用 | 用户社区反馈，C |

数字 stimming 只能作为可选实验功能：

- 无闪烁；
- 无自动声音；
- 动画速度可调；
- 一键停止；
- 遵循系统减少动态效果设置；
- 不宣称可以缓解过载。

## 8. 即时奖励和产品语气

| 产品 | 可参考机制 | 不应复制 | 证据 |
| --- | --- | --- | --- |
| Finch | 完成一个小型自我照顾动作后立即获得温和反馈；允许跳过 | 复杂装饰、收集压力和连续签到 | [官方自我照顾说明](https://help.finchcare.com/hc/en-us/articles/37935669335309-Our-Approach-to-Self-Care)，B |
| Habitica | 用户明确喜欢游戏化时提供可选主题 | 扣血、断签、队友连带受罚 | 产品机制参考，B |
| Forest | 简单可视化专注反馈 | 用失去树木等损失厌恶强迫专注 | 产品机制参考，B |

SyncSpace 更适合使用“静默成就感”：

- 已经开始了第一步；
- 你发现了一个更适合自己的方法；
- 这次选择暂停，是在管理容量；
- 这个方法不适合你，已经记下来，下次可以少走一次弯路。

## 9. 手环、心率、噪音和音景的边界

设备信号只能作为待用户确认的线索：

```text
设备发现相对变化
  ↓
应用询问“这和你现在有关吗？”
  ↓
用户确认或否认
  ↓
应用呈现一个用户已经认可的支持
```

不要：

- 用心率直接判断焦虑或过载；
- 自动预测 meltdown；
- 自动播放声音；
- 自动进入低感官模式；
- 自动通知支持人；
- 保存不必要的原始生理数据。

Web / PWA 无法直接获得完整的 Apple Watch 实时心率和噪音能力。相关能力需要原生应用、HealthKit 或厂商 SDK，因此不应作为近期核心链路。

对应文件：

- `src/lib/wearableBridge.ts`
- `src/hooks/useWearableBridge.ts`
- `src/components/settings/WearableSettingsCard.tsx`
- `src/components/today/WearableSignalPrompt.tsx`

## 10. 数字疗法和医疗证据边界

| 资料 | 可支持的结论 | 不能推出的结论 | 证据 |
| --- | --- | --- | --- |
| EndeavorRx FDA 文件 | 存在针对 ADHD 的受监管数字疗法；此类产品需要明确适应证、剂量、临床研究和风险说明 | SyncSpace 具备治疗 ADHD 或改善注意力的效果 | [FDA De Novo 文件](https://www.accessdata.fda.gov/cdrh_docs/reviews/DEN200026.pdf)，A |
| ADHD 数字干预综述 | 部分数字干预机制有潜力，但成人证据有限且异质 | 普通生产力 App 可以治疗 ADHD | [2025 系统综述](https://pmc.ncbi.nlm.nih.gov/articles/PMC12016436/)，A |
| SAM 随机对照试验 | 某些自闭症成人可能从个性化压力监测中受益，同时应用也可能增加压力 | 所有 ASD 用户都应频繁打卡或追踪压力 | [论文](https://journals.sagepub.com/doi/10.1177/13623613251346885)，A |
| Brain in Hand 前瞻性队列 | 数字策略与真人支持的组合值得进一步研究 | 单独复制其 UI 就能获得同等结果 | [队列研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC10228225/)，A |

## 11. 真实用户讨论中的反信号

以下资料只用于提出可用性假设：

- [“收集了很多 ADHD 工具，但没有一个长期留下”](https://www.reddit.com/r/AdultADHDSupportGroup/comments/1tatcjd/i_collected_adhd_tools_the_way_some_people/)：提示订阅、维护和主动打开成本。
- [“从帮助计划转向帮助开始”](https://www.reddit.com/r/ADHD/comments/1rbxeyg/what_apps_have_helped_you_better_manage_your_life/)：提示启动支持比增加计划功能更重要。
- [AuDHD 用户寻找视觉清晰、可自动重排且不过度复杂的计划工具](https://www.reddit.com/r/AutisticWithADHD/comments/1jselm0/best_planningroutineproductivity_apps_for_audhd/)：提示 ASD 的可预测需求和 ADHD 的灵活需求需要同时满足。
- [AAC 用户同时使用 TD Snap、Proloquo4Text 和实体沟通卡](https://www.reddit.com/r/AACusers/comments/1uk9hod/what_devices_and_programs_do_people_use/)：提示不存在对所有情境都最好的单一沟通方式。

## 12. 最终迁移优先级

### P0：先完成核心闭环

| 改动 | 参考来源 | 验收标准 |
| --- | --- | --- |
| 首页一次只显示一个主任务 | Tiimo、Routinery、Goblin Taskmaster | 主区域最多一个问题、三个选择、一个主按钮 |
| 大任务拆成最多三个微步骤 | Goblin Tools、Inflow | 可继续拆第一步；AI 不可用时有本地兜底 |
| 合并计时入口 | Flowtime 机制、Time Timer | 不计时、正向计时、视觉倒计时使用同一执行器 |
| 成人化变化预告 | Choiceworks、MagnusCards | 显示原计划、变化、不变、下一步、退出方式 |
| 一键低语言沟通卡 | Proloquo4Text、TD Snap | 两次点击内生成可复制或大字展示的需求 |
| 同时记录帮助和负担 | SAM | 每次行动后最多一次轻量反馈 |
| 删除多步骤自我连接 | Brain in Hand 的即时支持原则 | 自我模式直接显示一张方法卡和一个执行按钮 |

### P1：有使用数据后再增加

- 每周一个可编辑的模式发现；
- 用户主动指定的高风险持续提醒；
- 熟人身体陪伴请求卡；
- 用户自定义感官工具箱；
- 能量与任务类型的弱提示；
- 系统日历、锁屏组件和原生设备接口。

### 暂不迁移

- 完整社区；
- 陌生人身体陪伴匹配；
- 真人教练市场；
- 完整日历和项目管理器；
- 关系温度和自动社交提醒；
- 自动情绪或过载判断；
- 完整 AAC；
- 数字疗法和治疗宣称；
- 连续签到、排行榜和复杂游戏经济；
- 自动自适应音景。

## 13. 附件调研中需谨慎使用的结论

以下方向可以保留为设计线索，但当前资料不足以当作已验证事实：

| 原结论 | 处理方式 |
| --- | --- |
| “Inflow 是全球用户最多的 ADHD App” | 未找到足够依据，不写入产品事实 |
| “自测结果应直接驱动协议排序” | 不采用；会重新引入诊断感和首次使用负担 |
| “目前没有任何 ASD / ADHD App 做手环联动” | 过于绝对，不作为市场结论 |
| “Apple Watch 噪音 API 可以直接接入 Web 版” | 不成立；需要原生能力和用户授权 |
| “心率升高后自动切换舒缓音景” | 不采用；心率不能直接代表焦虑，声音也可能增加过载 |
| “视觉日程卡不适合成人” | 不成立；问题是儿童化呈现，不是视觉支持本身 |
| “数字 stimming 是高优先级缺口” | 降级为可选实验；先验证安全性和真实需求 |
| “关系维护提醒适合连接页” | 默认不采用；可能制造愧疚和社交债务 |

## 14. 产品验证指标

不要只统计打开次数和完成数。建议跟踪：

1. 从打开应用到开始第一个动作的时间；
2. 快速捕获后重新浮现并开始处理的比例；
3. 错过高风险事项的次数；
4. 变化预告是否降低临时退出或求助成本；
5. 低语言沟通卡是否成功表达了用户原意；
6. 过载后的主观恢复时间；
7. 每种方法的帮助程度；
8. 每种方法的使用负担；
9. 提醒疲劳、羞耻感和应用造成的压力；
10. 停止使用是因为不再需要、忘记打开，还是使用本身太累。

## 15. 相关规范与基础资料

- [NICE NG87：ADHD diagnosis and management](https://www.nice.org.uk/guidance/ng87/chapter/recommendations)
- [NICE CG142：Autism spectrum disorder in adults](https://www.nice.org.uk/guidance/cg142/chapter/Recommendations)
- [WCAG 2.2：Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [AASPIRE Healthcare Toolkit：沟通和合理便利](https://autismandhealth.org/)
- [成人 AAC 的社会与技术设计研究](https://arxiv.org/abs/2404.17730)
- [ADHD 数字 CBT 应用系统综述](https://pmc.ncbi.nlm.nih.gov/articles/PMC12436941/)
- [ADHD 数字干预安全性与有效性综述](https://pmc.ncbi.nlm.nih.gov/articles/PMC12016436/)
- [SAM 成人 ASD 随机对照试验](https://journals.sagepub.com/doi/10.1177/13623613251346885)

## 16. 团队使用原则

1. 一个时刻只帮助一件事。
2. 先帮助行动，再邀请理解。
3. 每个动作都允许暂停、跳过和退出。
4. 不把忘记、拖延和过载解释成意志力失败。
5. ASD 与 ADHD 共享基础流程，支持模块可以并行开启。
6. 设备和 AI 只能提供待确认线索。
7. 用户拥有最终解释权。
8. 应用造成的负担和应用产生的帮助同等重要。
9. 不使用连续签到、完成率和排行榜制造压力。
10. 最终目标不是增加对应用的依赖，而是形成可以迁移到生活中的个人支持方法。
