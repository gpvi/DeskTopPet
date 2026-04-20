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
| T001 | 工程初始化与目录骨架 | P0 | done | Agent-A | - | 初始化 Tauri + React + TypeScript 项目骨架 |
| T002 | 工程规范与基础配置 | P0 | done | Agent-A | T001 | 配置 lint、format、tsconfig、目录约束 |
| T003 | 桌宠窗口壳层 | P0 | done | Agent-A | T001 | 实现常驻窗口、置顶、拖拽、贴边基础能力 |
| T004 | 聊天面板 UI 骨架 | P0 | done | Agent-A | T001 | 聊天面板、输入框、消息列表、快捷入口 |
| T005 | 应用分层与依赖注入骨架 | P0 | done | Agent-A | T001 | 建立 domain/application/interfaces/infrastructure 分层 |
| T006 | LLM 网关接口与 Provider 骨架 | P0 | done | Agent-A | T005 | 定义统一模型网关和 Provider 抽象 |
| T007 | 会话与消息存储 | P0 | done | Agent-A | T005 | SQLite 表结构与 Repository 初版 |
| T008 | 用户消息处理主链路 | P0 | done | Agent-A | T004,T005,T006,T007 | 打通聊天输入到回复输出 |
| T009 | 角色提示词接入 | P0 | todo | 待分配 | T006,T008 | 接入系统提示词与运行时上下文 |
| T010 | 意图识别与任务分流 | P0 | todo | 待分配 | T006,T008 | 区分闲聊、问答、任务请求 |
| T011 | 工具执行接口层 | P0 | done | Agent-A | T005 | 封装网页、应用、文件夹、剪贴板等工具接口 |
| T012 | 提醒系统基础能力 | P0 | todo | 待分配 | T005,T007,T011 | 提醒数据、调度、通知闭环 |
| T013 | 待办系统基础能力 | P0 | todo | 待分配 | T005,T007 | 待办增删改查与展示 |
| T014 | 剪贴板总结/改写/翻译 | P0 | todo | 待分配 | T006,T010,T011 | 打通剪贴板工具与模型能力 |
| T015 | 打开网页/应用/文件夹 | P0 | todo | 待分配 | T010,T011 | 完成 MVP 工具调用闭环 |
| T016 | 设置中心基础版 | P1 | todo | 待分配 | T004,T007 | 开机启动、提醒开关、隐私和记忆设置 |
| T017 | 记忆系统初版 | P1 | todo | 待分配 | T005,T006,T007 | 显式记忆写入、读取、删除 |
| T018 | 主动提醒与陪伴反馈 | P1 | todo | 待分配 | T009,T012,T017 | 提醒文案、完成反馈、低打扰策略 |
| T019 | Lottie 状态动画系统 | P1 | todo | 待分配 | T003,T004 | 待机、思考、提醒、开心等状态切换 |
| T020 | Token 统计与调用日志 | P1 | todo | 待分配 | T006,T007 | 模型调用日志、Token 存储与聚合 |
| T021 | 用量面板基础版 | P2 | todo | 待分配 | T004,T020 | 展示最近 30 天用量趋势 |
| T022 | 全局快捷键与唤起能力 | P1 | todo | 待分配 | T003,T011 | 注册快捷键并唤起聊天面板 |
| T023 | 开机启动与权限管理 | P1 | todo | 待分配 | T003,T011,T016 | 自启动、权限检查、授权提示 |
| T024 | 异常处理与统一错误反馈 | P1 | todo | 待分配 | T008,T010,T011 | 错误码、用户提示、失败兜底 |
| T025 | 集成联调与 MVP 验收 | P0 | todo | 待分配 | T008,T012,T013,T014,T015,T019 | 联调主链路并完成验收 |

## 4. 任务详细说明

### T001 工程初始化与目录骨架

- `priority`：P0
- `status`：todo
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
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
- `status`：todo
- `owner`：待分配
- `support`：待分配
- `depends_on`：T004,T007
- `write_scope`：设置页 UI、配置存储、设置用例
- `deliverable`：
  - 提醒开关
  - 记忆与隐私设置
  - 角色名称和基础偏好设置
