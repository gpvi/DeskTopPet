# Agent 桌宠多 Agent 协作任务清单

## 1. 文档目的

本文用于将当前已确认的产品需求、技术选型与整洁架构方案拆解为可执行任务，并建立统一的任务描述与状态追踪格式，方便多个 Agent 或多人协作并行开发。

适用场景：

- 研发排期
- 多 Agent 并行分工
- 模块边界划分
- 进度追踪
- 交付验收

## 2. 使用规则

### 2.1 状态定义

所有任务统一使用以下状态：

- `todo`：尚未开始
- `in_progress`：正在进行
- `blocked`：被依赖或风险阻塞
- `review`：已完成开发，等待评审或联调
- `done`：已验收完成

### 2.2 优先级定义

- `P0`：MVP 主路径，必须优先完成
- `P1`：MVP 增强能力，建议第一阶段后尽快完成
- `P2`：优化项或扩展项，可顺延

### 2.3 负责人字段

每个任务保留以下字段：

- `owner`：当前主负责 Agent / 开发者
- `support`：配合者，可为空
- `depends_on`：前置依赖任务编号
- `deliverable`：交付物

### 2.4 多 Agent 协作约束

为避免冲突，协作时建议遵守：

- 每个 Agent 只拥有清晰的模块写入范围
- 共享接口先定协议，再并行实现
- 先完成骨架和接口，再补具体实现
- 跨模块改动必须回写到本任务清单
- 同一文件尽量只由一个 Agent 在同一时段负责

### 2.5 Git 保存规则

项目开发过程中要求在合适的进度点进行 Git 保存，避免长时间堆积未提交改动。

建议触发条件：

- 完成一个独立任务或子任务闭环时提交一次
- 完成可运行骨架、可联调接口、可演示页面等阶段性成果时提交一次
- 进行跨模块重构前先提交一次
- 进入联调、验收、风险修改前先提交一次
- 修复关键问题后立即提交一次

不建议的做法：

- 累积多个不相关任务后一次性提交
- 在明显不可运行、不可回退的中间态长期不提交
- 不更新任务状态就直接提交大批改动

提交前最小检查：

- 对应任务状态已更新
- 变更范围与任务编号能对应
- 关键文件已自检
- 明显临时文件未被纳入版本库

提交信息建议格式：

- `feat(T008): 打通用户消息处理主链路`
- `refactor(T005): 调整应用分层与依赖注入骨架`
- `fix(T012): 修复提醒调度重复触发问题`
- `docs(T000): 更新多 Agent 协作任务清单`

若一个阶段包含多个紧密关联的小任务，可以合并为一个阶段性提交，但提交说明中应列出覆盖的任务编号。

## 3. 任务总览

