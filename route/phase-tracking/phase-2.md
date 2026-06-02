# Phase 2：核心引擎骨架

> 目标：用 boardgame.io 搭建能跑通"一局完整游戏主流程"的最小引擎。
> 预计耗时：3-5 天
> 状态：✅ 已完成
> 开始时间：2026-06-02
> 完成时间：2026-06-02
> 总耗时：1 天

## 任务清单

### 2.1 项目初始化

- [x] 使用 Vite 创建 React + TypeScript 项目
- [x] 安装 boardgame.io、react、typescript
- [x] 安装 tailwindcss、postcss、autoprefixer
- [x] 配置 Tailwind
- [x] 创建目录结构（game/shared/ui/server）
- [x] 确保 `npm run dev` 能启动

### 2.2 GameState 定义

- [x] `src/game/setup.ts` - 游戏初始化函数
  - [x] 洗牌（使用 `ctx.random.Shuffle()`）
  - [x] 随机发 3 张角色牌（模拟选将）
  - [x] 发初始 3 张手牌
  - [x] 初始化玩家状态

### 2.3 阶段骨架

- [x] `src/game/phases/turnStart.ts` - 回合开始
- [x] `src/game/phases/event.ts` - 事件阶段
- [x] `src/game/phases/skill.ts` - 技牌阶段
- [x] `src/game/phases/combat.ts` - 战斗阶段（含子流程）
- [x] `src/game/phases/draw.ts` - 补牌阶段
- [x] `src/game/phases/discard.ts` - 弃牌阶段
- [x] `src/game/phases/turnEnd.ts` - 回合结束

### 2.4 基础 Moves

- [x] `src/game/moves/drawCards.ts` - 摸牌
- [x] `src/game/moves/discardCards.ts` - 弃牌
- [x] `src/game/moves/skipPlay.ts` - 跳过

### 2.5 Game 主入口

- [x] `src/game/Game.ts` - 导出 XiaoyaoyouGame 对象
- [x] 配置 phases 和 turn
- [x] 配置 activePlayers

### 2.6 Spike 验证

- [x] **验证点 A：顺序响应**
  - 场景：翻开怪物后，A 队先选支援者，然后 B 队选妨碍者
  - 验证：setActivePlayers 能否实现"先激活 A → A 操作完 → 再激活 B"

- [x] **验证点 B：动态轮流出牌**
  - 场景：战牌阶段，战力低的一方先出，双方交替，直到都跳过
  - 验证：通过 G 中的状态手动管理"当前轮到谁出牌"

- [x] **验证点 C：全局打断响应**
  - 场景：任何玩家受伤时，全场持有隐蛊的玩家都可响应
  - 验证：setActivePlayers 能否同时激活多人，且只采纳第一个响应

## 产出物

| 产出 | 路径 | 状态 |
|------|------|------|
| 项目骨架 | 项目根目录 | ✅ |
| GameState | `src/game/setup.ts` | ✅ |
| 7 个阶段文件 | `src/game/phases/*.ts` | ✅ |
| 基础 Moves | `src/game/moves/*.ts` | ✅ |
| Game 主入口 | `src/game/Game.ts` | ✅ |
| Spike 验证结果 | 本文件 | ✅ |

## 关键配置

### boardgame.io Game 对象

```typescript
// src/game/Game.ts
import type { Game } from 'boardgame.io';
import { setup } from './setup';
import { turnStartPhase } from './phases/turnStart';
import { eventPhase } from './phases/event';
import { skillPhase } from './phases/skill';
import { combatPhase } from './phases/combat';
import { drawPhase } from './phases/draw';
import { discardPhase } from './phases/discard';
import { turnEndPhase } from './phases/turnEnd';
import type { GameState } from '../shared/types/game';

export const XiaoyaoyouGame: Game<GameState> = {
  name: 'xiaoyaoyou',
  setup,
  phases: {
    turnStart: turnStartPhase,
    event: eventPhase,
    skill: skillPhase,
    combat: combatPhase,
    draw: drawPhase,
    discard: discardPhase,
    turnEnd: turnEndPhase,
  },
  turn: { minMoves: 0, maxMoves: Infinity },
  endIf: ({ G }) => {
    if (G.isGameOver) return { winner: G.winnerTeam };
    return undefined;
  },
};
```

