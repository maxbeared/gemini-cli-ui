# Gemini Desktop - 开发指南

## 项目已完成

✅ 项目结构清理（移除参考项目的冗余文件）
✅ Tauri 后端配置（Rust）
✅ Gemini API 集成（流式响应）
✅ 基础聊天 UI（SolidJS）
✅ 环境配置文档

## 快速开始

### 1. 配置 API Key

```bash
cd packages/desktop
cp .env.example .env
```

编辑 `.env` 文件，添加你的 Gemini API Key：
```
VITE_GEMINI_API_KEY=你的API密钥
```

获取 API Key: https://aistudio.google.com/app/apikey

### 2. 安装依赖

```bash
bun install
```

### 3. 运行开发服务器

```bash
bun run desktop:dev
```

### 4. 构建应用

```bash
bun run desktop:build
```

## 项目结构

```
packages/
├── desktop/           # 桌面应用（主要开发目录）
│   ├── src/          # 前端代码（SolidJS）
│   │   ├── App.tsx           # 主界面
│   │   ├── adapter.ts        # 消息状态管理
│   │   ├── gemini-bridge.ts  # Gemini API 调用
│   │   └── index.tsx         # 入口
│   ├── src-tauri/    # 后端代码（Rust）
│   │   ├── src/
│   │   │   ├── lib.rs        # Tauri 主逻辑
│   │   │   └── main.rs       # 入口
│   │   └── Cargo.toml        # Rust 依赖
│   └── package.json
├── cli/              # Gemini CLI（参考，来自 gemini-cli）
└── core/             # 核心逻辑（参考，来自 gemini-cli）

参考项目（不在 git 中）：
├── gemini-cli/       # Google Gemini CLI 官方实现
└── opencode/         # OpenCode 桌面端实现
```

## 技术栈

- **桌面框架**: Tauri 2
- **前端**: SolidJS + Vite
- **包管理**: Bun
- **API**: Google Gemini API (REST)
- **语言**: TypeScript + Rust

## 下一步开发

1. **增强 UI**
   - 添加代码高亮
   - Markdown 渲染
   - 消息历史持久化

2. **工具调用**
   - 文件操作
   - 代码执行
   - 搜索功能

3. **系统集成**
   - 系统托盘
   - 快捷键
   - 通知

## 提交代码

```bash
git add .
git commit -m "feat: initial gemini desktop setup"
```
