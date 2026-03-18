# Gemini Desktop

基于 Tauri 的 Gemini AI 桌面客户端。

## 项目结构

```
packages/
├── desktop/     # Tauri 桌面应用
├── core/        # 共享核心逻辑
├── cli/         # CLI 工具
└── ui/          # UI 组件库
```

## 参考项目

本项目参考了以下开源项目（不纳入版本控制）：

- `gemini-cli/` - Google Gemini CLI 官方实现
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

# 构建
bun run desktop:build
```

## 技术栈

- **桌面框架**: Tauri 2
- **前端**: SolidJS + Vite
- **包管理**: Bun
- **UI**: TailwindCSS
- **API**: Google Gemini API
