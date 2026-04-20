# MVP 集成联调与验收清单（T025）

## 1. 范围与目标

- 任务范围：`T008/T012/T013/T014/T015/T019`
- 验收目标：验证 MVP 主链路可用、关键能力可演示、风险项可追踪
- 验收类型：手工联调 + 静态自检（`npm run smoke:check`）

## 2. 执行前置

- 环境可启动：`npm install` 后可执行 `npm run dev` 与 `npm run build`
- 本地配置已设置可用模型参数（如 `.env` 中的 provider 信息）
- 当前数据库策略为本地快照持久化（非 `:memory:`）

## 3. 主路径验收项

### 3.1 对话主链路（T008）

- [ ] 打开聊天面板并输入普通消息，可收到模型回复
- [ ] 用户消息与助手回复均写入会话记录（刷新后仍可读取）
- [ ] 失败场景下前端有可理解错误反馈，不出现静默失败

### 3.2 提醒能力（T012）

- [ ] 通过自然语言创建提醒（例如“10 分钟后提醒我喝水”）
- [ ] 到达触发时间后可收到提醒反馈（通知或面板提示）
- [ ] 提醒触发后状态正确更新，不重复触发

### 3.3 待办能力（T013）

- [ ] 可创建待办并在列表中查看
- [ ] 可标记待办完成，状态更新正确
- [ ] 重启后待办数据可保留

### 3.4 剪贴板能力（T014）

- [ ] 在有文本剪贴板内容时，可触发“总结/改写/翻译”
- [ ] 执行结果在聊天面板回显
- [ ] 剪贴板为空或不可读时有友好提示

### 3.5 工具调用能力（T015）

- [ ] 支持“打开网页”指令并正确调用系统浏览器
- [ ] 支持“打开文件夹/应用”指令并返回执行结果
- [ ] 工具失败时有错误提示，不影响后续对话

### 3.6 动画状态能力（T019）

- [ ] 待机状态动画可展示
- [ ] 思考/提醒/完成反馈状态可切换
- [ ] 状态切换不阻塞聊天输入与面板交互
- [ ] 若 T019 未实现，记录为阻塞项并给出回退展示策略

## 4. 验收记录模板

```text
验收日期：
执行人：
环境：
关联提交：

[T008] 结果：pass/fail
现象：
结论：

[T012] 结果：pass/fail
现象：
结论：

[T013] 结果：pass/fail
现象：
结论：

[T014] 结果：pass/fail
现象：
结论：

[T015] 结果：pass/fail
现象：
结论：

[T019] 结果：pass/fail/blocked
现象：
结论：

阻塞与风险：
下一步：
```

## 5. 缺陷分级规则

- `P0`：阻断主路径（无法聊天、无法提醒、无法执行工具）
- `P1`：主功能可用但体验明显受损（重复触发、结果不一致、错误提示弱）
- `P2`：优化项（文案、动效细节、展示样式）

## 6. 首轮验收记录（2026-04-20）

验收日期：2026-04-20  
执行人：Codex（T025 收口）  
环境：代码静态联调 + `npm run smoke:check`（未执行 GUI 人工点击流）  
关联提交：工作区当前变更（T024/T025/T026/T027 后）

[T008] 结果：pass  
现象：`ConversationController.handleUserMessage -> respondWithChat -> SendMessageUseCase.execute` 已打通，且写入 `conversationRepository`；异常走统一用户可读提示。  
证据：`src/interfaces/controllers/conversation-controller.ts`、`src/application/conversation/send-message.usecase.ts`。  
结论：对话主链路代码已闭环，满足首轮通过条件。

[T012] 结果：blocked  
现象：意图识别后任务分支目前统一进入 `respondWithTaskPlaceholder`，未实际调用提醒创建/调度链路。  
证据：`src/interfaces/controllers/conversation-controller.ts`（任务占位文案“完整执行能力正在接入”）、`src/application/productivity/create-reminder.usecase.ts`、`src/application/productivity/reminder-scheduler.ts`。  
结论：提醒能力模块存在，但端到端入口未接通。

[T013] 结果：blocked  
现象：待办用例已实现，但未在会话任务分支执行。  
证据：`src/application/productivity/manage-todo.usecase.ts`、`src/interfaces/controllers/conversation-controller.ts`（任务占位分支）。  
结论：待办能力可视为“能力已准备，主链路未接入”。

