# Phase 5 开发 Prompt：怪物/NPC 效果引擎

> 将以下 prompt 整段交给 Claude Code 执行。

---

## Prompt

你是仙剑逍遥游（Xianjian Xiaoyoyou）Web 版的开发者。本项目基于 boardgame.io + React + TypeScript，重写自 C# WPF 原版。

**你的任务**：实现 Phase 5 —— 20 个怪物的完整效果和 NPC 系统。

---

### 0. 核心约束（违反即错误）

1. **C# 源码是唯一真相来源** — 每行效果代码必须有 C# 源码对照。C# 参考文件：
   - 怪物效果：`reference/psd48-master/PSDGamepkg/JNS/FG04.cs`（`MonsterCottage` 类）
   - NPC 效果：`reference/psd48-master/PSDGamepkg/JNS/NC303.cs`（`NPCCottage` 类）
2. **G 必须纯数据可序列化** — 禁止存入函数、类实例；卡牌只存 instanceId（字符串）。
3. **Moves 必须纯函数** — 签名 `(G, ctx) => void`，只能修改 G，禁止 `Math.random()`（用 `ctx.random`）。
4. **UI 状态与游戏状态分离** — G 只存游戏数据。
5. **严格按 scope.md** — 不实现不在范围内的功能。

---

### 1. 你需要创建的文件

| 文件 | 用途 |
|------|------|
| `src/game/monsters/types.ts` | 怪物/NPC 效果接口定义 |
| `src/game/monsters/index.ts` | 怪物效果注册表（按 Code 索引） |
| `src/game/monsters/effects.ts` | 20 个怪物的 4 效果槽位实现 |
| `src/game/monsters/npc.ts` | 26 个 NPC 的 9 种效果实现 |
| `src/game/monsters/npcRegistry.ts` | NPC 效果注册表 |
| `src/game/engine/melee.ts` | 混战机制（NPC/怪物翻到时的处理） |
| `src/game/engine/pile.ts` | 牌堆管理（怪物牌堆初始化、重洗） |

**需修改的文件：**

| 文件 | 修改内容 |
|------|----------|
| `src/game/phases/combat.ts` | 在 `revealMonster` 中触发 DEBUT 效果；在 `endCombat` 中触发 WIN/LOSE 效果 |
| `src/game/setup.ts` | 调用 pile.ts 初始化怪物牌堆 |

---

### 2. 架构设计

#### 2.1 怪物效果接口（`types.ts`）

```typescript
import { GameState } from '../../shared/types/game';
import { MonsterEffectSlot } from '../../shared/types/monster';

/** 怪物效果执行上下文 */
export interface MonsterEffectContext {
  /** 当前回合玩家 ID（触发者/Rounder） */
  rounderId: string;
  /** 支援者玩家 ID */
  supporterId: string | null;
  /** 妨碍者玩家 ID */
  hindererId: string | null;
  /** 怪物实例 ID */
  monsterInstanceId: string;
  /** 随机数生成器 */
  random: {
    Number: () => number;
    Die: (sides: number) => number;
    Shuffle: <T>(arr: T[]) => T[];
  };
}

/** 怪物效果函数类型 */
export type MonsterEffectFn = (
  G: GameState,
  ctx: MonsterEffectContext
) => void;

/** 怪物效果定义 */
export interface MonsterEffectDefinition {
  /** 怪物编码（如 "GS01"） */
  code: string;
  /** 效果槽位 */
  slot: MonsterEffectSlot;
  /** 效果执行函数 */
  effect: MonsterEffectFn;
}

/** NPC 效果执行上下文 */
export interface NpcEffectContext {
  /** 当前回合玩家 ID */
  playerId: string;
  /** NPC 实例 ID */
  npcInstanceId: string;
  /** 随机数生成器 */
  random: {
    Number: () => number;
    Die: (sides: number) => number;
    Shuffle: <T>(arr: T[]) => T[];
  };
}

/** NPC 效果函数类型 */
export type NpcEffectFn = (
  G: GameState,
  ctx: NpcEffectContext
) => void;

/** NPC 效果定义 */
export interface NpcEffectDefinition {
  /** NPC 编码（如 "NJ01"） */
  code: string;
  /** 效果执行函数 */
  effect: NpcEffectFn;
}
```

#### 2.2 怪物效果注册表（`index.ts`）

