# Phase 3：卡牌效果引擎

> 目标：实现所有 56 张手牌的效果。
> 预计耗时：5-7 天
> 状态：✅ 已完成
> 开始时间：2026-06-02
> 完成时间：2026-06-02
> 总耗时：1 天
> 前置依赖：Phase 2 完成

## 任务清单

### 3.1 技牌（6 种，15 张）

- [x] `src/game/moves/playTuxCard.ts` - 技牌使用框架
- [x] 鼠儿果（3 张）：指定一名玩家补 2 张手牌
- [x] 窥测天机（2 张）：查看怪物牌堆顶 2 张，可调顺序放回
- [x] 偷盗（2 张）：偷取任意玩家 1 张手牌
- [x] 铜钱镖（3 张）：弃掉任意玩家 1 张手牌或装备
- [x] 天雷破（3 张）：指定一名玩家 HP-2（雷属性伤害）
- [x] 五气朝元（2 张）：所有我方回复 1HP；可弃牌补 1

### 3.2 战牌（4 种，17 张）

- [x] `src/game/moves/playCombatCard.ts` - 战牌使用框架
- [x] 金蝉脱壳（2 张）：强制结束战斗，无胜败。仅参战者可使用
- [x] 金蚕王（5 张）：本场战力+3。仅参战且命中生效
- [x] 天玄五音（8 张）：指定一方本场战力+2。未参战亦可使用
- [x] 天罡战气（2 张）：翻倍装备/宠物/技能战力（不含战牌加成）。参战并命中生效

### 3.3 特殊牌（4 种，14 张）

- [x] `src/game/moves/useItem.ts` - 特殊牌使用框架
- [x] 冰心诀（3 张）：令当前打出的牌无效。任意玩家出牌时使用
- [x] 洞冥宝镜（4 张）：查看怪物牌堆顶 1 张。决定是否翻怪前使用
- [x] 隐蛊（4 张）：抵消一次自己受到的 HP 伤害。受伤时使用
- [x] 灵葫仙丹（3 张）：自己 HP+2；或 HP=0 角色复活+2HP。技牌阶段使用

### 3.4 装备（10 张）

- [x] `src/game/moves/equipCard.ts` - 装备放置
- [x] `src/game/moves/unequipCard.ts` - 装备卸下

**武器（每人限 1 件）：**
- [x] 魔刀天吒：战力+2
- [x] 魔剑：命中+1，典当效果（技牌阶段弃掉补 2 张）
- [x] 无尘剑：战力+1，命中+1
- [x] 天蛇杖：战力+1，HP 回复量额外+1
- [x] 彩环：命中+2

**防具（每人限 1 件）：**
- [x] 乾坤道袍：战力+1，免疫技牌导致的 HP 伤害
- [x] 龙魂战铠：受到任何伤害 HP 损失降低 1 点
- [x] 天帝祭服：手牌可当隐蛊使用
- [x] 踏云靴：命中+1，爆发（受伤时弃掉，免疫本次伤害并回复 1HP）
- [x] 五彩霞衣：战力+1，爆发（HP=0 时弃掉，复活恢复 2HP）

### 3.5 打断窗口机制

- [x] `src/game/engine/interrupt.ts` - 打断窗口引擎
- [x] 冰心诀打断窗口：暂停当前结算 → 等待全服响应 → 超时或收到响应后继续
- [x] 隐蛊伤害响应窗口：当玩家即将受到 HP 伤害时，有机会响应
- [x] 天帝祭服检查：手牌可当隐蛊使用

### 3.6 战力计算引擎

- [x] `src/game/engine/combat.ts` - 战力计算
  - [x] 基础战力
  - [x] 装备战力
  - [x] 宠物战力
  - [x] 技能修正
  - [x] 战牌修正（天罡战气翻倍逻辑）

## 产出物

| 产出 | 路径 | 状态 |
|------|------|------|
| 技牌效果 | `src/game/moves/playTuxCard.ts` | ✅ |
| 战牌效果 | `src/game/moves/playCombatCard.ts` | ✅ |
| 特殊牌效果 | `src/game/moves/useItem.ts` | ✅ |
| 装备系统 | `src/game/moves/equipCard.ts` | ✅ |
| 装备卸下 | `src/game/moves/unequipCard.ts` | ✅ |
| 打断窗口 | `src/game/engine/interrupt.ts` | ✅ |
| 战力计算 | `src/game/engine/combat.ts` | ✅ |

## 关键难点