- `description`：
  - 为用户提供“可控感”，降低对主动行为的排斥

### T017 记忆系统初版

- `priority`：P1
- `status`：todo
- `owner`：待分配
- `support`：待分配
- `depends_on`：T005,T006,T007
- `write_scope`：记忆实体、记忆仓储、显式记忆用例
- `deliverable`：
  - 显式记忆写入
  - 记忆读取
  - 记忆删除/清空
- `description`：
  - 支撑持续陪伴体验和个性化任务服务

### T018 主动提醒与陪伴反馈

- `priority`：P1
- `status`：todo
- `owner`：待分配
- `support`：待分配
- `depends_on`：T009,T012,T017
- `write_scope`：提醒文案生成、完成反馈文案、主动度策略
- `deliverable`：
  - 低打扰提醒文案
  - 任务完成鼓励反馈
  - 基础主动策略配置
- `description`：
  - 将“工具可用”提升为“陪伴 + 工具”的联合体验

### T019 Lottie 状态动画系统

- `priority`：P1
- `status`：todo
- `owner`：待分配
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

### T020 Token 统计与调用日志

- `priority`：P1
- `status`：todo
- `owner`：待分配
- `support`：待分配
- `depends_on`：T006,T007
- `write_scope`：调用日志表、Token 记录用例、聚合查询
- `deliverable`：
  - 模型调用记录
  - Token 存储
  - 成本估算字段
- `description`：
  - 为后续成本控制、用户用量展示和运营分析提供基础

### T021 用量面板基础版

- `priority`：P2
- `status`：todo
- `owner`：待分配
- `support`：待分配
- `depends_on`：T004,T020
- `write_scope`：用量面板 UI、聚合查询展示
- `deliverable`：
  - 近 7 日或 30 日趋势图
  - 模型消耗概览
- `description`：
  - 为设置中心补充透明的模型使用信息

### T022 全局快捷键与唤起能力

- `priority`：P1
- `status`：todo
- `owner`：待分配
- `support`：待分配
- `depends_on`：T003,T011
- `write_scope`：快捷键注册、窗口唤起、设置绑定
- `deliverable`：
  - 全局快捷键
  - 快速唤起聊天面板
- `description`：
  - 降低交互入口成本，强化常驻助手价值

### T023 开机启动与权限管理

- `priority`：P1
- `status`：todo
- `owner`：待分配
- `support`：待分配
- `depends_on`：T003,T011,T016
- `write_scope`：启动项适配、权限检查、授权提示逻辑
- `deliverable`：
  - 自启动开关
  - 权限状态检查
  - 用户授权引导
- `description`：
  - 增强常驻产品基础体验，同时保持用户可控

### T024 异常处理与统一错误反馈

- `priority`：P1
- `status`：todo
- `owner`：待分配
- `support`：待分配
- `depends_on`：T008,T010,T011
- `write_scope`：错误模型、错误提示组件、失败兜底策略
- `deliverable`：
  - 统一错误码或错误类型
  - 用户可理解的失败提示
  - 工具失败兜底反馈
- `description`：
  - 保证 Agent 不稳定时仍然可用、可信

### T025 集成联调与 MVP 验收

- `priority`：P0
- `status`：todo
- `owner`：待分配
- `support`：待分配
- `depends_on`：T008,T012,T013,T014,T015,T019
- `write_scope`：联调用例、验收记录、问题清单
- `deliverable`：
  - MVP 主链路联调通过
  - 核心能力验收记录
  - 缺陷清单与修复优先级
- `description`：
  - 验证产品是否满足 MVP 核心目标，并形成下一阶段改进输入

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

当前项目状态初始化如下：

- 所有研发任务状态初始化为 `todo`
- 技术选型已完成
- 文档基线已完成
- Git 仓库已初始化

可视为已完成的前置基础工作：

- D001 文档基线建立：done
- D002 技术选型确认：done
- D003 Git 初始化：done
- D004 协作任务清单建立：done