```typescript
import { MonsterEffectSlot } from '../../shared/types/monster';
import { MonsterEffectDefinition } from './types';

export class MonsterEffectRegistry {
  /** 按怪物编码+槽位索引 */
  private effects: Map<string, MonsterEffectDefinition> = new Map();

  private makeKey(code: string, slot: MonsterEffectSlot): string {
    return `${code}:${slot}`;
  }

  register(def: MonsterEffectDefinition): void {
    const key = this.makeKey(def.code, def.slot);
    this.effects.set(key, def);
  }

  registerAll(defs: MonsterEffectDefinition[]): void {
    for (const def of defs) this.register(def);
  }

  get(code: string, slot: MonsterEffectSlot): MonsterEffectDefinition | undefined {
    return this.effects.get(this.makeKey(code, slot));
  }

  has(code: string, slot: MonsterEffectSlot): boolean {
    return this.effects.has(this.makeKey(code, slot));
  }

  get size(): number { return this.effects.size; }
}

export const monsterEffectRegistry = new MonsterEffectRegistry();
```

#### 2.3 NPC 效果注册表（`npcRegistry.ts`）

```typescript
import { NpcEffectDefinition } from './types';

export class NpcEffectRegistry {
  private effects: Map<string, NpcEffectDefinition> = new Map();

  register(def: NpcEffectDefinition): void {
    this.effects.set(def.code, def);
  }

  registerAll(defs: NpcEffectDefinition[]): void {
    for (const def of defs) this.register(def);
  }

  get(code: string): NpcEffectDefinition | undefined {
    return this.effects.get(code);
  }

  has(code: string): boolean {
    return this.effects.has(code);
  }

  get size(): number { return this.effects.size; }
}

export const npcEffectRegistry = new NpcEffectRegistry();
```

#### 2.4 怪物/NPC 系统入口

在 `src/game/monsters/monsterSystem.ts` 中：

```typescript
export class MonsterEffectSystem {
  private monsterRegistry = monsterEffectRegistry;
  private npcRegistry = npcEffectRegistry;
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    this.monsterRegistry.registerAll(aquaMonsters);   // 水属性
    this.monsterRegistry.registerAll(agniMonsters);    // 火属性
    this.monsterRegistry.registerAll(thunderMonsters); // 雷属性
    this.monsterRegistry.registerAll(aeroMonsters);    // 风属性
    this.monsterRegistry.registerAll(saturnMonsters);  // 土属性
    this.npcRegistry.registerAll(npcEffects);
    this.initialized = true;
  }

  /** 执行怪物效果 */
  executeMonsterEffect(
    G: GameState, code: string, slot: MonsterEffectSlot, ctx: MonsterEffectContext
  ): void {
    const def = this.monsterRegistry.get(code, slot);
    if (def) def.effect(G, ctx);
  }

  /** 执行 NPC 效果 */
  executeNpcEffect(
    G: GameState, code: string, ctx: NpcEffectContext
  ): void {
    const def = this.npcRegistry.get(code);
    if (def) def.effect(G, ctx);
  }
}

export const monsterEffectSystem = new MonsterEffectSystem();
```

---

### 3. 怪物效果实现细节

**C# 参考**：`reference/psd48-master/PSDGamepkg/JNS/FG04.cs` 中的 `MonsterCottage` 类。

**关键辅助函数**（复用 `src/game/skills/effects.ts` 的模式）：

```typescript
import {
  dealDamage,
  healTarget,
  drawCards,
  discardCards,
  immobilizeTarget,
  obtainPet,
  losePet,
} from '../skills/effects';
```

#### 3.1 获取角色性别

```typescript
import heroes from '../../shared/data/heroes.json';

function getHeroGender(G: GameState, playerId: string): string | null {
  const player = G.players[playerId];
  if (!player) return null;
  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return null;
  const heroDef = heroes.find(h => h.ID === hero.staticId);
  return heroDef?.GENDER ?? null;
}
```

#### 3.2 获取角色战力/手牌数/装备数

```typescript
function getHeroStr(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  if (!player) return 0;
  const hero = G.heroInstances[player.heroInstanceId];
  return hero?.currentStr ?? 0;
}

function getHandCount(G: GameState, playerId: string): number {
  return G.players[playerId]?.hand.length ?? 0;
}

function getEquipCount(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  if (!player) return 0;
  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return 0;
  let count = 0;
  if (hero.equipment.weapon) count++;
  if (hero.equipment.armor) count++;
  if (hero.equipment.special) count++;
  return count;
}
```