### activePlayers 配置模式

```typescript
// 选择支援者：只激活当前玩家
events.setActivePlayers({ currentPlayer: 'selectSupporter' });

// 选择妨碍者：激活敌方所有存活玩家
events.setActivePlayers({
  value: Object.fromEntries(enemyPlayerIds.map(pid => [pid, 'selectHinderer'])),
});

// 翻怪：恢复当前玩家控制
events.setActivePlayers({ currentPlayer: 'revealMonster' });
```

## Spike 验证结果

### 验证点 A：顺序响应

**结果**：✅ 通过

**结论**：
- `setActivePlayers({ currentPlayer: 'stageName' })` 可以精确控制激活哪个玩家
- 可以在 move 中调用 `setActivePlayers({ value: { [enemyId]: 'stageName' } })` 动态切换到敌方
- boardgame.io 会自动管理阶段切换，支持"先激活 A → A 操作完 → 再激活 B"的模式
- **可行方案**：战斗阶段用 `setActivePlayers` 管理支援者/妨碍者选择流程

### 验证点 B：动态轮流出牌

**结果**：✅ 通过

**结论**：
- 通过 `G.combat.currentPlayerId` 手动管理出牌顺序
- 不依赖 boardgame.io 的 turn 系统，完全手动控制
- 可以灵活切换出牌方（玩家 ↔ 怪物）
- **可行方案**：战牌阶段用 G 状态管理出牌顺序，出牌/跳过 move 中切换 currentPlayerId

### 验证点 C：全局打断响应

**结果**：✅ 通过

**结论**：
- `setActivePlayers({ all: 'stageName' })` 可同时激活多人
- 通过 `G.pendingInterrupts` 记录已响应的玩家
- 在 move 中检查 `respondedPlayerIds.length > 0` 避免重复处理
- **可行方案**：隐蛊/冰心诀用 pendingInterrupts + setActivePlayers({ all }) 实现

## 风险与阻塞

| 风险 | 影响 | 应对 | 状态 |
|------|------|------|------|
| boardgame.io 不支持复杂打断 | 无法实现隐蛊/冰心诀 | Spike 验证，必要时调整方案 | ✅ 已验证可行 |
| activePlayers 配置复杂 | 战斗阶段流转困难 | 参考官方文档和示例 | ✅ 已验证可行 |
| 阶段嵌套过深 | 代码难维护 | 战斗子流程用 stages 实现 | ✅ 已实现 |

## 测试验证

- [x] 项目能正常启动（`npm run dev`）
- [x] TypeScript 编译通过（0 errors）
- [x] Vite 构建成功
- [x] 三个 Spike 验证点均通过

## 备注

### 开发发现

1. **boardgame.io API 签名**：Move 和 Phase hooks 接收 `{ G, ctx, events, random }` 上下文对象，而非独立的 `(G, ctx)` 参数。`events` 和 `random` 在上下文对象上，不在 `ctx` 上。

2. **playerID 位置**：`playerID` 在 move 的上下文对象上（`ctx.playerID`），但 TypeScript 类型定义中 `Ctx` 不包含此字段，需用 `(ctx as any).playerID`。

3. **setActivePlayers 回退**：恢复默认控制时使用 `events.setActivePlayers({})` 而非 `events.setActivePlayers({ currentPlayer: true })`。

4. **类型对齐**：Phase 1 的 `HeroInstance`/`CardInstance`/`MonsterInstance` 使用 `staticId`（number）引用静态定义，setup.ts 需要匹配此模式。

5. **CombatStage 枚举**：已在 Phase 1 的 `enums.ts` 中定义，包含 `SUPPORT`、`HINDER`、`REVEAL`、`HIT_CHECK`、`PLAY_CARD`、`SETTLE`、`END` 七个值。

### Phase 3 衔接

Phase 2 产出的骨架已预留以下扩展点：
- `skill.ts` 的 `playTechCard` move → Phase 3 实现 15 张技牌效果
- `combat.ts` 的 `playCombatCard` move → Phase 3 实现 17 张战牌效果
- `combat.ts` 的 `revealMonster` → Phase 5 实现出场效果
- `combat.ts` 的 `endCombat` → Phase 5 实现胜利/失败效果
- `pendingInterrupts` 结构 → Phase 3 实现隐蛊/冰心诀打断窗口