| 编号 | 任务名称 | 优先级 | 状态 | owner | depends_on | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| T001 | 工程初始化与目录骨架 | P0 | done | Claude Code | - | 初始化 Tauri + React + TypeScript 项目骨架 |
| T002 | 工程规范与基础配置 | P0 | done | Claude Code | T001 | 配置 lint、format、tsconfig、目录约束 |
| T003 | 桌宠窗口壳层 | P0 | review | Claude Code | T001 | 实现常驻窗口、置顶、拖拽、贴边基础能力 |
| T004 | 聊天面板 UI 骨架 | P0 | review | Claude Code | T001 | 聊天面板、输入框、消息列表、快捷入口 |
| T005 | 应用分层与依赖注入骨架 | P0 | done | Claude Code | T001 | 建立 domain/application/interfaces/infrastructure 分层 |
| T006 | LLM 网关接口与 Provider 骨架 | P0 | done | Claude Code | T005 | 定义统一模型网关和 Provider 抽象 |
| T007 | 会话与消息存储 | P0 | review | Claude Code | T005 | SQLite 表结构与 Repository 初版 |
| T008 | 用户消息处理主链路 | P0 | done | Claude Code | T004,T005,T006,T007 | 打通聊天输入到回复输出 |
| T009 | 角色提示词接入 | P0 | done | Claude Code | T006,T008 | 接入系统提示词与运行时上下文 |
| T010 | 意图识别与任务分流 | P0 | done | Claude Code | T006,T008 | 区分闲聊、问答、任务请求 |
| T011 | 工具执行接口层 | P0 | done | Claude Code | T005 | 封装网页、应用、文件夹、剪贴板等工具接口 |
| T012 | 提醒系统基础能力 | P0 | done | Claude Code | T005,T007,T011 | 提醒数据、调度、通知闭环 |
| T013 | 待办系统基础能力 | P0 | done | Claude Code | T005,T007 | 待办增删改查与展示 |
| T014 | 剪贴板总结/改写/翻译 | P0 | done | Claude Code | T006,T010,T011 | 打通剪贴板工具与模型能力 |
| T015 | 打开网页/应用/文件夹 | P0 | done | Claude Code | T010,T011 | 完成 MVP 工具调用闭环 |
| T016 | 设置中心基础版 | P1 | review | Codex | T004,T007 | 已补设置入口与持久化链路，待交互联调验收 |
| T017 | 记忆系统初版 | P1 | review | Codex | T005,T006,T007 | 已接入显式记忆保存/回忆/清空命令，待体验验收 |
| T018 | 主动提醒与陪伴反馈 | P1 | review | Codex | T009,T012,T017 | 已接入提醒与任务完成反馈文案策略，待提醒触发联调 |
| T019 | Lottie 状态动画系统 | P1 | review | Codex + Worker-Russell | T003,T004 | 已接入 Lottie 待机/思考/开心/提醒状态切换，待 GUI 联调验收 |
| T020 | Token 统计与调用日志 | P1 | review | Codex | T006,T007 | 已接入聊天链路 usage 写入，待统计视图联调 |
| T021 | 用量面板基础版 | P2 | review | Codex | T004,T020 | 设置面板已展示近 7 天调用/输入/输出用量概览 |
| T022 | 全局快捷键与唤起能力 | P1 | review | Codex | T003,T011 | 已接入全局快捷键唤起（Tauri + Web 回退），待端到端验证 |
| T023 | 开机启动与权限管理 | P1 | review | Codex | T003,T011,T016 | 已接入设置驱动的自启动与通知权限应用，待系统侧验收 |
| T024 | 异常处理与统一错误反馈 | P1 | review | Codex + Worker-Aquinas | T008,T010,T011 | 已接入统一用户错误映射策略，待端到端异常场景回归 |
| T025 | 集成联调与 MVP 验收 | P0 | in_progress | Codex | T008,T012,T013,T014,T015,T019 | T019 已落地，当前以 GUI 人工联调与验收记录回填为主 |
| T026 | 面板挂载与状态统一 | P0 | review | Codex + Worker-Mendel | T003,T004,T008 | 已完成面板挂载与聊天状态源统一，待联调验收 |
| T027 | SQLite 持久化落地 | P0 | review | Codex + Worker-Descartes | T007 | 已完成基于 dbPath+localStorage 的持久化策略，待重启验证与容量评估 |
| T028 | 安全执行策略与高风险操作确认 | P0 | todo | Codex | T010,T011,T015 | 为应用/文件夹打开能力增加白名单、参数校验、二次确认 |
| T029 | 本地数据持久化安全加固 | P0 | todo | Codex | T007,T017,T020,T027 | 评估并落地敏感数据加密或安全存储替代 localStorage 明文快照 |
| T030 | Lint 基线治理与 CI 门禁 | P1 | review | Codex | T002 | 已收敛至 0 error/0 warning，待 CI 门禁策略联调后转 done |
| T031 | 提醒调度健壮性与生命周期收口 | P1 | todo | Codex | T012,T018 | 处理定时任务异步异常、重复触发与控制器销毁时 stop |
| T032 | 待办多用户约束与越权防护 | P1 | todo | Codex | T013 | 完成/删除待办需携带 userId 约束并校验影响行数 |
| T033 | 单元测试体系扩展与行为级 smoke | P1 | in_progress | Codex + Worker-Ramanujan | T025 | 已接入 Vitest 与 7 个用例，下一步覆盖 controller/task 关键行为 |

## 4. 任务详细说明

### T001 工程初始化与目录骨架

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：-
- `write_scope`：项目根目录、Tauri 初始化文件、前端入口目录
- `deliverable`：
  - 可运行的 Tauri + React + TypeScript 工程
  - 初始目录结构
  - 开发启动命令
- `description`：
  - 初始化桌面工程基础骨架
  - 建立前端入口、Tauri 宿主和基础脚本
  - 为后续模块开发提供稳定运行环境

### T002 工程规范与基础配置

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T001
- `write_scope`：格式化配置、lint 配置、tsconfig、package scripts
- `deliverable`：
  - 统一代码风格配置
  - 路径别名和模块边界约束
  - 基础命令脚本
