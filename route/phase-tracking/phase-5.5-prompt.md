# Phase 5.5 开发 Prompt：事件牌效果系统

> 将以下 prompt 整段交给 Claude Code 执行。

---

## Prompt

你是仙剑逍遥游（Xianjian Xiaoyoyou）Web 版的开发者。本项目基于 boardgame.io + React + TypeScript，重写自 C# WPF 原版。

**你的任务**：实现 Phase 5.5 —— 14 张事件牌的完整效果系统。

---

### 0. 核心约束（违反即错误）

1. **C# 源码是唯一真相来源** — 每行效果代码必须有 C# 源码对照。C# 参考文件：`reference/psd48-master/PSDGamepkg/JNS/SJ101.cs`（`EveCottage` 类，所有事件效果在此注册）。
2. **G 必须纯数据可序列化** — 禁止存入函数、类实例；卡牌只存 instanceId（字符串）。
3. **Moves 必须纯函数** — 签名 `(G, ctx) => void`，只能修改 G，禁止 `Math.random()`（用 `ctx.random`）。
4. **UI 状态与游戏状态分离** — G 只存游戏数据。
5. **严格按 scope.md** — 不实现不在范围内的功能。

---

### 1. 你需要创建的文件

| 文件 | 用途 |
|------|------|
| `src/game/events/types.ts` | 事件效果接口定义 |
| `src/game/events/index.ts` | 事件效果注册表（按 Code 索引） |
| `src/game/events/resolver.ts` | 事件解析器（读取事件 → 执行效果） |
| `src/game/events/effects.ts` | 14 个事件的具体效果实现 |
| `src/game/events/xianjian1.ts` | 仙剑一事件（SJ101-SJ104） |
| `src/game/events/xianjian2.ts` | 仙剑二事件（SJ201-SJ202） |
| `src/game/events/xianjian3.ts` | 仙剑三事件（SJ301-SJ303） |
| `src/game/events/xianjian3w.ts` | 仙剑三外传事件（S3W01-S3W02） |
| `src/game/events/xianjian4.ts` | 仙剑四事件（SJ401-SJ402） |
| `src/game/events/xianjian5.ts` | 仙剑五事件（SJ501） |

---

### 2. 架构设计（参照技能系统模式）

#### 2.1 事件效果接口（`types.ts`）

参照 `src/game/skills/types.ts` 的 `SkillDefinition` 模式，定义：

```typescript
import { GameState } from '../../shared/types/game';

/** 事件执行上下文 */
export interface EventRuntimeContext {
  /** 当前回合玩家 ID（触发事件的玩家） */
  playerId: string;
  /** 随机数生成器 */
  random: {
    Number: () => number;
    Die: (sides: number) => number;
    Shuffle: <T>(arr: T[]) => T[];
  };
}

/** 事件效果函数类型 */
export type EventEffect = (
  G: GameState,
  ctx: EventRuntimeContext
) => void;

/** 事件效果定义 */
export interface EventEffectDefinition {
  /** 事件编码（如 "SJ101"） */
  code: string;
  /** 事件名称 */
  name: string;
  /** 效果执行函数 */
  effect: EventEffect;
}
```

#### 2.2 事件注册表（`index.ts`）

参照 `src/game/skills/index.ts` 的 `SkillRegistry` 模式：

```typescript
export class EventRegistry {
  private effectsByCode: Map<string, EventEffectDefinition> = new Map();

  register(def: EventEffectDefinition): void { ... }
  registerAll(defs: EventEffectDefinition[]): void { ... }
  getByCode(code: string): EventEffectDefinition | undefined { ... }
  getAll(): EventEffectDefinition[] { ... }
  get size(): number { return this.effectsByCode.size; }
}

export const eventRegistry = new EventRegistry();
```

#### 2.3 事件解析器（`resolver.ts`）

参照 `src/game/skills/resolver.ts` 的 `SkillResolver` 模式：

```typescript
export class EventResolver {
  private registry: EventRegistry;

  constructor(registry: EventRegistry) { this.registry = registry; }

  /**
   * 解析并执行事件效果
   * @param G - 游戏状态
   * @param eventCode - 事件编码（如 "SJ101"）
   * @param ctx - 事件执行上下文
   */
  resolve(G: GameState, eventCode: string, ctx: EventRuntimeContext): void {
    const def = this.registry.getByCode(eventCode);
    if (def) {
      def.effect(G, ctx);
    }
  }
}

export const eventResolver = new EventResolver(eventRegistry);
```

