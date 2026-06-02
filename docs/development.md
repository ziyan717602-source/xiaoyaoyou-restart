# 开发环境指南

> 本地开发环境搭建、常用命令、验证流程。

## 环境要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18.x | 推荐 20.x LTS |
| npm | >= 9.x | 或 yarn/pnpm |
| Git | >= 2.x | 版本控制 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 导出游戏数据

从 SQLite 数据库导出 JSON 数据文件：

```bash
# 使用 Node.js 脚本导出
node scripts/export-data.js

# 或使用 Python
python scripts/export-data.py
```

导出后检查 `src/shared/data/` 目录是否包含所有 JSON 文件。

### 3. 启动开发服务器

```bash
# 前端开发服务器
npm run dev

# 服务端（boardgame.io Server）
npm run server
```

### 4. 访问应用

- 前端：http://localhost:5173
- 服务端：http://localhost:8080

## 常用命令

### 开发

```bash
npm run dev          # 启动 Vite 开发服务器
npm run server       # 启动 boardgame.io 服务端
npm run dev:all      # 同时启动前端和服务端
```

### 构建

```bash
npm run build        # 构建生产版本
npm run build:check  # 类型检查 + 构建
```

### 代码质量

```bash
npm run lint         # ESLint 检查
npm run lint:fix     # 自动修复
npm run format       # Prettier 格式化
npm run typecheck    # TypeScript 类型检查
```

### 测试

```bash
npm run test         # 运行所有测试
npm run test:watch   # 监听模式
npm run test:coverage # 覆盖率报告
```

## 项目结构

详见 [project-structure.md](./project-structure.md)。

核心目录：
- `src/game/` - boardgame.io 游戏引擎
- `src/shared/` - 前后端共享（类型、数据、工具）
- `src/ui/` - React 前端组件
- `src/server/` - 服务端配置

## 开发工作流

### 典型开发循环

```
1. 修改代码
   │
   ▼
2. 类型检查 ──── 失败 ──▶ 修复类型错误
   │
   ▼ 通过
3. Lint 检查 ──── 失败 ──▶ 修复 lint 错误
   │
   ▼ 通过
4. 运行测试 ──── 失败 ──▶ 修复测试
   │
   ▼ 通过
5. 本地验证（浏览器测试）
   │
   ▼
6. 提交代码
```

### 验证流程

#### 前端验证

1. 启动开发服务器：`npm run dev`
2. 打开浏览器访问 http://localhost:5173
3. 测试关键页面：
   - 房间大厅（创建/加入房间）
   - 选将界面（随机 3 选 1）
   - 游戏面板（手牌、战斗、回合流转）

#### 服务端验证

1. 启动服务端：`npm run server`
2. 使用 boardgame.io Debug Panel 测试
3. 检查控制台无错误输出

#### 集成验证

1. 同时启动前端和服务端：`npm run dev:all`
2. 打开两个浏览器窗口模拟多玩家
3. 完整测试一局游戏流程

## 游戏数据导出

### 数据源

- 数据库：`reference/psd48-master/~ex-lib/psd.db3`（SQLite）
- 导出目标：`src/shared/data/*.json`

### 导出的表

| 表名 | 文件 | 说明 |
|------|------|------|
| Hero | heroes.json | 34 角色 |
| Monster | monsters.json | 20 怪物 |
| Tux | tux.json | 56 手牌 |
| Npc | npcs.json | 26 NPC |
| Eve | events.json | 14 事件 |
| Skill | skills.json | 技能数据 |
| Rune | runes.json | 符文数据 |
| Exsp | exsp.json | 特殊能力 |

### 导出脚本

```javascript
// scripts/export-data.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('reference/psd48-master/~ex-lib/psd.db3');
const outputDir = 'src/shared/data';

const tables = ['Hero', 'Monster', 'Tux', 'Npc', 'Eve', 'Skill', 'Rune', 'Exsp'];
const fileNames = ['heroes', 'monsters', 'tux', 'npcs', 'events', 'skills', 'runes', 'exsp'];

tables.forEach((table, i) => {
  const data = db.prepare(`SELECT * FROM ${table}`).all();
  fs.writeFileSync(
    path.join(outputDir, `${fileNames[i]}.json`),
    JSON.stringify(data, null, 2)
  );
  console.log(`Exported ${table} -> ${fileNames[i]}.json (${data.length} rows)`);
});

db.close();
```

## 故障排除

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `Module not found` | 依赖未安装 | 运行 `npm install` |
| `Type error` | 类型定义不匹配 | 检查 `src/shared/types/` |
| `boardgame.io` 连接失败 | 服务端未启动 | 运行 `npm run server` |
| 数据为空 | JSON 未导出 | 运行数据导出脚本 |

### 调试技巧

1. **boardgame.io Debug Panel**：在 Client 配置中开启 `debug: true`
2. **React DevTools**：检查组件状态和 props
3. **Zustand DevTools**：在 Store 中启用 devtools 中间件
4. **TypeScript 严格模式**：在 `tsconfig.json` 中启用 `strict: true`

## 相关文档

- [项目结构](./project-structure.md) - 完整目录结构
- [系统架构](./architecture.md) - 架构设计
- [统一实施路线](../route/统一实施路线.md) - 开发计划
