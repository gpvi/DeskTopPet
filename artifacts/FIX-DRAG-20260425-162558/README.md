# FIX-DRAG 实机测试记录

- 时间：2026-04-25 16:25 Asia/Shanghai
- 分支：`fix/drag-region-issue`
- 命令：`npm.cmd run tauri:dev:gnu`
- 结果：Tauri dev 编译完成并启动 `target\x86_64-pc-windows-gnu\debug\app.exe`
- 进程：`app.exe` 主窗口标题为 `Agent 桌宠`，`Responding=True`
- 前端：Vite dev server 正常启动，监听 `http://localhost:10000/`

## 本轮验证

- 拖拽区域修复后，生产构建通过。
- `npm run build` 通过。
- `npm run lint` 通过。
- `npm run smoke:check` 通过，`pass=27, warn=0, fail=0`。
- `npm run tauri:check:gnu` 通过。
- 普通 `npm run tauri:dev:gnu` 已自动设置 `CARGO_INCREMENTAL=0`，规避 GNU target 下 rustc 增量编译 ICE。

## 修复点

- 桌宠根容器不再依赖 `data-tauri-drag-region` 直接接管鼠标按下事件。
- 鼠标移动距离超过阈值后才调用 Tauri `startDragging()`。
- 普通点击保留为打开/关闭交互菜单。
- 拖动开始时自动收起交互菜单。
- GNU target 的 Tauri dev 启动脚本在未显式设置 `CARGO_INCREMENTAL` 时默认关闭增量编译。
