# Gemini Desktop

Native Gemini AI desktop app, built with Tauri v2.

## Prerequisites

Building the desktop app requires additional Tauri dependencies (Rust toolchain, platform-specific libraries). See the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for setup instructions.

## Setup

### 1. 安装 Gemini CLI

```bash
npm install -g @google/gemini-cli
```

### 2. 登录 Google 账号

```bash
gemini
# 选择 "Sign in with Google"
```

## Development

From the repo root:

```bash
bun install
bun run desktop:dev
```

## Build

```bash
bun run --cwd packages/desktop tauri build
```

## Troubleshooting

### Rust compiler not found

If you see errors about Rust not being found, install it via [rustup](https://rustup.rs/):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