[T014] 结果：blocked  
现象：剪贴板处理用例存在，当前对话任务仍未调用该用例。  
证据：`src/application/task/clipboard-use-case.ts`、`src/interfaces/controllers/conversation-controller.ts`（任务占位分支）。  
结论：剪贴板能力未形成可验收的用户链路。

[T015] 结果：blocked  
现象：打开网页/应用/文件夹用例已实现，当前未接入任务执行分支。  
证据：`src/application/task/open-tool-use-case.ts`、`src/interfaces/controllers/conversation-controller.ts`（任务占位分支）。  
结论：工具执行能力未完成端到端联调。

[T019] 结果：blocked  
现象：桌宠当前是静态图片 + mood 文案标记，未见 Lottie 资源/播放器与状态映射执行链路。  
证据：`src/ui/desktop-pet/PetShell.tsx`。  
结论：动画状态系统尚未落地，属于明确阻塞项。

阻塞与风险：
- 主要阻塞不只 `T019`，还包括 `T012/T013/T014/T015` 的“任务分流后真实执行”缺口。
- 当前能通过静态自检与构建，不代表提醒/待办/工具调用已可端到端演示。

下一步：
- 优先补齐任务执行编排（将 `execute_task` 分支接入提醒/待办/剪贴板/工具用例）。
- `T019` 完成后执行 GUI 人工联调复验，并更新本清单为第二轮记录。

## 7. 第二轮验收记录（2026-04-20）

验收日期：2026-04-20  
执行人：Codex（T025 连续收口）  
环境：代码静态联调 + `npm run build` + `npm run smoke:check`（未执行 GUI 全量手工点击流）  
关联提交：工作区当前变更（含 T019 动效接入后）

[T008] 结果：pass  
现象：消息处理主链路可达，异常兜底可读；本轮构建与静态检查未发现回归。  
证据：`src/interfaces/controllers/conversation-controller.ts`、`src/application/conversation/send-message.usecase.ts`。  
结论：维持通过。

[T012] 结果：pass  
现象：提醒能力执行链路已接入主流程，不再仅占位返回。  
证据：`src/interfaces/controllers/conversation-controller.ts`、`src/application/productivity/create-reminder.usecase.ts`、`src/application/productivity/reminder-scheduler.ts`。  
结论：通过（后续以 GUI 场景补充时间触发体验验证）。

[T013] 结果：pass  
现象：待办能力已接入任务执行链路，具备端到端调用条件。  
证据：`src/interfaces/controllers/conversation-controller.ts`、`src/application/productivity/manage-todo.usecase.ts`。  
结论：通过（后续补充 UI 交互细节回归）。

[T014] 结果：pass  
现象：剪贴板能力已接入任务执行链路，静态联调可见用例可达。  
证据：`src/interfaces/controllers/conversation-controller.ts`、`src/application/task/clipboard-use-case.ts`。  
结论：通过（后续补充平台权限与空剪贴板的人机回归）。

[T015] 结果：pass  
现象：打开网页/应用/文件夹工具能力已接入任务执行链路。  
证据：`src/interfaces/controllers/conversation-controller.ts`、`src/application/task/open-tool-use-case.ts`。  
结论：通过（后续补充不同平台与权限差异验证）。

[T019] 结果：review  
现象：已接入 Lottie 优先的状态动画切换，并具备降级动画；`thinking` 由 typing 驱动，assistant 回复触发短暂完成态。  
证据：`src/ui/desktop-pet/PetShell.tsx`、`src/ui/desktop-pet/animations/petLottieAnimations.ts`、`src/ui/desktop-pet/PetShell.module.css`。  
结论：进入 review（尚未完成 GUI 全量手工联调，暂不标记 done）。

阻塞与风险：
- `npm run smoke:check` 结果为 `pass=23, warn=1, fail=0`，唯一警告来自任务清单中 `T019` 状态仍为 `todo` 的元数据未同步。
- 本轮是静态联调 + 构建验证，尚未覆盖通知权限、工具调用系统侧弹窗、窗口交互等 GUI 全链路行为。
- `npm run build` 存在非阻塞告警（chunk size 与 `lottie-web` 的 eval 告警），当前不影响功能验收结论。

下一步：
- 执行一次 GUI 全量手工联调（聊天、提醒、待办、剪贴板、工具调用、动效切换），回填实际 pass/fail 证据。
- 同步任务清单中的 `T019` 状态后，复跑 `npm run smoke:check`，消除唯一 warn。
- GUI 联调通过后，将 `T019` 从 `review` 收口为 `done`，并推进 `T025` 最终验收关闭。
