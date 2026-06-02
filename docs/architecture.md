# 系统架构

> 仙剑逍遥游 Web 版的整体架构设计。

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  React UI   │  │  Zustand    │  │  boardgame.io Client    │ │
│  │  Components │  │  (UI State) │  │  (Game Sync)            │ │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘ │
│         │                │                      │               │
│         └────────────────┴──────────────────────┘               │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │ WebSocket
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Server (Node.js)                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   boardgame.io Server                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Game      │  │   Phases    │  │      Moves          │ │ │
│  │  │  (G State)  │  │  (Flow)     │  │   (Actions)         │ │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │ │
│  │         │                │                     │            │ │
│  │         └────────────────┴─────────────────────┘            │ │
│  │                              │                              │ │
│  │                    ┌─────────▼─────────┐                    │ │
│  │                    │    Engine Layer    │                    │ │
│  │                    │  combat / death    │                    │ │
│  │                    │  skills / effects  │                    │ │
│  │                    └───────────────────┘                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## 核心架构原则

### 1. 服务端权威（Server-Authoritative）

所有游戏逻辑在服务端执行，客户端只发送操作请求。

```
Client                          Server
  │                               │
  │──── moveRequest ─────────────▶│
  │                               │──▶ 验证 Move 合法性
  │                               │──▶ 修改 G (Game State)
  │                               │──▶ 触发 Skills/Effects
  │◀──── stateUpdate ────────────│
  │                               │
```

**为什么**：防止作弊，确保所有玩家看到一致的游戏状态。

### 2. 状态分离（State Separation）

| 状态类型 | 存储位置 | 示例 |
|----------|---------|------|
| 游戏状态 (G) | boardgame.io | 玩家 HP、手牌、装备、战斗上下文 |
| UI 状态 | Zustand | 当前 hover 的卡牌、选中的手牌、弹窗开关 |

**铁律**：G 必须可 JSON 序列化，禁止存入函数或类实例。

### 3. 纯函数 Moves

所有 Moves 必须是纯函数，只能修改 G：

```typescript
// ✅ 正确
function drawCards(G: GameState, ctx: Ctx, count: number) {
  const pile = G.piles.tux;
  if (pile.length === 0) reshufflePile(G);
  G.players[ctx.currentPlayer].hand.push(...pile.splice(0, count));
}

// ❌ 错误
function drawCards(G: GameState, ctx: Ctx, count: number) {
  const random = Math.random();  // 禁止！
  // ...
}
```

### 4. 技能事件驱动（Tag-Driven）

技能系统采用"触发时机 + 条件检查 + 效果执行"模式：

```typescript
interface Skill {
  id: string;
  trigger: SkillTrigger;      // 触发时机
  condition: (G, context) => boolean;  // 条件检查
  effect: (G, context) => void;        // 效果执行
  isForced: boolean;           // 是否强制发动
}
```

触发时机枚举：
- `TURN_START` - 回合开始
- `EVENT_PHASE` - 事件阶段
- `SKILL_PHASE` - 技牌阶段
- `COMBAT_START` - 战斗开始
- `COMBAT_CARD_PHASE` - 战牌阶段
- `COMBAT_END` - 战斗结束
- `ON_HP_CHANGE` - HP 变动时
- `ON_DEATH` - 角色死亡时
- `PASSIVE_ALWAYS` - 常驻被动

## 数据流

### 游戏初始化

```
psd.db3 (SQLite)
       │
       ▼ 导出
  JSON 文件 (heroes.json, monsters.json, ...)
       │
       ▼ setup()
  GameState (G) 初始化
       │
       ▼ boardgame.io
  首个 Phase 开始
```

### 回合流程

```
Turn Start
    │
    ▼
┌─ Event Phase ─────┐
│  (翻事件牌/跳过)   │
└────────┬──────────┘
         ▼
┌─ Skill Phase ─────┐
│  (使用技牌/装备)   │
└────────┬──────────┘
         ▼
┌─ Combat Phase ────┐
│  1. 选支援/妨碍    │
│  2. 翻怪+命中判定  │
│  3. 战斗开始技能   │
│  4. 出场效果       │
│  5. 战牌阶段       │
│  6. 结算           │
│  7. 战斗结束技能   │
└────────┬──────────┘
         ▼
┌─ Draw Phase ──────┐
│  (补牌)            │
└────────┬──────────┘
         ▼
┌─ Discard Phase ───┐
│  (弃牌至上限)      │
└────────┬──────────┘
         ▼
    Turn End
```

## 战斗系统架构

### 战力计算公式

```
TotalPower = BasePower           // 角色基础战力
           + WeaponPower         // 武器战力
           + ArmorPower          // 防具战力
           + PetPower            // 宠物战力
           + SkillPower          // 技能修正
           + CombatCardPower     // 战牌修正
```

### 命中判定

```
HitSuccess = (Attacker.TotalHit >= Monster.Evade)
```

### 打断窗口机制

```
任何导致 HP 变化或卡牌打出的 Move
       │
       ▼
  打断窗口开启
  (setActivePlayers → 所有持有响应牌的玩家)
       │
       ├── 有人响应 ──▶ 拦截原效果，处理响应
       │
       └── 超时/无人 ──▶ 继续原效果
```

## 变身系统

变身时保留当前 HP 和装备，仅替换角色 ID 和基础属性：

```typescript
function transform(G, playerId, newHeroId) {
  const player = G.players[playerId];
  const oldHero = getHero(player.heroId);
  const newHero = getHero(newHeroId);

  // 保留状态
  const保留 = {
    hp: player.hp,
    hand: player.hand,
    equipment: player.equipment,
    pets: player.pets,
  };

  // 替换角色
  player.heroId = newHeroId;
  // 基础属性从 newHero 重新计算
  // ...
}
```

变身关系：
- 赵灵儿 ↔ 赵灵儿·梦蛇（条件触发）
- 龙葵 ↔ 龙葵鬼（主动选择）
- 孔璘 → 魔尊（死亡时）
- 魔翳 → 湮世穹兵（队友全灭时）

## 倾慕链处理

死亡时的倾慕链是递归的：

```typescript
function handleDeath(G, playerId) {
  const admirers = findAllAdmirers(G, playerId);

  // 所有倾慕者同时扣血
  for (const admirer of admirers) {
    damagePlayer(G, admirer, 1, DamageType.ADMIRATION);
  }

  // 目标复活
  G.players[playerId].hp = admirers.length;

  // 检查是否有新的死亡（链式反应）
  for (const admirer of admirers) {
    if (G.players[admirer].hp <= 0) {
      handleDeath(G, admirer);  // 递归
    }
  }
}
```

**注意**：倾慕引发的 HP 损失不能用隐蛊免除。
