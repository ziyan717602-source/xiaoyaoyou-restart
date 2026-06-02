/**
 * 仙剑逍遥游 - 技能效果工具函数
 * Phase 4：角色技能引擎
 *
 * 提供常用的技能效果实现，如伤害、治疗、抽牌、弃牌等。
 * 这些函数封装了对 G 状态的修改操作。
 *
 * 核心规则：
 * - 所有函数都是纯函数，只修改 G
 * - 随机数必须通过 ctx.random 传入
 */

import { GameState } from '../../shared/types/game';
import { Element } from '../../shared/types/enums';
import { SkillRuntimeContext } from './types';

// ==================== 伤害效果 ====================

/**
 * 对目标造成伤害
 * @param G - 游戏状态
 * @param targetPlayerId - 目标玩家 ID
 * @param damage - 伤害值
 * @param element - 元素类型（默认无属性）
 */
export function dealDamage(
  G: GameState,
  targetPlayerId: string,
  damage: number,
  element: Element = Element.WIND
): void {
  const player = G.players[targetPlayerId];
  if (!player || !player.isAlive) {
    return;
  }

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) {
    return;
  }

  // TODO: 检查元素免疫（如玄霄的「凝冰焚炎」免疫水/火伤害）
  // 当前暂不检查元素免疫，直接造成伤害
  void element; // 预留元素参数，待 Phase 5 实现元素免疫检查

  // 计算实际伤害（考虑防御等）
  const actualDamage = Math.max(0, damage);

  // 扣除 HP
  hero.currentHp = Math.max(0, hero.currentHp - actualDamage);

  // 检查死亡
  if (hero.currentHp <= 0) {
    hero.isAlive = false;
    player.isAlive = false;
  }
}

/**
 * 对多个目标造成伤害
 */
export function dealDamageToMultiple(
  G: GameState,
  targetPlayerIds: string[],
  damage: number,
  element: Element = Element.WIND
): void {
  for (const targetId of targetPlayerIds) {
    dealDamage(G, targetId, damage, element);
  }
}

/**
 * 对所有存活玩家造成伤害
 */
export function dealDamageToAll(
  G: GameState,
  damage: number,
  element: Element = Element.WIND,
  excludePlayerId?: string
): void {
  for (const [playerId, player] of Object.entries(G.players)) {
    if (player.isAlive && playerId !== excludePlayerId) {
      dealDamage(G, playerId, damage, element);
    }
  }
}

// ==================== 治疗效果 ====================

/**
 * 恢复目标 HP
 */
export function healTarget(
  G: GameState,
  targetPlayerId: string,
  healAmount: number
): void {
  const player = G.players[targetPlayerId];
  if (!player || !player.isAlive) {
    return;
  }

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) {
    return;
  }

  // 恢复 HP（不超过上限）
  hero.currentHp = Math.min(hero.maxHp, hero.currentHp + healAmount);
}

/**
 * 恢复多个目标 HP
 */
export function healMultiple(
  G: GameState,
  targetPlayerIds: string[],
  healAmount: number
): void {
  for (const targetId of targetPlayerIds) {
    healTarget(G, targetId, healAmount);
  }
}

/**
 * 恢复所有存活队友 HP
 */
export function healTeam(
  G: GameState,
  teamPlayerIds: string[],
  healAmount: number
): void {
  for (const targetId of teamPlayerIds) {
    healTarget(G, targetId, healAmount);
  }
}

// ==================== 手牌效果 ====================

/**
 * 从牌堆抽牌
 * 注意：必须传入 random 参数，禁止使用 Math.random()
 */
export function drawCards(
  G: GameState,
  playerId: string,
  count: number,
  random: { Die: (sides: number) => number }
): void {
  const player = G.players[playerId];
  if (!player) {
    return;
  }

  // 从手牌堆顶部抽牌
  for (let i = 0; i < count; i++) {
    if (G.piles.handPile.length === 0) {
      // 牌堆为空时洗牌
      shuffleDiscardPile(G, random);
      if (G.piles.handPile.length === 0) {
        break; // 真的没牌了
      }
    }

    const cardId = G.piles.handPile.pop()!;
    player.hand.push(cardId);
  }
}

/**
 * 弃置手牌
 */
export function discardCards(
  G: GameState,
  playerId: string,
  cardInstanceIds: string[]
): void {
  const player = G.players[playerId];
  if (!player) {
    return;
  }

  for (const cardId of cardInstanceIds) {
    const index = player.hand.indexOf(cardId);
    if (index !== -1) {
      player.hand.splice(index, 1);
      G.piles.discardPile.push(cardId);
    }
  }
}

/**
 * 弃置所有手牌
 */
export function discardAllCards(G: GameState, playerId: string): void {
  const player = G.players[playerId];
  if (!player) {
    return;
  }

  const cardsToDiscard = [...player.hand];
  discardCards(G, playerId, cardsToDiscard);
}

/**
 * 将弃牌堆洗牌到手牌堆
 * 注意：必须传入 random 参数，禁止使用 Math.random()
 */
function shuffleDiscardPile(G: GameState, random: { Die: (sides: number) => number }): void {
  G.piles.handPile = [...G.piles.discardPile];
  G.piles.discardPile = [];

  // 洗牌（使用 Fisher-Yates 算法）
  for (let i = G.piles.handPile.length - 1; i > 0; i--) {
    const j = random.Die(i + 1) - 1;
    const temp = G.piles.handPile[i];
    const swap = G.piles.handPile[j];
    if (temp !== undefined && swap !== undefined) {
      G.piles.handPile[i] = swap;
      G.piles.handPile[j] = temp;
    }
  }
}

