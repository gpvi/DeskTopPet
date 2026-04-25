# 多 Agent 任务清单

本文档是当前唯一任务状态源。所有 Agent 领取、推进、阻塞、验收任务时都必须更新本文件。

## 1. 状态与更新规则

状态枚举：`todo`、`in_progress`、`blocked`、`review`、`done`。

更新要求：

- 开始任务：状态改为 `in_progress`，填写 `owner` 和 `最近更新`。
- 遇到阻塞：状态改为 `blocked`，在 `交付物/备注` 写清楚阻塞原因和需要谁处理。
- 完成实现：状态改为 `review`，写明代码、测试、文档证据。
- 验收完成：状态改为 `done`，必须有测试或人工验收证据。
- 并行开发：同一 `parallel_group` 内任务可并行；不同 Agent 不应同时修改同一文件区域。

## 2. Agent 分工建议

| Agent 类型 | 适合任务 | 不建议任务 |
| --- | --- | --- |
| Product Agent | 需求、验收标准、交互文案 | 深入改数据库和 Tauri 权限 |
| Architecture Agent | 分层边界、端口、依赖规则、类图 | 大量 UI 样式细节 |
| Frontend Agent | React UI、状态管理、动效、设置面板 | Rust/Tauri 插件配置 |
| Backend Agent | 用例、Repository、LLM Gateway、工具执行 | 视觉细节 |
| Tauri Agent | 权限、窗口、快捷键、自启动、系统工具 | 领域建模 |
| Test Agent | 单测、smoke、GUI 验收、回归矩阵 | 大范围重构 |
| Docs Agent | 文档同步、任务状态、验收证据 | 未经验证改任务为 done |

## 3. 开发任务

| 编号 | 任务名称 | 优先级 | 状态 | owner | parallel_group | depends_on | 最近更新 | 交付物/备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DEV001 | 工程初始化与目录骨架 | P0 | done | Claude Code | foundation | - | 2026-04-20 | Tauri + React + TypeScript 骨架 |
| DEV002 | 工程规范与基础配置 | P0 | done | Claude Code | foundation | DEV001 | 2026-04-20 | lint/format/tsconfig/目录约束 |
| DEV003 | 桌宠窗口壳层 | P0 | in_progress | Claude Code | frontend-shell | DEV001 | 2026-04-24 | 常驻、置顶、拖拽已具备；贴边待补齐 |
| DEV004 | 聊天面板 UI 骨架 | P0 | review | Claude Code | frontend-chat | DEV001 | 2026-04-21 | 聊天面板、输入框、消息列表待 GUI 复验 |
| DEV005 | 应用分层与依赖注入骨架 | P0 | done | Claude Code | architecture | DEV001 | 2026-04-20 | domain/application/interfaces/infrastructure |
| DEV006 | LLM 网关接口与 Provider 骨架 | P0 | done | Claude Code | llm | DEV005 | 2026-04-20 | 统一模型网关和 Provider 抽象 |
| DEV007 | 会话与消息存储 | P0 | review | Claude Code | persistence | DEV005 | 2026-04-21 | SQLite 表结构与 Repository |
| DEV008 | 用户消息处理主链路 | P0 | done | Claude Code | conversation | DEV004,DEV005,DEV006,DEV007 | 2026-04-20 | 聊天输入到回复输出 |
| DEV009 | 角色提示词接入 | P0 | done | Claude Code | llm | DEV006,DEV008 | 2026-04-20 | 系统提示词与运行时上下文 |
| DEV010 | 意图识别与任务分流 | P0 | done | Claude Code | conversation | DEV006,DEV008 | 2026-04-20 | 闲聊、问答、任务请求分流 |
| DEV011 | 工具执行接口层 | P0 | done | Claude Code | tools | DEV005 | 2026-04-20 | 网页/应用/文件夹/剪贴板端口 |
| DEV012 | 提醒系统基础能力 | P0 | done | Claude Code | productivity | DEV005,DEV007,DEV011 | 2026-04-20 | 提醒数据、调度、通知闭环 |
| DEV013 | 待办系统基础能力 | P0 | done | Claude Code | productivity | DEV005,DEV007 | 2026-04-20 | 待办增删改查 |
| DEV014 | 剪贴板总结/改写/翻译 | P0 | done | Claude Code | tools | DEV006,DEV010,DEV011 | 2026-04-20 | 剪贴板工具与模型能力 |
| DEV015 | 打开网页/应用/文件夹 | P0 | done | Claude Code | tools | DEV010,DEV011 | 2026-04-20 | MVP 工具调用闭环 |
| DEV016 | 设置中心基础版 | P1 | review | Codex | frontend-settings | DEV004,DEV007 | 2026-04-24 | 设置入口与持久化链路 |
| DEV017 | 记忆系统初版 | P1 | review | Codex | memory | DEV005,DEV006,DEV007 | 2026-04-21 | 显式记忆保存/回忆/清空 |
| DEV018 | 主动提醒与陪伴反馈 | P1 | review | Codex | companion | DEV009,DEV012,DEV017 | 2026-04-21 | 提醒与任务反馈文案策略 |
| DEV019 | Lottie 状态动画系统 | P1 | review | Codex | frontend-shell | DEV003,DEV004 | 2026-04-21 | 待机/思考/开心/提醒状态动画 |
| DEV020 | Token 统计与调用日志 | P1 | review | Codex | usage | DEV006,DEV007 | 2026-04-24 | 已通过 UsageTrackingLLMGateway 接入 completeChat/classifyIntent usage 记录；chat/intent/clipboard 请求携带 feature/session/task 上下文 |
| DEV021 | 用量面板基础版 | P2 | review | Codex | frontend-settings | DEV004,DEV020 | 2026-04-21 | 近 7 日调用与 tokens 概览 |
| DEV022 | 全局快捷键与唤起能力 | P1 | done | Codex | tauri-runtime | DEV003,DEV011 | 2026-04-24 | Tauri 全局快捷键 + Web 回退 |
| DEV023 | 开机启动与权限管理 | P1 | done | Codex | tauri-runtime | DEV003,DEV011,DEV016 | 2026-04-24 | 自启动与通知权限 |
| DEV024 | 异常处理与统一错误反馈 | P1 | review | Codex | conversation | DEV008,DEV010,DEV011 | 2026-04-21 | 用户错误映射策略 |
| DEV025 | 集成联调与 MVP 验收 | P0 | in_progress | Codex | release | DEV008,DEV012,DEV013,DEV014,DEV015,DEV019 | 2026-04-25 | 实机启动证据已归档到 `artifacts/TEST009-20260425-095841`；聊天/提醒/待办/剪贴板/工具人工点击仍待补 |
| DEV026 | 面板挂载与状态统一 | P0 | in_progress | Codex | frontend-shell | DEV003,DEV004,DEV008 | 2026-04-24 | 面板挂载已完成；状态源统一待收口 |
| DEV027 | SQLite 持久化落地 | P0 | review | Codex | persistence | DEV007 | 2026-04-21 | 基于 dbPath 的快照持久化 |
| DEV028 | 文档体系重整 | P1 | review | Codex | docs | DEV005 | 2026-04-24 | 统一需求、架构、类图、任务、验收文档 |
| DEV029 | 技术选型挑战与优化分析 | P1 | review | Codex | docs-architecture | DEV028 | 2026-04-24 | 形成选型矩阵、challenge 清单、优化路线 |