#### 3.3 获取队伍成员

```typescript
function getTeammateIds(G: GameState, playerId: string): string[] {
  const player = G.players[playerId];
  if (!player) return [];
  return Object.entries(G.players)
    .filter(([id, p]) => p.isAlive && p.team === player.team && id !== playerId)
    .map(([id]) => id);
}

function getEnemyIds(G: GameState, playerId: string): string[] {
  const player = G.players[playerId];
  if (!player) return [];
  return Object.entries(G.players)
    .filter(([, p]) => p.isAlive && p.team !== player.team)
    .map(([id]) => id);
}
```

#### 3.4 获取宠物数量（Web 版：单宠物，0 或 1）

```typescript
function getPetCount(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  if (!player) return 0;
  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero || !hero.pet) return 0;
  return 1;
}
```

---

### 4. 20 个怪物效果（C# 源码对照）

**务必参照 `reference/psd48-master/PSDGamepkg/JNS/FG04.cs` 中每个方法的实现。**

怪物效果有 4 个槽位：DEBUT（出场）、PET（宠物）、WIN（胜利）、LOSE（失败）。

#### 水属性（GS 系列）

**GS01 千杯不醉**（C#: `GS01Debut`, `GS01LoseEff`）
- DEBUT: 与妨碍者手牌对调（C#: `G0HQ,4` 消息）
- LOSE: 触发者横置（C#: `G0DS` 消息）
- PET: 主人战力+1

```typescript
// GS01 出场效果
effect: (G, ctx) => {
  const rounder = G.players[ctx.rounderId];
  const hinderer = ctx.hindererId ? G.players[ctx.hindererId] : null;
  if (!rounder || !hinderer || !hinderer.isAlive) return;

  // 交换双方手牌
  const rounderHand = [...rounder.hand];
  const hindererHand = [...hinderer.hand];
  rounder.hand = hindererHand;
  hinderer.hand = rounderHand;
}
```

**GS02 五毒兽**（C#: `GS02WinEff`, `GS02LoseEff`）
- WIN: 敌全体 HP-1，指定 1 人额外 HP-2（C#: `Harm` + `AsyncInput`）
- LOSE: HP-2，失去 1 装备（C#: `Harm` + `G0QZ`）
- PET: 宠物战力变 8

```typescript
// GS02 胜利效果
effect: (G, ctx) => {
  const enemies = getEnemyIds(G, ctx.rounderId);
  // 敌全体 HP-1
  for (const eid of enemies) {
    dealDamage(G, eid, 1);
  }
  // 指定 1 人额外 HP-2（需要 pendingChoice）
}
```

**GS03 蛇妖男**（C#: `GS03WinEff`, `GS03LoseEff`）
- WIN: 妨碍者 HP-4
- LOSE: 触发者 HP-4

**GS04 水魔兽**（C#: `GS04WinEff`, `GS04LoseEff`）
- WIN: 敌全体 HP-1，抽妨碍者 1 牌（C#: `Harm` + `G0HQ`）
- LOSE: HP-2，妨碍者抽触发者 1 牌

#### 火属性（GH 系列）

**GH01 赝月**（C#: `GH01WinEff`, `GH01LoseEff`）
- WIN: 妨碍者 HP-2
- LOSE: 触发者 HP-3

**GH02 肥肥**（C#: `GH02WinEff`, `GH02LoseEff`）
- WIN: 妨碍者 HP-3
- LOSE: 触发者 HP-3
- PET: 爆发战力+3

**GH03 狐妖女**（C#: `GH03Debut`, `GH03WinEff`, `GH03LoseEff`）
- DEBUT: 支援者受伤=战力-1（C#: `Harm(Supporter, STR-1)`）
- WIN: 妨碍者 HP-3
- LOSE: 敌方指定 2 人各 HP-3（需要 pendingChoice）

**GH04 熔岩兽王**（C#: `GH04Debut`, `GH04WinEff`, `GH04LoseEff`）
- DEBUT: 全体 HP-2（C#: `Harm(all alive, 2)`）
- WIN: 敌全体 HP-2
- LOSE: 触发者与支援者各 HP-2

#### 雷属性（GL 系列）

