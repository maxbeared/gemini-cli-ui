# Gemini Desktop

基于 Tauri 的 Gemini AI 桌面客户端。

## 核心功能 (MVP)

当前版本已经实现了一个功能完备的桌面聊天界面：
- **智能对话**: 动态调用底层的 `gemini-cli`，支持多轮对话上下文记忆（Session 保持）。
- **历史记录持久化**: 本地保存对话历史，重启应用后自动恢复，并提供“清空对话”功能。
- **Markdown 与代码高亮**: 支持全功能的 Markdown 渲染，并使用 `shiki` 提供沉浸式的暗色代码语法高亮。
- **一键复制代码**: 为生成的代码块提供一键复制功能及状态反馈。
- **工具调用展示**: 当 AI 调用系统工具（如读取文件、执行 Shell 命令）时，提供优雅的折叠式 UI 展示运行状态和输出结果。
- **便捷输入**: 支持多行文本自适应高度输入框，支持 `Shift + Enter` 换行。

## 项目结构

```
packages/
├── desktop/     # Tauri 桌面应用 (MVP 主要核心逻辑所在)
├── core/        # 共享核心逻辑
├── cli/         # CLI 工具
└── ui/          # UI 组件库
```

## 参考项目

本项目参考了以下开源项目（不纳入版本控制）：

- `gemini-cli/` - Google Gemini CLI 官方实现 (作为底层驱动引擎)
- `opencode/` - OpenCode 桌面端实现

### 获取参考项目

```bash
# Clone Gemini CLI
git clone https://github.com/google-gemini/gemini-cli.git

# Clone OpenCode
git clone https://github.com/anomalyco/opencode.git
```

## 开发

```bash
# 安装依赖
bun install

# 启动桌面端开发服务器
bun run desktop:dev
# 或者同时启动 Tauri
bun run tauri dev

# 构建
bun run desktop:build
```

## 技术栈

- **桌面框架**: Tauri 2
- **前端**: SolidJS + Vite
- **包管理**: Bun
- **Markdown & 高亮**: marked + dompurify + shiki
- **API**: Google Gemini API (通过本地 CLI Bundle 调用)