## 4. 测试任务

| 编号 | 任务名称 | 优先级 | 状态 | owner | parallel_group | depends_on | 最近更新 | 交付物/备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST001 | 测试基线搭建与门禁脚本 | P0 | done | Codex | quality | DEV002 | 2026-04-20 | Vitest/smoke/CI 基线 |
| TEST002 | 对话主链路行为测试 | P0 | done | Codex | quality | DEV008 | 2026-04-20 | 消息发送、异常兜底、落库 |
| TEST003 | 提醒调度行为测试 | P0 | review | Codex | quality-productivity | DEV012 | 2026-04-21 | 创建/触发/异常兜底 |
| TEST004 | 待办能力行为测试 | P0 | review | Codex | quality-productivity | DEV013 | 2026-04-21 | 创建/完成/删除与越权 |
| TEST005 | 剪贴板与工具调用测试 | P0 | review | Codex | quality-tools | DEV014,DEV015 | 2026-04-21 | 参数校验、失败提示、回退 |
| TEST006 | 设置与系统能力测试 | P1 | review | Codex | quality-tauri | DEV016,DEV022,DEV023 | 2026-04-24 | 设置落库、快捷键、自启动、通知 |
| TEST007 | 数据持久化与迁移测试 | P0 | review | Codex | quality-persistence | DEV027 | 2026-04-25 | 新增全迁移表快照重开与坏快照回退测试；database 持久化测试 4 passed，全量测试 46 passed |
| TEST008 | 用量统计与展示测试 | P1 | review | Codex | quality-usage | DEV020,DEV021 | 2026-04-24 | 新增 UsageTrackingLLMGateway 单测，覆盖 chat 和 intent usage save 字段；聚合和 GUI 面板仍待终验 |
| TEST009 | GUI 全链路终验与证据归档 | P0 | review | Codex | quality-release | DEV025 | 2026-04-25 | 实机 Tauri GUI 启动成功：`app.exe` 标题 `Agent 桌宠` 且 Responding=True，Vite HTTP 200，截图与证据见 `artifacts/TEST009-20260425-095841`；逐项人工点击仍待执行 |
| TEST010 | 跨平台系统能力验收 | P1 | todo | Tauri Agent | quality-tauri | DEV022,DEV023 | 2026-04-24 | 快捷键/自启动/通知权限跨平台 |
| TEST011 | 文档路径与 smoke 回归 | P1 | review | Docs Agent | quality-docs | DEV028 | 2026-04-24 | smoke 改为读取新任务与验收文档 |
| TEST012 | 技术优化决策复核 | P1 | todo | Architecture Agent | quality-architecture | DEV029 | 2026-04-24 | 复核选型 challenge 是否转成任务或接受风险 |