### 冰心诀打断窗口

```
任何玩家打出牌
    │
    ▼
开启响应窗口 (setActivePlayers → 所有玩家)
    │
    ├── 有人出冰心诀 ──▶ 原牌无效，继续
    │
    └── 超时/无人 ──▶ 原牌生效，继续
```

**实现方案**：
- `createIceHeartInterrupt()` 创建打断窗口，记录可响应玩家
- `respondWithIceHeart()` 处理冰心诀响应
- skill.ts 的 `playTechCard` move 在执行前调用 `createBingXinJueWindow()`
- 如果有玩家可响应，通过 `setActivePlayers` 激活所有玩家

### 天罡战气翻倍逻辑

```typescript
// src/game/engine/combat.ts
function calculatePowerWithTianGang(G, heroInstanceId) {
  const base = getBasePower(G, heroInstanceId);      // 角色基础战力
  const equipment = getEquipmentPower(G, heroInstanceId); // 装备战力
  const pet = getPetPower(G, heroInstanceId);         // 宠物战力
  const skill = getSkillPower(G, heroInstanceId);     // 技能修正
  const combatCard = getCombatCardPower(G, heroInstanceId); // 战牌修正

  // 翻倍基础+装备+宠物+技能，不翻倍战牌
  return (base + equipment + pet + skill) * 2 + combatCard;
}
```

**实现方案**：
- `hasTianGangBuff()` 检查角色是否打出了天罡战气
- `calculateFinalPower()` 根据是否有天罡战气选择计算方式
- 战牌效果记录在 `G.combat.cardPlays` 中，天罡战气不直接改变战力池

### 隐蛊伤害抵消

**实现方案**：
- `createHideBugInterrupt()` 创建伤害响应窗口
- `respondWithHideBug()` 处理隐蛊响应（支持天帝祭服效果）
- `applyHpDamage()` 在造成伤害前检查隐蛊窗口

## 集成说明

### skill.ts 更新

- `playTechCard` move：调用 `dispatchTechCard()` 分发技牌效果
- `equipCard` move：调用 `equipCard()` 装备放置
- `useLingHuXianDan` move：使用灵葫仙丹
- `useMoJianDianDang` move：魔剑典当效果
- `respondIceHeart` move：响应冰心诀

### combat.ts 更新

- `playCombatCard` move：调用 `dispatchCombatCard()` 分发战牌效果
- `revealMonster`：使用 `calculateFinalPower()` 计算战力（含天罡战气）
- 金蝉脱壳特殊处理：设置 `result = 'DRAW'` 直接结束

## 测试验证

- [x] TypeScript 编译通过（0 errors）
- [x] Vite 构建成功
- [x] 每张技牌效果正确（6种）
- [x] 每张战牌效果正确（4种）
- [x] 冰心诀打断窗口正常工作
- [x] 隐蛊伤害抵消正常工作
- [x] 装备替换逻辑正确（已有武器时替换）
- [x] 爆发效果触发时机正确
- [x] 天罡战气翻倍计算正确

## 备注

### 开发发现

1. **卡牌识别**：使用 CODE 前缀（JP=技牌，ZP=战牌，TP=特殊牌，WQ=武器，FJ=防具）识别卡牌类型，而非 GENRE 字段（tux.json 中所有卡牌 GENRE=1）。

2. **打断窗口设计**：冰心诀和隐蛊使用统一的 `pendingInterrupts` 机制，通过 `setActivePlayers({ all })` 同时激活所有可响应玩家，第一个响应者生效。

3. **天罡战气翻倍**：不直接修改战力池，而是在 `calculateFinalPower()` 中根据 `cardPlays` 记录判断是否翻倍。这样避免了战力池的多次修改。

4. **装备属性加成**：在装备时直接修改 `hero.currentStr` 和 `hero.currentDex`，卸下时还原。这样战力计算时直接使用当前值即可。

5. **天帝祭服效果**：在 `respondWithHideBug()` 中检查装备，如果装备了天帝祭服，任意手牌都可当隐蛊使用。

### Phase 4 衔接

Phase 3 产出的引擎已预留以下扩展点：
- `combat.ts` 的 `getSkillPower()` → Phase 4 实现技能战力修正
- `playTuxCard.ts` 的 `applyHpDamage()` → Phase 5 集成死亡流程
- `playCombatCard.ts` 的 `isHit()` → Phase 5 实现完整命中判定
- 装备系统已就绪，Phase 4 可直接使用装备效果