#### 2.4 事件系统入口（`src/game/events/eventSystem.ts`）

参照 `src/game/skills/skillSystem.ts` 的 `SkillSystem` 模式：

```typescript
export class EventSystem {
  private registry = eventRegistry;
  private resolver = eventResolver;
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    this.registry.registerAll(xianjian1Events);
    this.registry.registerAll(xianjian2Events);
    this.registry.registerAll(xianjian3Events);
    this.registry.registerAll(xianjian3wEvents);
    this.registry.registerAll(xianjian4Events);
    this.registry.registerAll(xianjian5Events);
    this.initialized = true;
  }

  resolve(G: GameState, eventCode: string, ctx: EventRuntimeContext): void {
    this.resolver.resolve(G, eventCode, ctx);
  }
}

export const eventSystem = new EventSystem();
```

---

### 3. 事件效果实现细节

**C# 参考**：`reference/psd48-master/PSDGamepkg/JNS/SJ101.cs` 中的 `EveCottage` 类。

**关键辅助函数**（在 `effects.ts` 中复用 `src/game/skills/effects.ts` 的模式）：

```typescript
// 从 skills/effects.ts 复用以下函数（直接 import）：
import {
  dealDamage,
  healTarget,
  drawCards,
  discardCards,
  immobilizeTarget,
  getAliveTeammateIds,
  getAliveEnemyIds,
} from '../skills/effects';
```

#### 3.1 获取角色性别

事件 SJ101 需要判断角色性别。从 `heroes.json` 加载静态数据，通过 `HeroInstance.staticId` 查找：

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

#### 3.2 获取宠物数量

**注意**：Web 版中 `HeroInstance.pet` 是单个宠物（`string | null`），不是数组。宠物数量为 0 或 1：

```typescript
function getPetCount(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  if (!player) return 0;
  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero || !hero.pet) return 0;
  return 1;
}
```

#### 3.3 获取角色战力

```typescript
function getHeroStr(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  if (!player) return 0;
  const hero = G.heroInstances[player.heroInstanceId];
  return hero?.currentStr ?? 0;
}
```

#### 3.4 获取角色手牌数

```typescript
function getHandCount(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  return player?.hand.length ?? 0;
}
```

#### 3.5 获取角色HP

```typescript
function getHeroHp(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  if (!player) return 0;
  const hero = G.heroInstances[player.heroInstanceId];
  return hero?.currentHp ?? 0;
}
```

#### 3.6 获取队伍成员

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

---

### 4. 14 张事件效果（C# 源码对照）

**务必参照 `reference/psd48-master/PSDGamepkg/JNS/SJ101.cs` 中每个方法的实现。**

#### 仙剑一（4张）

**SJ101 仙灵岛的邂逅**（C#: `SJ101(Player rd)`）
- SPI: `H`
- 如果 `rd.Gender == 'M'`：补1张牌，扣1HP（`Harm(null, rd, 1, FiveElement.THUNDER)`）
- 如果 `rd.Gender == 'F'`：弃掉防具（`rd.Armor`），然后可对一名男性角色使用【天雷破】（`G0CC` 消息，JP05 = 天雷破卡牌编码）

```typescript
// SJ101 效果伪代码
effect: (G, ctx) => {
  const gender = getHeroGender(G, ctx.playerId);
  if (gender === 'M') {
    drawCards(G, ctx.playerId, 1);
    dealDamage(G, ctx.playerId, 1);
  } else if (gender === 'F') {
    // 弃掉防具
    const hero = G.heroInstances[G.players[ctx.playerId].heroInstanceId];
    if (hero?.equipment.armor) {
      discardCards(G, ctx.playerId, [hero.equipment.armor]);
      hero.equipment.armor = null;
    }
    // 对一名男性角色使用天雷破（需要 pendingChoice 选择目标）
    const maleTargets = Object.keys(G.players).filter(id =>
      id !== ctx.playerId && G.players[id].isAlive && getHeroGender(G, id) === 'M'
    );
    if (maleTargets.length > 0) {
      // 创建 pendingChoice 等待玩家选择目标
      // 选择后执行天雷破效果（造成雷属性伤害）
    }
  }
}
```

**SJ102 深入将军冢**（C#: `SJ102(Player rd)`）
- 无宠物的角色各补1张牌
- C# 逻辑：`Where(p => p.GetPetCount() == 0)` → `G0DH` 消息

