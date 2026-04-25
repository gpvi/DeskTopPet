# Agent 桌宠

Agent 桌宠是一个基于 Tauri + React + TypeScript 的桌面 AI 伴侣。当前形态是透明无边框的小电视机器人桌宠，支持置顶显示、拖拽移动、状态反馈，以及点击机器人后弹出交互列表。

## 当前能力

- 透明无边框桌宠窗口：置顶显示、跳过任务栏，适合常驻桌面。
- 电视机机器人形象：使用用户提供的机器人素材，并生成透明 PNG 剪影资源。
- 点击交互列表：点击机器人后展示 `和我聊天`、`创建提醒`、`创建待办`、`总结剪贴板`、`打开设置`。
- 对话主链路：通过聊天面板接入 Conversation Controller 和本地 fallback 推理。
- 生产力能力：提醒、待办、剪贴板总结、打开工具等 MVP 任务链路已接入。
- 设置面板：支持基础偏好、模型配置和近 7 天模型用量展示。
- 多模型网关：预留 OpenAI、Anthropic、DeepSeek、Moonshot、Qwen、Zhipu 等 provider 配置。

## 技术栈

- Desktop：Tauri
- Frontend：React + TypeScript + Vite
- State：Zustand
- Animation：Lottie + CSS 状态动效
- Persistence：SQLite / sql.js
- Architecture：Clean Architecture
- Package Manager：npm，`package-lock.json` 是唯一锁文件

## 快速开始

```bash
npm install
npm run dev
```

Windows GNU target 下启动 Tauri 桌面端：

```bash
npm run tauri:dev:gnu
```

常用质量门禁：

```bash
npm run build
npm run lint
npm run test:run
npm run smoke:check
npm run tauri:check:gnu
```

打包 Windows exe：

```bash
make package-exe
```

默认使用 `x86_64-pc-windows-gnu` target，打包完成后会自动创建 `artifacts/release/` 并收集可分发的 `app.exe`、安装器 `.exe` 和 `.msi`。可用 `make exe-path` 查看最新生成的产物路径。

## 项目结构

```text
src/
  domain/           # Entities, value objects, domain services
  application/      # Use cases and DTOs
  interfaces/       # Controllers, presenters, mappers
  infrastructure/   # LLM providers, persistence, tools, scheduler, config
  shared/           # Shared types, errors, utils
  app/              # Bootstrap and composition root
src/ui/             # React UI: desktop pet, chat panel, settings
src-tauri/          # Tauri backend, capabilities, plugins
docs/               # 当前唯一有效的需求、架构、任务和验收文档
artifacts/          # 实机测试和验收记录
```

## 文档入口

当前规划文档统一维护在 `docs/`：

- `docs/00-文档索引.md`：文档总入口
- `docs/01-需求分析.md`：产品目标、MVP 范围、用户场景
- `docs/02-架构设计.md`：Clean Architecture、上下文边界、依赖规则
- `docs/03-领域模型与类图.md`：实体、端口、用例和类图
- `docs/04-运行流程与接口.md`：对话、任务、提醒、持久化和 Tauri 能力流程
- `docs/05-多Agent任务清单.md`：唯一任务状态源
- `docs/06-验收与质量门禁.md`：静态门禁、GUI 验收和证据模板
- `docs/07-角色与提示词.md`：电视机器人角色、语气和提示词规则
- `docs/08-技术选型挑战与优化.md`：技术选型、挑战和优化路线

## 当前状态

- `DEV003` 桌宠窗口壳层：`review`。透明无边框置顶窗口、跳任务栏、机器人透明 PNG 壳层、拖拽与点击交互列表已具备；贴边吸附作为后续增强。
- `DEV019` 状态动画系统：`review`。待机、思考、开心、提醒状态已具备基础反馈。
- `TEST009` GUI 全链路终验：`review`。Tauri 实机启动已成功，逐项人工点击仍待补齐。

最近实机验证：

- `artifacts/DEV003-20260425-103926`：透明机器人窗口复测。
- `artifacts/TEST009-20260425-095841`：GUI 全链路启动证据。
- `artifacts/TEST-PET-MENU-20260425-104934`：点击交互列表版本实机启动记录。

## 开发约束

- 遵循 Clean Architecture 依赖规则：外层依赖内层，领域层不得依赖 UI、数据库 SDK 或模型 SDK。
- 所有任务状态只维护在 `docs/05-多Agent任务清单.md`。
- 涉及架构、权限、安全、持久化或技术栈变更时，同步更新 `docs/` 中对应文档。
- 新增 LLM provider 不应修改核心用例流程。