- `description`：
  - 建立 TypeScript、Lint、格式化和工程脚本
  - 约束目录依赖方向，避免早期结构失控

### T003 桌宠窗口壳层

- `priority`：P0
- `status`：review
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T001
- `write_scope`：Tauri 窗口配置、窗口管理适配层、桌宠壳层 UI
- `deliverable`：
  - 常驻桌宠窗口
  - 置顶、拖拽、基础贴边
  - 点击唤起聊天面板
- `description`：
  - 建立桌宠最基础的桌面存在感
  - 提供 MVP 可演示的壳层体验

### T004 聊天面板 UI 骨架

- `priority`：P0
- `status`：review
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T001
- `write_scope`：聊天面板、消息列表、输入区、快捷操作组件
- `deliverable`：
  - 可展示的聊天面板
  - 用户输入框
  - 消息列表和基础交互态
- `description`：
  - 构建所有主链路共用的对话界面
  - 为后续接入消息处理、任务确认和反馈展示做准备

### T005 应用分层与依赖注入骨架

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T001
- `write_scope`：src 主目录结构、接口定义、组合根
- `deliverable`：
  - Clean Architecture 目录结构
  - 基础 Port / Adapter 接口
  - 依赖注入入口
- `description`：
  - 落地整洁架构的工程骨架
  - 为多模块并行开发提供稳定边界

### T006 LLM 网关接口与 Provider 骨架

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T005
- `write_scope`：模型网关、Provider 抽象、请求响应 DTO
- `deliverable`：
  - `LLM Gateway` 接口
  - 至少一个 Provider 骨架
  - 模型调用统一入参和出参
- `description`：
  - 把模型平台差异收口在基础设施层
  - 为聊天、意图识别、文案生成提供统一能力入口

### T007 会话与消息存储

- `priority`：P0
- `status`：review
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T005
- `write_scope`：SQLite schema、会话仓储、消息仓储
- `deliverable`：
  - 会话和消息相关数据表
  - Repository 接口与实现
  - 基础读写链路
- `description`：
  - 支撑聊天历史、上下文、后续记忆提炼和日志追踪

### T008 用户消息处理主链路

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T004,T005,T006,T007
- `write_scope`：消息控制器、消息处理用例、Presenter
- `deliverable`：
  - 用户输入后获得模型回复
  - 消息写入会话
  - 基础错误反馈
- `description`：
  - 打通最核心的 MVP 链路
  - 这是所有后续任务能力的入口

### T009 角色提示词接入

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T006,T008
- `write_scope`：Prompt 组装器、角色上下文注入
- `deliverable`：
  - 系统提示词接入
  - 运行时变量注入
  - 角色语气一致性基础实现
- `description`：
  - 确保桌宠表达稳定，不因后续工具接入破坏角色感

### T010 意图识别与任务分流

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T006,T008
- `write_scope`：意图分类用例、任务分流路由
- `deliverable`：
  - 闲聊与任务分流
  - 任务类型枚举
  - 参数提取初版
- `description`：
  - 让系统知道什么时候聊天，什么时候执行任务

### T011 工具执行接口层

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T005
- `write_scope`：工具执行 Port、Tauri/Rust Adapter、权限边界
- `deliverable`：
  - 打开网页接口
  - 打开文件夹接口
  - 打开应用接口
  - 读取剪贴板接口
- `description`：
  - 封装所有 MVP 本地能力
  - 为工具调用、确认和日志提供统一边界

### T012 提醒系统基础能力

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T005,T007,T011
- `write_scope`：提醒表、提醒用例、调度器、通知适配
- `deliverable`：
  - 创建提醒
  - 本地调度触发
  - 系统通知反馈
- `description`：
  - 支撑核心使用场景中的喝水提醒、休息提醒、定时提醒

### T013 待办系统基础能力

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T005,T007
- `write_scope`：待办表、待办用例、基础 UI 绑定
- `deliverable`：
  - 创建待办
  - 查看待办
  - 完成待办
- `description`：
  - 支撑高频轻任务场景，形成除聊天外的明确价值点

### T014 剪贴板总结/改写/翻译

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T006,T010,T011
- `write_scope`：剪贴板工具用例、结果反馈展示
- `deliverable`：
  - 读取剪贴板内容
  - 总结/改写/翻译三类能力
  - 结果回显
- `description`：
  - 提供立即可感知的效率价值，是 MVP 关键任务能力之一

### T015 打开网页/应用/文件夹

