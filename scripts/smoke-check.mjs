import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const docsTaskPathCandidates = [
  path.join(rootDir, "docs", "05-多Agent任务清单.md"),
];
const acceptanceDocPath = path.join(rootDir, "docs", "06-验收与质量门禁.md");

const requiredFiles = [
  { path: "src/interfaces/controllers/conversation-controller.ts", task: "T008" },
  { path: "src/application/conversation/send-message.usecase.ts", task: "T008" },
  { path: "src/application/productivity/create-reminder.usecase.ts", task: "T012" },
  { path: "src/application/productivity/reminder-scheduler.ts", task: "T012" },
  { path: "src/application/productivity/manage-todo.usecase.ts", task: "T013" },
  { path: "src/application/task/clipboard-use-case.ts", task: "T014" },
  { path: "src/application/task/open-tool-use-case.ts", task: "T015" },
  { path: "src/ui/desktop-pet/PetShell.tsx", task: "T019" },
  { path: "src/ui/chat-panel/QuickActions.tsx", task: "T025" },
  { path: "docs/05-多Agent任务清单.md", task: "T025" },
  { path: "docs/06-验收与质量门禁.md", task: "T025" },
];

const dependencyTaskIds = [
  { primary: "DEV008", fallback: "T008" },
  { primary: "DEV012", fallback: "T012" },
  { primary: "DEV013", fallback: "T013" },
  { primary: "DEV014", fallback: "T014" },
  { primary: "DEV015", fallback: "T015" },
  { primary: "DEV019", fallback: "T019" },
];
const allowedStatuses = new Set(["todo", "in_progress", "blocked", "review", "done"]);

const state = {
  pass: 0,
  warn: 0,
  fail: 0,
};

function print(level, message) {
  console.log(`${level} ${message}`);
}

function pass(message) {
  state.pass += 1;
  print("[PASS]", message);
}

function warn(message) {
  state.warn += 1;
  print("[WARN]", message);
}

function fail(message) {
  state.fail += 1;
  print("[FAIL]", message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function checkRequiredFiles() {
  for (const item of requiredFiles) {
    const absPath = path.join(rootDir, item.path);
    if (fs.existsSync(absPath)) {
      pass(`${item.task} required file exists: ${item.path}`);
    } else {
      fail(`${item.task} required file missing: ${item.path}`);
    }
  }
}

function parseTaskStatuses(markdown) {
  const lines = markdown.split(/\r?\n/);
  const taskStatusMap = new Map();
  const taskIdPattern = /^(T\d{3}|DEV\d{3}|TEST\d{3}|BUG\d{3})$/;

  for (const line of lines) {
    if (!line.startsWith("| ")) {
      continue;
    }

    const columns = line.split("|").map((part) => part.trim());
    if (columns.length < 5) {
      continue;
    }

    const taskId = columns[1];
    const status = columns[4];

    if (!taskId || !status || !taskIdPattern.test(taskId)) {
      continue;
    }

    taskStatusMap.set(taskId, status);
  }

  return taskStatusMap;
}

function resolveTaskDocPath() {
  for (const candidate of docsTaskPathCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function checkTaskDependencies() {
  const docsTaskPath = resolveTaskDocPath();
  if (!docsTaskPath) {
    fail("Task overview document missing: docs/05-多Agent任务清单.md or docs/多Agent协作任务清单.md");
    return;
  }

  pass(`Task overview document loaded: ${path.relative(rootDir, docsTaskPath)}`);
  const markdown = readText(docsTaskPath);
  const taskStatuses = parseTaskStatuses(markdown);

  for (const dependency of dependencyTaskIds) {
    const taskId = taskStatuses.has(dependency.primary)
      ? dependency.primary
      : dependency.fallback;

    if (!taskStatuses.has(taskId)) {
      fail(`T025/DEV025 dependency missing from task list: ${dependency.primary} (fallback ${dependency.fallback})`);
      continue;
    }

    const status = taskStatuses.get(taskId);
    if (!allowedStatuses.has(status)) {
      fail(`Task ${taskId} has invalid status value: ${status}`);
      continue;
    }

    pass(`Task ${taskId} status is valid: ${status}`);
  }

  const t019Status = taskStatuses.get("DEV019") ?? taskStatuses.get("T019");
  if (t019Status && !["review", "done"].includes(t019Status)) {
    warn(`DEV019/T019 status is ${t019Status}; full MVP acceptance is not closed yet`);
  }

  const t025Status = taskStatuses.get("DEV025") ?? taskStatuses.get("T025");
  if (!t025Status) {
    fail("DEV025/T025 is missing from task overview table");
  } else if (!allowedStatuses.has(t025Status)) {
    fail(`DEV025/T025 has invalid status value: ${t025Status}`);
  } else {
    pass(`DEV025/T025 status is valid: ${t025Status}`);
  }
}

function checkAcceptanceDocContent() {
  const markdown = readText(acceptanceDocPath);
  const sections = ["DEV008", "DEV012", "DEV013", "DEV014", "DEV015", "DEV019"];

  for (const section of sections) {
    if (markdown.includes(section)) {
      pass(`Acceptance checklist includes section: ${section}`);
    } else {
      fail(`Acceptance checklist missing section: ${section}`);
    }
  }
}

function checkQuickActionExecutionWiring() {
  const quickActionsPath = path.join(rootDir, "src", "ui", "chat-panel", "QuickActions.tsx");
  const source = readText(quickActionsPath);

  if (!source.includes("state.sendMessage")) {
    fail("QuickActions should read sendMessage from chat store");
    return;
  }

  if (!source.includes("sendMessage(presetText)")) {
    fail("QuickActions should invoke sendMessage(presetText) on action click");
    return;
  }

  if (source.includes("addMessage(")) {
    warn("QuickActions still references addMessage; verify no bypass of controller flow");
  } else {
    pass("QuickActions is wired to controller flow via sendMessage");
  }
}

function checkConversationTaskRoutingWiring() {
  const controllerPath = path.join(
    rootDir,
    "src",
    "interfaces",
    "controllers",
    "conversation-controller.ts",
  );
  const source = readText(controllerPath);

  if (source.includes("完整执行能力正在接入")) {
    fail("ConversationController still contains task placeholder response text");
    return;
  }

  const hasFallbackRouting = source.includes("inferTaskDecisionFromText");
  const hasTaskExecution = source.includes("executeTaskAndRespond");

  if (!hasTaskExecution) {
    fail("ConversationController should execute task routing via executeTaskAndRespond");
    return;
  }

  if (!hasFallbackRouting) {
    warn("ConversationController has no local task-intent fallback inference");
    return;
  }

  pass("ConversationController task routing includes execution and local fallback inference");
}

function main() {
  console.log("Running smoke checks for MVP integration readiness...");
  checkRequiredFiles();
  checkTaskDependencies();
  checkAcceptanceDocContent();
  checkQuickActionExecutionWiring();
  checkConversationTaskRoutingWiring();

  console.log("");
  console.log(
    `Summary: pass=${state.pass}, warn=${state.warn}, fail=${state.fail}`,
  );

  if (state.fail > 0) {
    process.exitCode = 1;
    return;
  }

  process.exitCode = 0;
}

main();
