# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Agent 桌宠 (PetAgent) is a desktop AI companion that appears as a TV Robot pet. It combines emotional companionship with lightweight task execution (reminders, todos, clipboard operations, opening apps/websites/folders).

## Tech Stack

- **Desktop container**: Tauri
- **Frontend**: React + TypeScript
- **Animation**: Lottie
- **Database**: SQLite
- **Architecture**: Clean Architecture (4-layer: Entities → Use Cases → Interface Adapters → Frameworks & Drivers)
- **AI**: Unified LLM Gateway with multi-provider adapters (OpenAI, Anthropic, Gemini, DeepSeek, etc.)

## Architecture

The system is organized into 6 bounded contexts:

- **Companion** — persona, tone, proactive message generation
- **Conversation** — input processing, intent classification, session management
- **Task Orchestration** — user goals → agent tasks with confirmation
- **Memory** — long/short-term memory, preferences, privacy control
- **Productivity** — todos, reminders, pomodoro timer, health reminders
- **Platform Integration** — LLM providers, local tools, system permissions, token stats

### Dependency Rule

Dependencies point inward only: `Frameworks & Drivers → Interface Adapters → Use Cases → Entities`. Domain code must never import UI, database SDK, or model SDK.

### Key Interfaces (Ports)

- `LLMGateway` — unified model calls (`completeChat`, `classifyIntent`, `generateReminderCopy`, `generateCompanionReply`)
- `ToolExecutor` — system actions (`openUrl`, `openApplication`, `openFolder`, `readClipboard`, `showNotification`)
- `MemoryRepository` — memory CRUD (`save`, `findByUser`, `findRelevant`, `delete`, `clearByUser`)
- `UsageRepository` — token stats (`save`, `queryDailyTrend`, `aggregateByDimension`)

### Target Directory Structure

```
src/
  domain/           # Entities, value objects, domain services per context
  application/      # Use cases and DTOs per context
  interfaces/       # UI controllers, presenters, mappers, DTOs
  infrastructure/   # LLM providers, SQLite repos, system tools, scheduler, config
  shared/           # Types, errors, utils
  app/              # Bootstrap and composition root
src-ui/             # React frontend: desktop-pet, chat-panel, settings, usage-dashboard
src-tauri/          # Rust backend: window management, notifications, global hotkeys
```

## Build & Development Commands

- `npm run dev` — start Vite frontend only.
- `npm run build` — run TypeScript check and Vite production build.
- `npm run test:run` — run Vitest once.
- `npm run lint` — run ESLint.
- `npm run smoke:check` — run MVP static smoke checks.
- `npm run tauri:dev:gnu` — start Tauri dev with GNU target on this Windows workspace.
- `npm run tauri:check:gnu` — run Cargo check for the GNU target.

## Git Commit Convention

Format: `type(T###): description`

- Types: `feat`, `fix`, `refactor`, `docs`, `chore`
- Include task number from the task list (e.g., `feat(T008): wire up user message handling`)
- Commit at meaningful checkpoints: after completing a task, before cross-module refactors, before integration testing

## Architecture Constraints

- Domain objects must not import UI frameworks, database SDKs, or model SDKs
- Use case layer must not directly call Tauri/Electron APIs
- Every LLM call must carry `feature` and `taskId`/`sessionId` context
- Every tool call with side effects must be loggable, failable, and reportable
- Reminder triggers must pass do-not-disturb and permission policy checks
- Memory writes must follow explicit rules — no "record everything" default
- Pet persona text templates must be separate from task execution logic
- Adding a new LLM provider must not require changes to core use case flows

## Documentation

All current planning docs are in `docs/` (in Chinese):
- `00-文档索引.md` — canonical documentation index
- `01-需求分析.md` — product goals, MVP scope, scenarios, non-functional requirements
- `02-架构设计.md` — Clean Architecture layers, bounded contexts, constraints
- `03-领域模型与类图.md` — entities, ports, use-case dependency diagrams
- `04-运行流程与接口.md` — runtime flows, Tauri capabilities, persistence, LLM call rules
- `05-多Agent任务清单.md` — canonical task list with status, dependencies, owners, parallel groups
- `06-验收与质量门禁.md` — static gates, GUI acceptance, defect severity, evidence template
- `07-角色与提示词.md` — TV Robot persona, tone boundaries, prompt skeleton
- `08-技术选型挑战与优化.md` — technology choices, challenges, and optimization roadmap

## Task Tracking

Tasks are tracked only in `docs/05-多Agent任务清单.md` with states: `todo`, `in_progress`, `blocked`, `review`, `done`. Implementation should follow dependencies and `parallel_group` guidance in that document.
