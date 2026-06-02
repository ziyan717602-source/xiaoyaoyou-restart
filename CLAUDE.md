# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

仙剑逍遥游 (Xianjian Xiaoyao) Web 版 —— 基于 boardgame.io + React 的多人卡牌游戏，重写自 C# WPF 原版实现。

## Tech Stack

| 层 | 选型 |
|---|------|
| 引擎 | boardgame.io（状态机、回合管理、多人联机） |
| 前端 | React 18 + TypeScript + Vite |
| 样式 | Tailwind CSS + shadcn/ui |
| 交互 | @dnd-kit（拖拽）、Framer Motion（动画） |
| 状态 | zustand（纯 UI 状态） |
| 工具 | nanoid（短 ID）、zod（类型校验） |

**禁止引入**：Redux、Socket.io、react-beautiful-dnd、Ant Design、Three.js

## Quick Commands

```bash
npm run dev          # 启动前端开发服务器
npm run server       # 启动 boardgame.io 服务端
npm run build        # 构建生产版本
npm run lint         # ESLint 检查
npm run test         # 运行测试
```

## Core Rules (违反会导致错误)

1. **C# 源码是唯一真相来源** — 每行效果代码必须有 C# 源码对照，card-info.md 和 game-flow.md 只作参考
2. **G 必须纯数据可序列化** — 禁止存入函数、类实例；卡牌只存 instanceId（字符串）
3. **UI 状态与游戏状态分离** — G 只存游戏数据，zustand 只存 UI 交互数据
4. **Moves 必须纯函数** — 签名 `(G, ctx) => void`，只能修改 G，禁止 `Math.random()`（用 `ctx.random`）
5. **严格按 scope.md** — 不实现不在范围内的功能，不预留多余接口

## Architecture

```
Client (React + zustand)
    │ WebSocket
    ▼
Server (boardgame.io)
    │
    ├─ Game (G State)
    ├─ Phases (Turn Flow)
    ├─ Moves (Player Actions)
    └─ Engine (Combat, Death, Skills, Effects)
```

- **服务端权威**：所有游戏逻辑在服务端执行，客户端只发送操作请求
- **阶段流转**：Turn Start → Event → Skill → Combat → Draw → Discard → Turn End
- **战斗子流程**：选支援/妨碍 → 翻怪+命中 → 战斗开始 → 出场效果 → 战牌 → 结算 → 结束

详见 [docs/architecture.md](docs/architecture.md)

## Project Structure

```
src/
├── game/           # boardgame.io 游戏引擎
│   ├── Game.ts     # 主入口
│   ├── phases/     # 回合阶段（7 个）
│   ├── moves/      # 玩家动作（15 个）
│   ├── skills/     # 角色技能（按仙剑系列分组）
│   ├── engine/     # 核心引擎（战力、命中、伤害、死亡、变身、打断）
│   └── monsters/   # 怪物/NPC 效果
├── shared/         # 前后端共享
│   ├── types/      # TypeScript 类型定义
│   ├── data/       # psd.db3 导出的 JSON 数据
│   └── utils/      # 共享工具函数
├── ui/             # React 前端
│   ├── components/ # 通用 UI 组件（Card、Dialog、Toast 等）
│   ├── board/      # 游戏面板（GameBoard、HandArea、CombatArea 等）
│   ├── features/   # 功能页面（RoomLobby、HeroSelect、GameOver）
│   └── hooks/      # 自定义 Hooks（useGameClient、useUIStore）
├── server/         # boardgame.io 服务端
├── assets/         # 卡图资源（heroes、monsters、tux、events）
├── styles/         # 全局样式
└── tests/          # 测试（game/moves/skills）
```

详见 [docs/project-structure.md](docs/project-structure.md)

## Key Documentation

| 文档 | 内容 |
|------|------|
| [reference/docs/scope.md](reference/docs/scope.md) | **硬性约束**：卡牌范围、游戏模式、功能边界 |
| [reference/docs/game-flow.md](reference/docs/game-flow.md) | 游戏流程规则（回合、战斗、死亡处理） |
| [reference/docs/card-info.md](reference/docs/card-info.md) | 卡牌信息全表（34 角色、20 怪物、56 手牌） |
| [route/统一实施路线.md](route/统一实施路线.md) | 8 阶段实施计划 |
| [route/phase-tracking/README.md](route/phase-tracking/README.md) | **开发进度跟踪**（各阶段任务清单、测试情况） |
| [docs/architecture.md](docs/architecture.md) | 系统架构设计 |
| [docs/development.md](docs/development.md) | 开发环境指南 |

## Game Concepts

| 概念 | 说明 |
|------|------|
| 倾慕 | 角色死亡时，所有倾慕者各扣 1HP 使其复活（链式反应） |
| 横置 | 被横置的角色下回合跳过除弃牌外的所有阶段 |
| 宠物 | 击败怪物获得，同属性唯一，有特殊效果 |
| 变身 | 条件触发时替换角色（保留 HP/装备/手牌） |
| 打断窗口 | 隐蛊/冰心诀在特定事件发生时可响应 |

## Implementation Phases

| 阶段 | 内容 | 耗时 |
|------|------|------|
| Phase 0 | 准备周：导出数据库、校准文档、标注 C# 源码 | 3-5天 |
| Phase 1 | 数据层：TypeScript 类型定义 + 数据骨架 | 2-3天 |
| Phase 2 | 引擎骨架：boardgame.io 主流程 + Spike 验证 | 3-5天 |
| Phase 3 | 卡牌效果：56 张手牌 | 5-7天 |
| Phase 4 | 角色技能：34 个角色 | 5-7天 |
| Phase 5 | 怪物/NPC：20 怪物 + 26 NPC | 3-5天 |
| Phase 6 | 基础前端：白盒 UI | 5-7天 |
| Phase 7 | 前端美化：卡图 + 动画 | 5-7天 |
| Phase 8 | 联调测试 | 3-5天 |

详见 [route/统一实施路线.md](route/统一实施路线.md)

## Reference Implementation

原版 C# 实现（`reference/psd48-master/`）使用 WPF + SQLite。本 Web 重写保持服务端权威，boardgame.io 替代自研网络协议，JSON 数据文件替代 SQLite 运行时查询。
