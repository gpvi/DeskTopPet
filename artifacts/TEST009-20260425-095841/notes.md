# TEST009 实机验收记录

- 结论：review with real-launch evidence。真实 Tauri GUI 启动成功，窗口标题为 `Agent 桌宠`，进程响应正常，Vite 前端 HTTP 200。
- 静态门禁：`smoke:check` 通过，`gui-acceptance-check` 通过，`tauri:check:gnu` 通过。
- 真实启动：`npm run tauri:dev:gnu` 成功编译并运行 `target\x86_64-pc-windows-gnu\debug\app.exe`。
- 证据：`tauri-dev.out.log`、`tauri-dev.err.log`、`runtime-tail.txt`、`app-process.txt`、`vite-http.txt`、`desktop-screenshot.png`。
- 限制：本轮由命令行和截图确认真实窗口启动，没有完成逐项人工点击聊天/提醒/待办/剪贴板/工具调用，因此 TEST009 暂不标记 done。
- 后续：需要人工按 docs/06 的 G/C/R/T/CL/O/A/S 步骤点击并补 screenshots/ 或录屏。
