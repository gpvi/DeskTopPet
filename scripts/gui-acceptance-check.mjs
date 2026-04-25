import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();

const state = {
  pass: 0,
  fail: 0,
};

function print(level, message) {
  console.log(`${level} ${message}`);
}

function pass(message) {
  state.pass += 1;
  print("[PASS]", message);
}

function fail(message) {
  state.fail += 1;
  print("[FAIL]", message);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function checkFileExists(relativePath) {
  const exists = fs.existsSync(path.join(rootDir, relativePath));
  if (exists) {
    pass(`Required file exists: ${relativePath}`);
  } else {
    fail(`Required file missing: ${relativePath}`);
  }
  return exists;
}

function checkIncludes(relativePath, snippets) {
  if (!checkFileExists(relativePath)) {
    return;
  }

  const source = readText(relativePath);
  for (const snippet of snippets) {
    if (source.includes(snippet)) {
      pass(`${relativePath} includes ${snippet}`);
    } else {
      fail(`${relativePath} missing ${snippet}`);
    }
  }
}

function checkPackageScripts() {
  if (!checkFileExists("package.json")) {
    return;
  }

  const packageJson = JSON.parse(readText("package.json"));
  const scripts = packageJson.scripts ?? {};
  const expectedScripts = ["smoke:check", "tauri:dev:gnu", "tauri:check:gnu"];

  for (const scriptName of expectedScripts) {
    if (typeof scripts[scriptName] === "string" && scripts[scriptName].length > 0) {
      pass(`package.json script is available: ${scriptName}`);
    } else {
      fail(`package.json script missing: ${scriptName}`);
    }
  }
}

function checkAcceptanceDocs() {
  checkIncludes("docs/06-验收与质量门禁.md", [
    "TEST009 GUI 全链路终验流程",
    "聊天主链路验收",
    "提醒验收",
    "待办验收",
    "剪贴板与打开工具验收",
    "动效、设置与权限验收",
    "静态/半自动验收降级路径",
    "TEST009 验收记录模板",
  ]);

  checkIncludes("docs/04-运行流程与接口.md", [
    "TEST009 GUI 验收入口映射",
    "src/ui/desktop-pet/PetShell.tsx",
    "src/ui/chat-panel/QuickActions.tsx",
    "src-tauri/capabilities/default.json",
  ]);
}

function checkUiEntrypoints() {
  checkIncludes("src/App.tsx", ["<PetShell />"]);
  checkIncludes("src/ui/desktop-pet/PetShell.tsx", [
    "data-mood={displayMood}",
    "thinking",
    "happy",
    "reminding",
  ]);
  checkIncludes("src/ui/chat-panel/ChatPanel.tsx", [
    "MessageList",
    "QuickActions",
    "MessageInput",
    "打开设置面板",
  ]);
  checkIncludes("src/ui/chat-panel/MessageInput.tsx", [
    "sendMessage(inputValue.trim())",
    "event.key === 'Enter'",
  ]);
  checkIncludes("src/ui/chat-panel/QuickActions.tsx", [
    "创建提醒",
    "创建待办",
    "总结剪贴板",
    "sendMessage(presetText)",
  ]);
  checkIncludes("src/ui/settings/SettingsPanel.tsx", [
    "通用设置",
    "模型配置",
    "近 7 天模型用量",
    "保存配置",
  ]);
}

function checkTauriEntrypoints() {
  checkIncludes("src-tauri/tauri.conf.json", [
    "\"title\": \"Agent 桌宠\"",
    "\"devUrl\": \"http://localhost:1420\"",
  ]);
  checkIncludes("src-tauri/src/lib.rs", [
    "tauri_plugin_shell::init()",
    "tauri_plugin_notification::init()",
    "tauri_plugin_global_shortcut",
    "tauri_plugin_clipboard_manager::init()",
    "tauri_plugin_autostart::init",
  ]);
  checkIncludes("src-tauri/capabilities/default.json", [
    "shell:default",
    "notification:default",
    "global-shortcut:allow-register",
    "clipboard-manager:allow-read-text",
    "clipboard-manager:allow-write-text",
    "autostart:default",
  ]);
}

function main() {
  console.log("Running TEST009 GUI acceptance readiness checks...");

  checkPackageScripts();
  checkAcceptanceDocs();
  checkUiEntrypoints();
  checkTauriEntrypoints();

  console.log("");
  console.log(`Summary: pass=${state.pass}, fail=${state.fail}`);

  if (state.fail > 0) {
    process.exitCode = 1;
    return;
  }

  process.exitCode = 0;
}

main();