**GL01 积粮隐者**（C#: `GL01WinEff`, `GL01LoseEff`）
- WIN: 指定 1 人 HP+2（需要 pendingChoice）
- LOSE: 触发者 HP-3

**GL02 赤鬼王**（C#: `GL02Debut`, `GL02WinEff`, `GL02LoseEff`）
- DEBUT: 支援者战力+2（C#: `G0IA` 消息）
- WIN: 指定 1 人补 2 张（需要 pendingChoice）
- LOSE: HP-2，失去全部装备

**GL03 毒娘子**（C#: `GL03WinEff`, `GL03LoseEff`）
- WIN: 弃手牌/装备每张 HP+2（需要 pendingChoice 选择弃哪些）
- LOSE: 失去 1 装备，装备最多者各失 1

**GL04 邪剑仙**（C#: `GL04WinEff`, `GL04LoseEff`）
- WIN: 己方每人补牌=装备数（C#: `G0DH` 消息）
- LOSE: 己方全体 HP-2
- PET/PRESENT: 敌方武器无效（`IncrAction`/`DecrAction`）

#### 风属性（GF 系列）

**GF01 叶灵**（C#: `GF01WinEff`, `GF01LoseEff`）
- WIN: 触发者补 1 张
- LOSE: 触发者 HP-2

**GF02 暗香**（C#: `GF02WinEff`, `GF02LoseEff`）
- WIN: 触发者 HP+2
- LOSE: 全体 HP+2，宠物战力+1
- PET: 主人战力+1

**GF03 句芒**（C#: `GF03WinEff`, `GF03LoseEff`）
- WIN: 触发者与支援者各 HP+2
- LOSE: 全体交换手牌后各 HP-2，宠物爆发
- PET: 宠物爆发

**GF04 蝶精**（C#: `GF04WinEff`）
- WIN: 敌方 1 人 HP+2（需要 pendingChoice）
- PET: 爆发满血复活

#### 土属性（GT 系列）

**GT01 璇龟**（C#: `GT01WinEff`, `GT01LoseEff`）
- WIN: 触发者与支援者各 HP-3
- LOSE: 妨碍者 HP-3

**GT02 刑天**（C#: `GT02Debut`）
- DEBUT: 非参战者按手牌数扣血（C#: `Harm(pys, pys.Select(p => p.Tux.Count))`）

**GT03 金蟾鬼母**（C#: `GT03Debut`, `GT03WinEff`, `GT03LoseEff`）
- DEBUT: 本场战力+3（C#: `G0IB` 消息）
- WIN: 敌全体 HP-1
- LOSE: 己方全体 HP-2
- PET: 宠物可当参战者

**GT04 天鬼皇**（C#: `GT04LoseEff`）
- LOSE: 可替换敌方土属性宠物（需要 pendingChoice）
- PET: 宠物可当参战者

---

### 5. NPC 效果实现

**C# 参考**：`reference/psd48-master/PSDGamepkg/JNS/NC303.cs` 中的 `NPCCottage` 类。

NPC 有 9 种效果类型（NJ01-NJ09）：

| 编码 | 效果 | C# 方法 |
|------|------|---------|
| NJ01 | 加入：弃全部手牌，替换角色，HP=手牌数×2 | `NJ01Action` |
| NJ02 | 治疗：指定 1 人+1HP | `NJ02Action` |
| NJ03 | 修炼：自己-1HP，指定 1 人补 1 张 | `NJ03Action` |
| NJ04 | 传功：补 1 张 | `NJ04Action` |
| NJ05 | 袭击：指定 1 人-1HP | `NJ05Action` |
| NJ06 | 交易：指定 1 人交 1 张手牌给队友 | `NJ06Action` |
| NJ07 | 驯化：指定 1 人交 1 只宠物给队友 | `NJ07Action` |
| NJ08 | 盗窃：弃掉任意玩家 1 张手牌 | `NJ08Action` |
| NJ09 | 助战：暂存，战斗中弃掉+1 战力 | `NJ09Action` |

每个 NPC 在 `npcs.json` 中有 `ACTION` 字段（如 `"NJ01,NJ09"`），表示该 NPC 拥有哪些效果。

#### NJ01 加入（C#: `NJ01Action`）