```typescript
effect: (G, ctx) => {
  const noPetPlayers = Object.keys(G.players).filter(id =>
    G.players[id].isAlive && getPetCount(G, id) === 0
  );
  for (const pid of noPetPlayers) {
    drawCards(G, pid, 1);
  }
}
```

**SJ103 走出圣姑小屋**（C#: `SJ103(Player rd)`）
- 指定己方1人和敌方1人各补2张牌
- C# 逻辑：`AsyncInput` 选择两个目标 → `G0DH` 消息

```typescript
effect: (G, ctx) => {
  // 需要 pendingChoice：
  // 1. 选择己方一人（不含自己）
  // 2. 选择敌方一人
  // 选择后各补2张牌
}
```

**SJ104 闯荡试炼窟**（C#: `SJ104(Player rd)`）
- 从手牌堆翻开4张牌，从对方开始轮流挑选
- C# 逻辑：`DequeueOfPile(TuxPiles, 4)` → `G2FU` 显示 → 循环 `AsyncInput` 选择 → `G0HQ` 获得

```typescript
effect: (G, ctx) => {
  // 1. 从手牌堆翻开4张牌放入展示区
  // 2. 从对方开始轮流选择（需要多轮 pendingChoice）
  // 3. 每人选1张分配给任意角色
  // 4. 直到4张牌分配完毕
}
```

#### 仙剑二（2张）

**SJ201 寻找天使绘卷**（C#: `SJ201(Player rd)`）
- HP<=3的角色各补1张牌
- C# 逻辑：`Where(p => p.HP <= 3)` → `G0DH` 消息

```typescript
effect: (G, ctx) => {
  const lowHpPlayers = Object.keys(G.players).filter(id =>
    G.players[id].isAlive && getHeroHp(G, id) <= 3
  );
  for (const pid of lowHpPlayers) {
    drawCards(G, pid, 1);
  }
}
```

**SJ202 破除禁咒空间**（C#: `SJ202(Player rd)`）
- 选择己方1名HP>=2的角色降至1HP，己方全体补1张
- C# 逻辑：`AsyncInput` 选择目标 → `Harm(null, leifeng, leifeng.HP - 1, ...)` → `G0DH` 全队补牌

```typescript
effect: (G, ctx) => {
  // 1. 选择己方1名HP>=2的角色（pendingChoice）
  // 2. 该角色HP降至1（实际扣 HP-1 点）
  // 3. 己方全体补1张牌
}
```

#### 仙剑三（3张）

**SJ301 三世轮回**（C#: `SJ301(Player rd)`）
- 所有玩家手牌调整为3张（多弃少补）
- C# 逻辑：`Where(p => p.Tux.Count != 3)` → 多的弃 `p.Tux.Count - 3`，少的补 `3 - p.Tux.Count`

```typescript
effect: (G, ctx) => {
  for (const [pid, player] of Object.entries(G.players)) {
    if (!player.isAlive) continue;
    const handCount = player.hand.length;
    if (handCount > 3) {
      // 弃掉多余的手牌（需要 pendingChoice 让玩家选择弃哪些）
      const discardCount = handCount - 3;
      // 创建 pendingChoice 让玩家选择 discardCount 张牌弃置
    } else if (handCount < 3) {
      drawCards(G, pid, 3 - handCount);
    }
  }
}
```

**SJ302 神树与夕瑶**（C#: `SJ302(Player rd)`）
- HP最少的角色各恢复2HP
- C# 逻辑：`Min(p => p.HP)` → `Cure(null, where HP == minHp, 2)`

```typescript
effect: (G, ctx) => {
  const alivePlayers = Object.keys(G.players).filter(id => G.players[id].isAlive);
  const minHp = Math.min(...alivePlayers.map(id => getHeroHp(G, id)));
  const minHpPlayers = alivePlayers.filter(id => getHeroHp(G, id) === minHp);
  for (const pid of minHpPlayers) {
    healTarget(G, pid, 2);
  }
}
```

**SJ303 封印锁妖塔**（C#: `SJ303(Player rd)`）
- SPI: `T#`（仅针对自己）
- 弃掉等于宠物数量的手牌，补1张
- C# 逻辑：`GetPetCount()` → `G0DH` 弃牌 → `G0DH` 补1

