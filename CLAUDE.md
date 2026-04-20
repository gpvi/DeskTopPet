# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent 桌宠 (PetAgent) is a desktop AI companion that appears as a Golden Retriever pet. It combines emotional companionship with lightweight task execution (reminders, todos, clipboard operations, opening apps/websites/folders). The project is currently in the planning phase with comprehensive documentation but no source code yet.

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

(To be filled after project initialization — T001)

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

All planning docs are in `docs/` (in Chinese):
- `产品需求文档.md` — product requirements
- `技术选型分析.md` — technology selection rationale
- `整洁架构设计.md` — clean architecture design
- `角色系统提示词.md` — system prompts for the Golden Retriever persona
- `角色设定提示词.md` — character setting prompts
- `多Agent协作任务清单.md` — 25-task breakdown with priorities (P0/P1/P2), dependencies, and parallel group assignments

## Task Tracking

Tasks are tracked in `docs/多Agent协作任务清单.md` with states: `todo`, `in_progress`, `blocked`, `review`, `done`. Implementation should follow the phased order defined in that document.