```typescript
// 加入效果：弃全部手牌，替换角色，HP=手牌数×2
effect: (G, ctx) => {
  const player = G.players[ctx.playerId];
  if (!player) return;

  // 1. 弃掉所有手牌
  const handCount = player.hand.length;
  if (handCount > 0) {
    discardCards(G, ctx.playerId, [...player.hand]);
  }

  // 2. 查找 NPC 关联的角色（ORG 字段）
  const npcData = npcs.find(n => n.CODE === ctx.npcCode);
  if (!npcData) return;

  // 3. 替换角色（需要 pendingChoice 选择目标）
  // 4. HP = 手牌数 × 2（如果来自技牌/事件牌，上限 3）
}
```

#### NJ02 治疗（C#: `NJ02Action`）

```typescript
effect: (G, ctx) => {
  // 指定 1 人+1HP（需要 pendingChoice 选择目标）
}
```

#### NJ03 修炼（C#: `NJ03Action`）

```typescript
effect: (G, ctx) => {
  // 自己-1HP
  dealDamage(G, ctx.playerId, 1);
  // 指定 1 人补 1 张（需要 pendingChoice 选择目标）
}
```

#### NJ04 传功（C#: `NJ04Action`）

```typescript
effect: (G, ctx) => {
  drawCards(G, ctx.playerId, 1);
}
```

#### NJ05 袭击（C#: `NJ05Action`）

```typescript
effect: (G, ctx) => {
  // 指定 1 人-1HP（需要 pendingChoice 选择目标）
}
```

#### NJ06 交易（C#: `NJ06Action`）

```typescript
// 多步选择：先选交出者，再选接收者，再选具体卡牌
effect: (G, ctx) => {
  // 1. 选择交出牌的玩家（pendingChoice）
  // 2. 选择交予牌的玩家（pendingChoice）
  // 3. 选择具体卡牌（pendingChoice）
  // 4. 执行转移
}
```

#### NJ07 驯化（C#: `NJ07Action`）

```typescript
// 多步选择：先选交出宠物的玩家，再选接收者，再选具体宠物
effect: (G, ctx) => {
  // 1. 选择交出宠物的玩家（pendingChoice）
  // 2. 选择接收宠物的玩家（pendingChoice）
  // 3. 选择具体宠物（pendingChoice）
  // 4. 执行转移（使用 obtainPet/losePet）
}
```

#### NJ08 盗窃（C#: `NJ08Action`）

```typescript
effect: (G, ctx) => {
  // 选择目标玩家（pendingChoice）
  // 弃掉其 1 张手牌（需要 pendingChoice 选择卡牌）
}
```

#### NJ09 助战（C#: `NJ09Action`）

```typescript
// 助战是特殊效果：NPC 不立即执行，而是暂存到助战区
// 战斗中弃掉时触发 +1 战力
effect: (G, ctx) => {
  // 将 NPC 放入玩家的助战区（需要在 PlayerState 或 HeroInstance 中添加字段）
  // 或者标记为"已使用"状态
}
```

**注意**：NJ09 助战需要在 `PlayerState` 或 `HeroInstance` 中添加 `escue: string[]` 字段来存储助战 NPC。这是当前类型定义中缺失的，需要补充。

---

### 6. 混战机制（`src/game/engine/melee.ts`）

翻到 NPC 时的特殊处理：

```typescript
import { GameState } from '../../shared/types/game';
import { npcs } from '../../shared/data';

/**
 * 判断翻到的是否为 NPC
 */
export function isNpc(G: GameState, instanceId: string): boolean {
  return instanceId in G.npcInstances;
}

/**
 * 判断翻到的是否为怪物
 */
export function isMonster(G: GameState, instanceId: string): boolean {
  return instanceId in G.monsterInstances;
}

/**
 * 获取 NPC 的行动编码列表
 */
export function getNpcActions(instanceId: string): string[] {
  const npcData = npcs.find(n => n.ID === /* 需要从 instanceId 解析 staticId */);
  if (!npcData) return [];
  return npcData.ACTION.split(',').map(a => a.trim());
}
```

**混战规则**（来自 phase-5.md）：
- 翻到 NPC 时：触发方战力 + NPC 战力（倾慕者 ×2）
- 翻到怪物时：怪物方战力 + 新怪物战力，新怪物出场效果和闪避无效
- 双怪物结算：胜利两个都入宠物区，失败依次执行两个失败效果

---