```typescript
effect: (G, ctx) => {
  const petCount = getPetCount(G, ctx.playerId);
  if (petCount > 0) {
    // 弃掉 petCount 张手牌（pendingChoice 让玩家选择弃哪些）
  }
  drawCards(G, ctx.playerId, 1);
}
```

#### 仙剑三外传（2张）

**S3W01 大军围蜀山**（C#: `S3W01(Player rd)`）
- SPI: `T`
- 战力最高弃2张，最低补2张
- C# 逻辑：`Max(p => p.STR)` / `Min(p => p.STR)` → 弃/补

```typescript
effect: (G, ctx) => {
  const alivePlayers = Object.keys(G.players).filter(id => G.players[id].isAlive);
  const maxStr = Math.max(...alivePlayers.map(id => getHeroStr(G, id)));
  const minStr = Math.min(...alivePlayers.map(id => getHeroStr(G, id)));
  // 战力最高的弃2张
  const maxStrPlayers = alivePlayers.filter(id => getHeroStr(G, id) === maxStr);
  for (const pid of maxStrPlayers) {
    // pendingChoice 让玩家选择2张手牌弃置
  }
  // 战力最低的补2张
  const minStrPlayers = alivePlayers.filter(id => getHeroStr(G, id) === minStr);
  for (const pid of minStrPlayers) {
    drawCards(G, pid, 2);
  }
}
```

**S3W02 绝世美味的诞生**（C#: `S3W02(Player rd)`）
- 选择己方1人恢复HP=敌方宠物总数
- C# 逻辑：`Sum(p => p.GetPetCount())` for OppTeam → `AsyncInput` 选择 → `Cure`

```typescript
effect: (G, ctx) => {
  const enemyPetCount = getEnemyIds(G, ctx.playerId)
    .reduce((sum, id) => sum + getPetCount(G, id), 0);
  if (enemyPetCount > 0) {
    // 选择己方1人（pendingChoice）
    // 恢复 HP = enemyPetCount
  }
}
```

#### 仙剑四（2张）

**SJ401 拜访石沉溪洞**（C#: `SJ401(Player rd)`）
- SPI: `T#`（仅针对自己）
- 弃掉所有手牌，补2张
- C# 逻辑：`G0DH` 弃全部 → `G0DH` 补2

```typescript
effect: (G, ctx) => {
  const player = G.players[ctx.playerId];
  if (player && player.hand.length > 0) {
    // 弃掉所有手牌
    discardCards(G, ctx.playerId, [...player.hand]);
  }
  drawCards(G, ctx.playerId, 2);
}
```

**SJ402 束缚幻冥界**（C#: `SJ402(Player rd)`）
- SPI: `H`
- 所有角色扣除宠物数量的HP
- C# 逻辑：`Where(p => p.GetPetCount() > 0)` → `Harm` 等于宠物数

```typescript
effect: (G, ctx) => {
  for (const [pid] of Object.entries(G.players)) {
    const petCount = getPetCount(G, pid);
    if (petCount > 0) {
      dealDamage(G, pid, petCount);
    }
  }
}
```

#### 仙剑五（1张）

**SJ501 误闯神魔之隙**（C#: `SJ501(Player rd)`）
- SPI: `T`
- 手牌最多的角色横置（多人并列无效）
- C# 逻辑：`Max(p => p.Tux.Count)` → 如果只有一人最多则横置

```typescript
effect: (G, ctx) => {
  const alivePlayers = Object.keys(G.players).filter(id => G.players[id].isAlive);
  const maxHand = Math.max(...alivePlayers.map(id => getHandCount(G, id)));
  const maxHandPlayers = alivePlayers.filter(id => getHandCount(G, id) === maxHand);
  if (maxHandPlayers.length === 1) {
    immobilizeTarget(G, maxHandPlayers[0]);
  }
  // 多人并列则无效
}
```

---

### 5. 集成到事件阶段

修改 `src/game/phases/event.ts`：

1. 在 `drawEvent` move 中，翻取事件牌后调用 `eventSystem.resolve()` 执行效果
2. 事件效果中的 SPI 位掩码处理：
   - `H` = HP伤害事件（`IsHarmInvolved = true`）
   - `T` = 手牌效果事件（`IsTuxInvolved = true`）
   - `T#` = 手牌效果仅针对自己
   - `S` = 沉默事件（`IsSilence = true`）
3. SPI 标记影响后续战斗阶段（如 H 事件后可能触发隐蛊/冰心诀打断窗口）