- `priority`：P0
- `status`：done
- `owner`：Claude Code
- `support`：待分配
- `depends_on`：T010,T011
- `write_scope`：工具调用用例、确认逻辑、结果提示
- `deliverable`：
  - 网页打开
  - 应用打开
  - 文件夹打开
- `description`：
  - 提供桌面 Agent 最直观的执行能力

### T016 设置中心基础版

- `priority`：P1
- `status`：review
- `owner`：Codex
- `support`：待分配
- `depends_on`：T004,T007
- `write_scope`：设置页 UI、配置存储、设置用例
- `deliverable`：
  - 提醒开关
  - 记忆与隐私设置
  - 角色名称和基础偏好设置
- `description`：
  - 为用户提供“可控感”，降低对主动行为的排斥
  - 最新进展：聊天面板头部已增加设置入口，设置面板可直接打开并持久化开关值

### T017 记忆系统初版

- `priority`：P1
- `status`：review
- `owner`：Codex
- `support`：待分配
- `depends_on`：T005,T006,T007
- `write_scope`：记忆实体、记忆仓储、显式记忆用例
- `deliverable`：
  - 显式记忆写入
  - 记忆读取
  - 记忆删除/清空
- `description`：
  - 支撑持续陪伴体验和个性化任务服务
  - 最新进展：已接入“记住/回忆/清空记忆”显式命令，并受 `memory_enabled` 设置开关控制

### T018 主动提醒与陪伴反馈

- `priority`：P1
- `status`：review
- `owner`：Codex
- `support`：待分配
- `depends_on`：T009,T012,T017
- `write_scope`：提醒文案生成、完成反馈文案、主动度策略
- `deliverable`：
  - 低打扰提醒文案
  - 任务完成鼓励反馈
  - 基础主动策略配置
- `description`：
  - 将“工具可用”提升为“陪伴 + 工具”的联合体验
  - 最新进展：已新增陪伴文案生成器，并接入提醒触发文案与任务完成反馈文案

### T019 Lottie 状态动画系统

- `priority`：P1
- `status`：review
- `owner`：Codex + Worker-Russell
- `support`：待分配
- `depends_on`：T003,T004
- `write_scope`：动画资源接入、状态映射、展示组件
- `deliverable`：
  - 待机动画
  - 思考动画
  - 提醒动画
  - 开心反馈动画
- `description`：
  - 提升桌宠存在感与反馈清晰度
  - 最新进展：已接入 Lottie 待机/思考/开心/提醒状态切换，待 GUI 联调验收

### T020 Token 统计与调用日志

- `priority`：P1
- `status`：review
- `owner`：Codex
- `support`：待分配
- `depends_on`：T006,T007
- `write_scope`：调用日志表、Token 记录用例、聚合查询
- `deliverable`：
  - 模型调用记录
  - Token 存储
  - 成本估算字段
- `description`：
  - 为后续成本控制、用户用量展示和运营分析提供基础
  - 最新进展：聊天回复链路已写入 usage 记录（provider/model/inputTokens/outputTokens）

### T021 用量面板基础版

- `priority`：P2
- `status`：review
- `owner`：Codex
- `support`：待分配
- `depends_on`：T004,T020
- `write_scope`：用量面板 UI、聚合查询展示
- `deliverable`：
  - 近 7 日或 30 日趋势图
  - 模型消耗概览
- `description`：
  - 为设置中心补充透明的模型使用信息
  - 最新进展：设置面板新增近 7 天 usage 概览（调用次数、输入 tokens、输出 tokens）

### T022 全局快捷键与唤起能力

- `priority`：P1
- `status`：review
- `owner`：Codex
- `support`：待分配
- `depends_on`：T003,T011
- `write_scope`：快捷键注册、窗口唤起、设置绑定
- `deliverable`：
  - 全局快捷键
  - 快速唤起聊天面板
- `description`：
  - 降低交互入口成本，强化常驻助手价值
  - 最新进展：已新增快捷键管理器，支持 Tauri 全局快捷键与 Web 回退快捷键（Ctrl/Cmd+Shift+P）

### T023 开机启动与权限管理

- `priority`：P1
- `status`：review
- `owner`：Codex
- `support`：待分配
- `depends_on`：T003,T011,T016
- `write_scope`：启动项适配、权限检查、授权提示逻辑
- `deliverable`：
  - 自启动开关
  - 权限状态检查
  - 用户授权引导
- `description`：
  - 增强常驻产品基础体验，同时保持用户可控
  - 最新进展：设置开关变化会触发系统偏好同步（auto_start、notification 权限申请）