## 5. 缺陷修复任务

| 编号 | 任务名称 | 优先级 | 状态 | owner | parallel_group | depends_on | 最近更新 | 交付物/备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUG001 | 安全执行策略与高风险操作确认 | P0 | done | Codex | security | DEV010,DEV011,DEV015 | 2026-04-21 | 参数校验、白名单、二次确认 |
| BUG002 | 本地数据持久化安全加固 | P0 | review | Codex | security-persistence | DEV007,DEV017,DEV020,DEV027 | 2026-04-21 | 快照加密存储与恢复验证 |
| BUG003 | Lint 基线治理与 CI 门禁 | P1 | done | Codex | quality | DEV002 | 2026-04-21 | 0 error/0 warning |
| BUG004 | 提醒调度健壮性与生命周期收口 | P1 | review | Codex | productivity | DEV012,DEV018 | 2026-04-21 | 调度异常兜底 |
| BUG005 | 待办多用户约束与越权防护 | P1 | review | Codex | productivity | DEV013 | 2026-04-21 | userId 约束与影响行校验 |
| BUG006 | Lottie eval 告警治理 | P1 | done | Codex | frontend-shell | DEV019 | 2026-04-21 | 切换到 lottie_light |
| BUG007 | 本地密钥与快照安全升级 | P0 | in_progress | Codex | security-persistence | BUG002 | 2026-04-24 | 密钥迁移到系统安全存储 |
| BUG008 | Tauri GNU 运行链路收口 | P0 | done | Codex | tauri-runtime | DEV025 | 2026-04-24 | `tauri:dev` 自动探测 Windows 已安装 Rust target，`tauri:check:gnu` 通过 |
| BUG009 | 开发端口占用与并发启动治理 | P1 | in_progress | Codex | tauri-runtime | DEV025 | 2026-04-24 | 端口探测与冲突回退启动 |
| BUG010 | Smoke 脚本文档路径断链 | P1 | done | Codex | quality-docs | DEV025 | 2026-04-21 | 旧任务文档拆分后 smoke 恢复 |
| BUG011 | tauri-dev 启动链路留证收口 | P0 | done | Codex | tauri-runtime | BUG009 | 2026-04-25 | `npm run tauri:dev:gnu` 实机启动成功并归档 stdout/stderr、app 进程、HTTP、截图证据；测试结束后无近期 Tauri 残留进程 |
| BUG012 | TypeScript 6 构建配置修复 | P0 | done | Codex | quality | DEV002 | 2026-04-24 | 已修复 TypeScript 6 deprecation 配置、sql.js wasm 路径类型和 shortcut 动态 import 类型；`npm run build`、`npm run test:run` 通过 |
| BUG013 | Tauri 残留进程与热键重复注册治理 | P0 | review | Codex | tauri-runtime | BUG008,BUG009 | 2026-04-24 | 当前 `tauri:check:gnu` 已不再因文件占用失败；shortcut 注册改为安全读取 `isRegistered` 并在已注册时先注销，待 GUI/dev 长跑复验 |
| BUG014 | 技术栈版本与包管理策略收口 | P1 | done | Codex | foundation | DEV029 | 2026-04-24 | 已收口为 npm + package-lock；`packageManager` 改为 `npm@11.6.3`，AGENTS/CLAUDE/技术选型文档已同步 |

## 6. 推荐并行批次

| 批次 | 可并行任务 | 说明 |
| --- | --- | --- |
| Batch A | BUG012、TEST011、DEV028、DEV029 | 文档与构建配置，冲突面小 |
| Batch B | BUG008、BUG009、BUG013 | Tauri 运行链路，由同一 Tauri Agent 串行更稳 |
| Batch C | DEV020、TEST008 | usage 链路实现和验证，可由 Backend/Test 协作 |
| Batch D | TEST009、TEST010 | GUI 与跨平台验收，依赖运行链路稳定 |
| Batch E | DEV003、DEV026、DEV019 | 桌宠窗口和状态体验，需同一 Frontend Agent 协调 |
| Batch F | BUG014、TEST012 | 技术债和选型复核，适合 Architecture Agent 独立推进 |