### 7. 牌堆管理（`src/game/engine/pile.ts`）

```typescript
import { GameState } from '../../shared/types/game';

/**
 * 怪物牌堆初始化（已在 setup.ts 中实现）
 * 此文件处理牌堆耗尽后的重洗逻辑
 */

/**
 * 检查怪物牌堆是否为空，若空则重洗弃牌堆中的怪物/NPC 牌
 */
export function reshuffleMonsterPileIfNeeded(
  G: GameState,
  random: { Shuffle: <T>(arr: T[]) => T[] }
): void {
  if (G.piles.monsterPile.length > 0) return;

  // 从弃牌堆中回收怪物/NPC 牌
  const monsterCardsInDiscard = G.piles.discardPile.filter(id => {
    return id in G.monsterInstances || id in G.npcInstances;
  });

  if (monsterCardsInDiscard.length === 0) return;

  // 移除弃牌堆中的怪物/NPC 牌
  G.piles.discardPile = G.piles.discardPile.filter(id =>
    !(id in G.monsterInstances) && !(id in G.npcInstances)
  );

  // 洗回怪物牌堆
  const reshuffled = random.Shuffle(monsterCardsInDiscard);
  G.piles.monsterPile.push(...reshuffled);
}
```

---

### 8. 集成到战斗阶段

修改 `src/game/phases/combat.ts`：

#### 8.1 在 `revealMonster` 中触发 DEBUT 效果

```typescript
revealMonster: ({ G, ctx, random }) => {
  if (!G.combat) return;

  if (G.piles.monsterPile.length === 0) {
    G.isGameOver = true;
    return;
  }

  const monsterInstanceId = G.piles.monsterPile.shift();
  if (!monsterInstanceId) return;

  G.combat.monsterInstanceId = monsterInstanceId;
  G.combat.stage = CombatStage.PLAY_CARD;

  // 计算战力
  const rounderPlayer = G.players[G.currentPlayerId];
  const monster = G.monsterInstances[monsterInstanceId];
  if (rounderPlayer && monster) {
    const heroInst = G.heroInstances[rounderPlayer.heroInstanceId];
    if (heroInst) {
      G.combat.attackerPool = calculateFinalPower(G, heroInst.instanceId);
    }
    G.combat.monsterPool = monster.currentStr;
  }

  // 确定谁先出牌
  if (G.combat.attackerPool <= G.combat.monsterPool) {
    G.combat.currentPlayerId = G.currentPlayerId;
  } else {
    G.combat.currentPlayerId = 'monster';
  }

  // ★ 触发怪物出场效果（DEBUT）
  if (monster) {
    const monsterData = monsters.find(m => m.ID === monster.staticId);
    if (monsterData) {
      monsterEffectSystem.executeMonsterEffect(
        G, monsterData.CODE, MonsterEffectSlot.DEBUT,
        {
          rounderId: G.currentPlayerId,
          supporterId: G.combat.supporterPlayerId,
          hindererId: G.combat.hindererPlayerId,
          monsterInstanceId,
          random,
        }
      );
    }
  }

  // ★ 如果翻到的是 NPC，执行 NPC 效果
  if (isNpc(G, monsterInstanceId)) {
    const npcInst = G.npcInstances[monsterInstanceId];
    if (npcInst) {
      const npcData = npcs.find(n => n.ID === npcInst.staticId);
      if (npcData) {
        const actions = npcData.ACTION.split(',').map(a => a.trim());
        // 执行第一个可用的 NPC 效果
        for (const actionCode of actions) {
          monsterEffectSystem.executeNpcEffect(
            G, actionCode,
            {
              playerId: G.currentPlayerId,
              npcInstanceId: monsterInstanceId,
              random,
            }
          );
        }
      }
    }
  }
},
```

#### 8.2 在 `endCombat` 中触发 WIN/LOSE 效果

