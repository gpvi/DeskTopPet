# DEV003 透明电视机器人窗口实机复测

- 时间：2026-04-25 10:39 Asia/Shanghai
- 命令：`npm.cmd run tauri:dev:gnu`
- 结果：Tauri dev 编译完成并启动 `target\x86_64-pc-windows-gnu\debug\app.exe`
- 进程：`app.exe` 主窗口标题为 `Agent 桌宠`，`Responding=True`
- 前端：Vite dev server 正常启动，监听 `http://localhost:10000/`
- 本轮验证点：透明无边框置顶窗口配置可启动；桌宠壳层已从圆球 fallback 切换为用户提供电视机机器人透明 PNG。

说明：原始 `img/电视机器人.jpg` 自带浅蓝背景，本轮通过 `scripts/create-tv-robot-cutout.py` 生成 `src/ui/desktop-pet/assets/tv-robot-cutout.png`，避免透明窗口中出现整张 JPG 的底色矩形。