```typescript
// 修改后的 drawEvent move
drawEvent: ({ G, ctx, random }) => {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player || player.immobilized) return;

  if (G.piles.eventPile.length === 0) return;

  const eventInstanceId = G.piles.eventPile.shift();
  if (!eventInstanceId) return;

  G.event.currentEventInstanceId = eventInstanceId;
  G.event.processed = true;
  G.piles.discardPile.push(eventInstanceId);

  // 获取事件编码并执行效果
  const eventInstance = G.eventInstances[eventInstanceId];
  if (eventInstance) {
    const eventDef = events.find(e => e.ID === eventInstance.staticId);
    if (eventDef) {
      eventSystem.resolve(G, eventDef.CODE, { playerId, random });
    }
  }
},
```

---

### 6. 事件牌堆管理

当前 `src/game/setup.ts` 中事件牌堆已初始化（包含所有 VALID 事件）。但需要补充：

1. 事件牌堆耗尽后重洗弃牌堆中的事件牌（同怪物牌堆逻辑）
2. 在 `drawEvent` 中检查事件牌堆是否为空，若空则重洗

```typescript
// 在 drawEvent 中添加
if (G.piles.eventPile.length === 0) {
  // 从弃牌堆中回收事件牌
  const eventCardsInDiscard = G.piles.discardPile.filter(id => {
    const instance = G.eventInstances[id];
    return instance !== undefined;
  });
  if (eventCardsInDiscard.length === 0) return; // 真的没有事件牌了

  // 移除弃牌堆中的事件牌
  G.piles.discardPile = G.piles.discardPile.filter(id => !G.eventInstances[id]);

  // 洗回事件牌堆
  const reshuffled = random.Shuffle(eventCardsInDiscard);
  G.piles.eventPile.push(...reshuffled);
}
```

---

### 7. 测试验证

完成实现后，确保以下测试场景通过：

1. **14 个事件效果按 SPI 类型正确执行**
2. **SJ101 性别判定正确**：男性补1扣1，女性弃防具+天雷破
3. **SJ104 从对方开始轮流选牌**：翻开4张牌，双方轮流挑选
4. **SJ301 全体手牌调整为3张**：多弃少补
5. **SJ501 多人并列最多时不横置**：只有唯一最多才横置
6. **事件牌堆耗尽后自动重洗**
7. **横置角色跳过事件阶段**

编写单元测试文件：`src/tests/game/events/` 目录下。

---

### 8. 参考文档

| 文档 | 用途 |
|------|------|
| `reference/psd48-master/PSDGamepkg/JNS/SJ101.cs` | **C# 原版事件效果实现**（唯一真相） |
| `reference/docs/card-info.md` | 卡牌信息全表 |
| `reference/docs/scope.md` | 功能范围约束 |
| `route/phase-tracking/phase-5.5.md` | 任务清单和设计决策 |
| `src/game/skills/types.ts` | 技能系统类型（参照模式） |
| `src/game/skills/index.ts` | 技能注册表（参照模式） |
| `src/game/skills/resolver.ts` | 技能解析器（参照模式） |
| `src/game/skills/skillSystem.ts` | 技能系统入口（参照模式） |
| `src/game/skills/effects.ts` | 效果工具函数（复用） |
| `src/shared/data/events.json` | 事件静态数据 |
| `src/shared/data/heroes.json` | 角色静态数据（性别等） |
| `src/shared/types/game.ts` | GameState 类型定义 |
| `src/shared/types/card.ts` | 卡牌实例类型 |
| `src/shared/types/hero.ts` | 角色实例类型 |
| `src/game/phases/event.ts` | 事件阶段（需修改） |
| `src/game/setup.ts` | 游戏初始化（事件牌堆） |

---

### 9. 开发顺序建议

1. 先创建 `types.ts` 和 `index.ts`（注册表框架）
2. 创建 `resolver.ts`（解析器）
3. 实现简单事件（SJ102、SJ201、SJ302、SJ401、SJ402、SJ501）—— 这些不需要玩家选择
4. 实现需要玩家选择的事件（SJ101、SJ103、SJ202、SJ301、SJ303、S3W01、S3W02）
5. 实现复杂事件（SJ104 轮流选牌）
6. 集成到事件阶段（修改 `event.ts`）
7. 事件牌堆重洗逻辑
8. 编写测试

**开始实现。**