### T024 异常处理与统一错误反馈

- `priority`：P1
- `status`：review
- `owner`：Codex + Worker-Aquinas
- `support`：待分配
- `depends_on`：T008,T010,T011
- `write_scope`：错误模型、错误提示组件、失败兜底策略
- `deliverable`：
  - 统一错误码或错误类型
  - 用户可理解的失败提示
  - 工具失败兜底反馈
- `description`：
  - 保证 Agent 不稳定时仍然可用、可信
  - 最新进展：已统一错误映射（LLMGatewayError/RepositoryError/ToolExecutionError/unknown）并接入会话控制器用户提示

### T025 集成联调与 MVP 验收

- `priority`：P0
- `status`：in_progress
- `owner`：Codex
- `support`：待分配
- `depends_on`：T008,T012,T013,T014,T015,T019
- `write_scope`：联调用例、验收记录、问题清单
- `deliverable`：
  - MVP 主链路联调通过
  - 核心能力验收记录
  - 缺陷清单与修复优先级
- `description`：
  - 验证产品是否满足 MVP 核心目标，并形成下一阶段改进输入
  - 最新进展：已新增 `docs/验收清单-MVP.md`，并提供 `npm run smoke:check` 静态联调自检脚本
  - 首轮验收结论：`T008=pass`；`T012/T013/T014/T015/T019=blocked`
  - 当前状态说明：`T019` 已落地，剩余以 GUI 人工联调为主

### T026 面板挂载与状态统一

- `priority`：P0
- `status`：review
- `owner`：Codex + Worker-Mendel
- `support`：待分配
- `depends_on`：T003,T004,T008
- `write_scope`：App 根组件挂载、聊天面板/设置面板显示逻辑、store 状态源
- `deliverable`：
  - ChatPanel 实际可见且可打开/关闭
  - 点击桌宠可打开聊天面板
  - SettingsPanel 实际可见且有打开入口
  - 面板开关状态源唯一且一致
- `description`：
  - 当前存在聊天面板开关状态多 store 不一致，以及 App 未挂载面板的问题
  - 该任务用于收口 UI 联调，使功能进入可演示与可验收状态
  - 最新进展：已完成 App 挂载 `ChatPanel/SettingsPanel` 与宠物点击打开聊天面板的状态统一

### T027 SQLite 持久化落地

- `priority`：P0
- `status`：review
- `owner`：Codex + Worker-Descartes
- `support`：待分配
- `depends_on`：T007
- `write_scope`：数据库初始化、数据文件读写或 Tauri 侧数据库接入、迁移执行策略
- `deliverable`：
  - 应用重启后会话/设置/记忆/用量可按预期保留
  - 数据库文件路径与备份策略明确
  - 迁移可重复运行且不破坏数据
- `description`：
  - 当前 SQLite 实例为内存数据库，重启不保留数据
  - 该任务用于明确并落地可持久化的数据存储方案，作为 T016/T017/T020 的验收前置
  - 最新进展：已实现 `dbPath !== :memory:` 时按 key 快照持久化（run/exec/close 自动触发）

## 5. 建议并行分组

为提高多 Agent 协作效率，建议按以下 5 组并行：

### A 组：工程与架构底座

- T001 工程初始化与目录骨架
- T002 工程规范与基础配置
- T005 应用分层与依赖注入骨架

建议写入范围：

- 项目根目录
- 工程配置文件
- 应用分层基础目录

### B 组：桌宠 UI 与交互

- T003 桌宠窗口壳层
- T004 聊天面板 UI 骨架
- T019 Lottie 状态动画系统
- T022 全局快捷键与唤起能力

建议写入范围：

- 前端 UI 目录
- 窗口适配层
- 动画资源接入层

### C 组：对话与 Agent 主链路

- T006 LLM 网关接口与 Provider 骨架
- T008 用户消息处理主链路
- T009 角色提示词接入
- T010 意图识别与任务分流
- T024 异常处理与统一错误反馈

建议写入范围：

- application/conversation
- infrastructure/llm
- interfaces/controllers

### D 组：本地能力与效率工具

- T011 工具执行接口层
- T012 提醒系统基础能力
- T013 待办系统基础能力
- T014 剪贴板总结/改写/翻译
- T015 打开网页/应用/文件夹
- T023 开机启动与权限管理

建议写入范围：

- infrastructure/system
- application/productivity
- application/task

### E 组：数据与运营能力