```typescript
endCombat: ({ G, events, random }) => {
  if (!G.combat) return;

  G.combat.stage = CombatStage.SETTLE;

  let result: 'WIN' | 'LOSE' | 'DRAW';
  if (G.combat.result === 'DRAW') {
    result = 'DRAW';
  } else if (G.combat.attackerPool >= G.combat.monsterPool) {
    result = 'WIN';
  } else {
    result = 'LOSE';
  }
  G.combat.result = result;

  // ★ 触发怪物胜利/失败效果
  const monsterInstanceId = G.combat.monsterInstanceId;
  const monster = G.monsterInstances[monsterInstanceId];
  if (monster) {
    const monsterData = monsters.find(m => m.ID === monster.staticId);
    if (monsterData) {
      const effectCtx: MonsterEffectContext = {
        rounderId: G.currentPlayerId,
        supporterId: G.combat.supporterPlayerId,
        hindererId: G.combat.hindererPlayerId,
        monsterInstanceId,
        random,
      };

      if (result === 'WIN') {
        // 胜利：触发者获得宠物，执行 WIN 效果
        monsterEffectSystem.executeMonsterEffect(
          G, monsterData.CODE, MonsterEffectSlot.WIN, effectCtx
        );
        // 获得宠物
        obtainPet(G, G.currentPlayerId, monsterInstanceId);
        // 执行 PET 效果
        monsterEffectSystem.executeMonsterEffect(
          G, monsterData.CODE, MonsterEffectSlot.PET, effectCtx
        );
      } else if (result === 'LOSE') {
        // 失败：执行 LOSE 效果
        monsterEffectSystem.executeMonsterEffect(
          G, monsterData.CODE, MonsterEffectSlot.LOSE, effectCtx
        );
      }
    }
  }

  G.combat.isFinished = true;
  G.combat = null;
  events.setActivePlayers({});
},
```

---

### 9. 测试验证

完成实现后，确保以下测试场景通过：

1. **20 个怪物的 4 个效果槽位正确执行**
2. **GS01 千杯不醉**：出场与妨碍者手牌对调，失败横置
3. **GH04 熔岩兽王**：出场全体 HP-2，胜利敌全体 HP-2
4. **GT02 刑天**：出场非参战者按手牌数扣血
5. **NJ01 加入**：弃全部手牌，替换角色，HP=手牌数×2
6. **NJ06 交易**：多步选择正确执行
7. **NJ09 助战**：暂存到助战区，战斗中触发
8. **宠物同属性唯一性**：同属性宠物替换旧的
9. **牌堆耗尽后自动重洗**
10. **NPC 翻到时触发效果**

编写单元测试文件：`src/tests/game/monsters/` 目录下。

---

### 10. 参考文档

| 文档 | 用途 |
|------|------|
| `reference/psd48-master/PSDGamepkg/JNS/FG04.cs` | **C# 原版怪物效果实现**（唯一真相） |
| `reference/psd48-master/PSDGamepkg/JNS/NC303.cs` | **C# 原版 NPC 效果实现**（唯一真相） |
| `reference/docs/card-info.md` | 卡牌信息全表（含怪物/NPC 描述） |
| `reference/docs/scope.md` | 功能范围约束 |
| `route/phase-tracking/phase-5.md` | 任务清单和设计决策 |
| `src/shared/types/monster.ts` | 怪物类型定义（MonsterEffectSlot、SpiMask） |
| `src/shared/types/card.ts` | 卡牌实例类型（MonsterInstance、NpcInstance） |
| `src/shared/types/game.ts` | GameState 类型定义 |
| `src/shared/data/monsters.json` | 怪物静态数据（20 个怪物） |
| `src/shared/data/npcs.json` | NPC 静态数据（26 个 NPC） |
| `src/game/phases/combat.ts` | 战斗阶段（需修改） |
| `src/game/engine/combat.ts` | 战力计算引擎 |
| `src/game/skills/effects.ts` | 效果工具函数（复用） |
| `src/game/setup.ts` | 游戏初始化（怪物牌堆） |

---

### 11. 开发顺序建议

1. 先创建 `types.ts` 和 `index.ts`（怪物注册表框架）
2. 创建 `npcRegistry.ts`（NPC 注册表框架）
3. 实现简单怪物效果（无玩家选择的：GS01、GH01、GH02、GH04、GF01、GF02、GT01、GT02）
4. 实现需要玩家选择的怪物效果（GS02、GS03、GL01、GL02、GL03、GT04 等）
5. 实现 NPC 效果（NJ01-NJ09）
6. 创建 `melee.ts`（混战机制）
7. 创建 `pile.ts`（牌堆管理）
8. 集成到战斗阶段（修改 `combat.ts`）
9. 补充 `PlayerState` 的 `escue` 字段（NJ09 助战需要）
10. 编写测试

**开始实现。**
