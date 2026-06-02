# Phase 1：数据层

> 目标：定义整个项目的数据骨架，所有后续开发都基于这些类型。
> 预计耗时：2-3 天
> 状态：✅ 已完成
> 开始时间：2026-06-02
> 完成时间：2026-06-02
> 总耗时：约 30 分钟
> 前置依赖：Phase 0 完成

## 任务清单

### 1.1 枚举定义 ✅

- [x] `src/shared/types/enums.ts`
  - [x] PhaseType（TURN_START, EVENT, SKILL, COMBAT, DRAW, DISCARD, TURN_END）
  - [x] CardType（TECH, COMBAT, SPECIAL, WEAPON, ARMOR）
  - [x] Element（WIND, THUNDER, WATER, FIRE, EARTH）
  - [x] DamageType（NORMAL, SKILL, COMBAT, ADMIRATION）
  - [x] SkillTrigger（TURN_START, EVENT_PHASE, SKILL_PHASE, COMBAT_START, ...）
  - [x] CombatStage（SUPPORT, HINDER, REVEAL, HIT_CHECK, PLAY_CARD, SETTLE, END）

### 1.2 卡牌类型定义 ✅

- [x] `src/shared/types/card.ts`
  - [x] StaticCardDef（静态卡牌定义）
  - [x] CardInstance（运行时卡牌实例，含 instanceId、staticId、buffs）
  - [x] TuxCard（手牌：技牌/战牌/特殊牌/装备）
  - [x] MonsterCard（怪物牌）
  - [x] EventCard（事件牌）
  - [x] NpcCard（NPC 牌）

### 1.3 角色类型定义 ✅

- [x] `src/shared/types/hero.ts`
  - [x] StaticHeroDef（静态角色定义：HP、战力、命中、技能列表、倾慕列表）
  - [x] HeroInstance（运行时角色实例）
  - [x] 变身关联关系

### 1.4 怪物类型定义 ✅

- [x] `src/shared/types/monster.ts`
  - [x] StaticMonsterDef（静态怪物定义：战力、闪避、强度、五行、4 个效果槽位）
  - [x] MonsterInstance（运行时怪物实例）

### 1.5 技能类型定义 ✅

- [x] `src/shared/types/skill.ts`
  - [x] Skill 接口（id、trigger、condition、effect、isForced）
  - [x] SkillContext（技能上下文：触发者、目标、战斗状态等）

### 1.6 装备类型定义 ✅

- [x] `src/shared/types/equipment.ts`
  - [x] WeaponDef（武器：战力、命中、特殊效果）
  - [x] ArmorDef（防具：战力、命中、特殊效果、爆发效果）

### 1.7 GameState 类型定义 ✅

- [x] `src/shared/types/game.ts`
  - [x] GameState（G）接口
  - [x] PlayerState 接口
  - [x] CombatState 接口
  - [x] PileState 接口

### 1.8 类型导出 ✅

- [x] `src/shared/types/index.ts` 统一导出所有类型

## 产出物

| 产出 | 路径 | 状态 |
|------|------|------|
| 枚举定义 | `src/shared/types/enums.ts` | ✅ |
| 卡牌类型 | `src/shared/types/card.ts` | ✅ |
| 角色类型 | `src/shared/types/hero.ts` | ✅ |
| 怪物类型 | `src/shared/types/monster.ts` | ✅ |
| 技能类型 | `src/shared/types/skill.ts` | ✅ |
| 装备类型 | `src/shared/types/equipment.ts` | ✅ |
| GameState 类型 | `src/shared/types/game.ts` | ✅ |
| 统一导出 | `src/shared/types/index.ts` | ✅ |

## 设计决策

### 静态定义 vs 运行时实例

```typescript
// 静态定义（不变的数据）
interface StaticHeroDef {
  id: string;
  name: string;
  hp: number;
  power: number;
  hit: number;
  skills: string[];
  admirations: string[];
}

// 运行时实例（G 中的数据）
interface HeroInstance {
  staticId: string;  // 引用 StaticHeroDef
  currentHp: number;
  // ...其他运行时状态
}
```

### G 中卡牌的存储方式

```typescript
// ✅ 正确：只存 instanceId
player.hand: string[]  // ["card_001", "card_002", ...]

// ❌ 错误：存完整对象
player.hand: CardInstance[]  // 禁止！
```

## 测试验证

- [x] 所有类型定义无 TypeScript 编译错误
- [x] 类型可正确序列化为 JSON
- [x] 静态定义与 JSON 数据文件结构一致

## 备注

1. **类型设计决策**：
   - 采用静态定义（Static*）与运行时实例（*Instance）分离的设计
   - G 中卡牌只存 instanceId（字符串），不存完整对象，符合 boardgame.io 序列化要求
   - 所有类型都设计为可 JSON 序列化

2. **数据结构对齐**：
   - StaticHeroDef 对应 heroes.json 结构（ID, NAME, HP, STR, DEX, SKILL, GENDER, SPOUSE, ISO）
   - StaticCardDef 对应 tux.json 结构（ID, CODE, NAME, COUNT, OCCURS, DESCRIPTION, TARGET）
   - StaticMonsterDef 对应 monsters.json 结构（ID, CODE, NAME, STR, AGL, LEVEL, SPI）
   - StaticSkillDef 对应 skills.json 结构（ID, CODE, TYPE, NAME, OCCURS, PRIORS, DESCRIPE）

3. **扩展性考虑**：
   - 预留了 CardBuff 接口用于后续 Buff 系统
   - 预留了 PendingInterrupt 和 PendingChoice 用于打断窗口机制
   - 预留了 TransformRelation 用于变身系统

4. **未实现的功能**：
   - 未实现具体的游戏逻辑（Phase 2+）
   - 未实现卡牌效果解析（Phase 3+）
   - 未实现技能触发系统（Phase 4+）