- T007 会话与消息存储
- T016 设置中心基础版
- T017 记忆系统初版
- T018 主动提醒与陪伴反馈
- T020 Token 统计与调用日志
- T021 用量面板基础版

建议写入范围：

- infrastructure/persistence
- application/memory
- application/usage

## 6. 当前建议起步顺序

若接下来马上进入实现，建议按以下顺序启动：

1. T001、T002、T005
2. T003、T004、T006、T007
3. T008、T009、T010、T011
4. T012、T013、T014、T015
5. T016、T017、T018、T019、T020
6. T022、T023、T024
7. T021、T025

## 7. 每日更新模板

建议每个任务按以下格式更新：

```text
任务编号：
当前状态：
当前 owner：
今日进展：
阻塞项：
下一步：
涉及文件：
```

## 8. 当前任务状态初始化

当前项目进度已发生变化，建议以“任务总览”的状态为准维护。

### 8.1 进度同步记录（2026-04-20）

同步依据：

- 代码仓库存在覆盖 T001-T015 的阶段性提交
- 工作区存在未提交改动，主要涉及设置/记忆/用量仓储与迁移，以及组合根容器收口

关键发现：

- T026 已收口：聊天面板状态源已统一，`App` 已挂载 ChatPanel/SettingsPanel，进入联调验收阶段
- T027 已收口：SQLite 已从纯内存升级为基于 `dbPath` 的快照持久化，进入重启验证与容量评估阶段
- T018 已完成首版：提醒与完成反馈文案策略已接入核心链路，待提醒时序联调
- T021 已完成首版：设置中心可查看近 7 天模型用量概览
- T022 已完成首版：快捷键唤起聊天面板能力已接入（含 Web 回退）
- T023 已完成首版：设置驱动的开机启动与通知权限同步已接入
- T024 已完成首版：统一用户错误反馈策略已接入主链路，面板在异常下可继续使用
- T025 首轮记录已回填：`T008 pass`；`T012/T013/T014/T015/T019 blocked`，阻塞点已写入 `docs/验收清单-MVP.md`
- 今日更新：`execute_task` 已接入提醒/待办/剪贴板/工具执行，不再是占位响应
- 今日更新：快捷操作按钮调用已从 `addMessage` 改为 `sendMessage`，避免仅显示用户气泡而不触发执行；`smoke` 检查已增加 QuickActions 执行链路校验并通过（`pass=25,warn=0,fail=0`）
- 当前构建已恢复可用（`npm run build` 通过），剩余一条打包告警为“同模块静态+动态导入导致分块无效”
- 今日更新：`settingsStore` 已从动态导入 `composition-root` 改为静态导入，构建告警 `INEFFECTIVE_DYNAMIC_IMPORT` 已消除；后续分包优化后当前仅剩 `lottie eval` 非阻塞告警
- 今日更新：`ConversationController` 新增本地任务意图兜底（`inferTaskDecisionFromText`），当分类为 `continue_chat` 但命中任务关键词时仍可执行提醒/待办/剪贴板/打开工具；`smoke` 检查已新增任务路由接线校验并通过（`pass=26,warn=0,fail=0`）
- 今日更新：已在 `vite.config.ts` 增加手动分包（`react/openai/sqljs/lottie`）；`PetShell` 改为 `lazy + Suspense` 动态加载 `lottie-react`；构建中的 `chunk size` 告警已消除；当前剩余非阻塞告警为 `lottie-web eval`
- 今日更新：已引入 `Vitest` 单测基础设施，新增 3 个测试文件、7 个用例，`npm run test:run` 全通过（`7 passed`）
- 阶段分析（多 Agent）：`build/smoke/test` 通过，`lint` 失败（`54 problems: 45 errors, 9 warnings`）
- 阶段问题归档：已新增 `T028~T033`，覆盖执行安全、数据安全、提醒调度健壮性、多用户约束、Lint 基线与测试体系扩展
- 今日更新（T030）：`npm run lint` 已从 `45 errors` 收敛到 `0 errors`（当前仅 `9 warnings`，均为 `no-console`）
- 今日更新（T033）：`Vitest` 单测已实跑通过（`3 files / 7 tests passed`），`test/build/smoke` 三项均通过
- 今日更新（T030）：已引入统一 `runtimeLogger` 并替换运行时 `console` 输出，`npm run lint` 现为 `0 error / 0 warning`

可视为已完成的前置基础工作：

- D001 文档基线建立：done
- D002 技术选型确认：done
- D003 Git 初始化：done
- D004 协作任务清单建立：done