// ==================== 属性修改效果 ====================

/**
 * 修改角色战力
 */
export function modifyStrength(
  G: GameState,
  heroInstanceId: string,
  delta: number
): void {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero) {
    return;
  }

  hero.currentStr = Math.max(0, hero.currentStr + delta);
}

/**
 * 修改角色命中
 */
export function modifyDexterity(
  G: GameState,
  heroInstanceId: string,
  delta: number
): void {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero) {
    return;
  }

  hero.currentDex = Math.max(0, hero.currentDex + delta);
}

/**
 * 修改角色 HP 上限
 */
export function modifyMaxHp(
  G: GameState,
  heroInstanceId: string,
  delta: number
): void {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero) {
    return;
  }

  hero.maxHp = Math.max(1, hero.maxHp + delta);
  // 如果当前 HP 超过新上限，调整为上限
  hero.currentHp = Math.min(hero.currentHp, hero.maxHp);
}

// ==================== 横置效果 ====================

/**
 * 横置目标（使其下回合跳过除弃牌外的所有阶段）
 */
export function immobilizeTarget(
  G: GameState,
  targetPlayerId: string
): void {
  const player = G.players[targetPlayerId];
  if (!player) {
    return;
  }

  player.immobilized = true;

  // 同时更新角色实例状态
  const hero = G.heroInstances[player.heroInstanceId];
  if (hero) {
    hero.immobilized = true;
  }
}

// ==================== 装备效果 ====================

/**
 * 卸下装备
 */
export function unequipCard(
  G: GameState,
  playerId: string,
  cardInstanceId: string
): void {
  const player = G.players[playerId];
  if (!player) {
    return;
  }

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) {
    return;
  }

  // 检查装备槽位
  if (hero.equipment.weapon === cardInstanceId) {
    hero.equipment.weapon = null;
    G.piles.discardPile.push(cardInstanceId);
  } else if (hero.equipment.armor === cardInstanceId) {
    hero.equipment.armor = null;
    G.piles.discardPile.push(cardInstanceId);
  } else if (hero.equipment.special === cardInstanceId) {
    hero.equipment.special = null;
    G.piles.discardPile.push(cardInstanceId);
  }
}

/**
 * 卸下所有装备
 */
export function unequipAllCards(G: GameState, playerId: string): void {
  const player = G.players[playerId];
  if (!player) {
    return;
  }

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) {
    return;
  }

  if (hero.equipment.weapon) {
    unequipCard(G, playerId, hero.equipment.weapon);
  }
  if (hero.equipment.armor) {
    unequipCard(G, playerId, hero.equipment.armor);
  }
  if (hero.equipment.special) {
    unequipCard(G, playerId, hero.equipment.special);
  }
}

// ==================== 宠物效果 ====================

/**
 * 获得宠物
 */
export function obtainPet(
  G: GameState,
  playerId: string,
  monsterInstanceId: string
): void {
  const player = G.players[playerId];
  if (!player) {
    return;
  }

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) {
    return;
  }

  // 检查是否已有同属性宠物
  if (hero.pet) {
    // 替换现有宠物
    const oldPet = G.monsterInstances[hero.pet];
    if (oldPet) {
      // 旧宠物回到弃牌堆
      G.piles.discardPile.push(hero.pet);
    }
  }

  hero.pet = monsterInstanceId;
}

/**
 * 失去宠物
 */
export function losePet(G: GameState, playerId: string): void {
  const player = G.players[playerId];
  if (!player) {
    return;
  }

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero || !hero.pet) {
    return;
  }

  const petId = hero.pet;
  hero.pet = null;

  // 宠物回到弃牌堆
  G.piles.discardPile.push(petId);
}

// ==================== 掷骰效果 ====================

/**
 * 掷骰子（1-6）
 */
export function rollDice(ctx: SkillRuntimeContext): number {
  return ctx.random.Die(6);
}

/**
 * 掷多个骰子并返回总和
 */
export function rollDiceSum(ctx: SkillRuntimeContext, count: number): number {
  let sum = 0;
  for (let i = 0; i < count; i++) {
    sum += ctx.random.Die(6);
  }
  return sum;
}

// ==================== 查询效果 ====================

/**
 * 获取所有存活玩家 ID
 */
export function getAlivePlayerIds(G: GameState): string[] {
  return Object.entries(G.players)
    .filter(([_, player]) => player.isAlive)
    .map(([playerId, _]) => playerId);
}

/**
 * 获取指定队伍的所有存活玩家 ID
 */
export function getAliveTeammateIds(
  G: GameState,
  team: string
): string[] {
  return Object.entries(G.players)
    .filter(([_, player]) => player.isAlive && player.team === team)
    .map(([playerId, _]) => playerId);
}

/**
 * 获取所有存活敌人 ID
 */
export function getAliveEnemyIds(
  G: GameState,
  team: string
): string[] {
  return Object.entries(G.players)
    .filter(([_, player]) => player.isAlive && player.team !== team)
    .map(([playerId, _]) => playerId);
}

/**
 * 获取指定角色的手牌数量
 */
export function getHandCount(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  return player ? player.hand.length : 0;
}

/**
 * 获取指定角色的装备数量
 */
export function getEquipCount(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  if (!player) {
    return 0;
  }

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) {
    return 0;
  }

  let count = 0;
  if (hero.equipment.weapon) count++;
  if (hero.equipment.armor) count++;
  if (hero.equipment.special) count++;
  return count;
}
