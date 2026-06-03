/**
 * 技牌效果实现
 *
 * 6 种技牌，共 15 张：
 * 1. 鼠儿果（3张）：指定一名玩家补2张手牌
 * 2. 窥测天机（2张）：查看怪物牌堆顶2张，可调顺序放回
 * 3. 偷盗（2张）：偷取任意玩家1张手牌
 * 4. 铜钱镖（3张）：弃掉任意玩家1张手牌或装备
 * 5. 天雷破（3张）：指定一名玩家HP-2（雷属性伤害）
 * 6. 五气朝元（2张）：所有我方回复1HP；可弃牌补1
 *
 * 使用时机：技牌阶段（R#GR）
 * 通过 skill.ts 的 playTechCard move 调用
 */

import type { GameState } from '../../shared/types/game';
import { tux } from '../../shared/data';
import { drawCards } from './drawCards';
import { hasQiankunRobe, hasTiansheStaff, hasTayunBoots, hasWucaiRobe } from '../engine/combat';

// ==================== 辅助函数 ====================

/**
 * 获取卡牌的CODE
 */
function getCardCode(G: GameState, cardInstanceId: string): string | null {
  const card = G.cardInstances[cardInstanceId];
  if (!card) return null;
  const tuxData = tux.find(t => t.ID === card.staticId);
  return tuxData?.CODE ?? null;
}

/**
 * 检查是否为技牌
 */
function isTechCard(G: GameState, cardInstanceId: string): boolean {
  const code = getCardCode(G, cardInstanceId);
  if (!code) return false;
  return code.startsWith('JP');
}

/**
 * 造成HP伤害（含装备效果检查）
 * 包含：乾坤道袍免疫、龙魂战铠减伤、踏云靴爆发、五彩霞衣爆发
 * 不含隐蛊响应窗口（由 interrupt.ts 处理）
 */
function applyHpDamage(
  G: GameState,
  targetPlayerId: string,
  amount: number,
  source: string = 'tech',
): void {
  const target = G.players[targetPlayerId];
  if (!target || !target.isAlive) return;

  const hero = G.heroInstances[target.heroInstanceId];
  if (!hero) return;

  // 乾坤道袍：免疫技牌导致的HP伤害
  if (source === 'tech' && hasQiankunRobe(G, hero.instanceId)) {
    return;
  }

  // 踏云靴爆发：受伤时可弃踏云靴，免疫本次伤害并回复1HP
  // 注意：实际游戏中需要玩家选择是否发动，这里简化为自动发动
  if (hasTayunBoots(G, hero.instanceId) && hero.equipment.armor) {
    // 弃掉踏云靴
    const armorInstanceId = hero.equipment.armor;
    hero.equipment.armor = null;
    G.piles.discardPile.push(armorInstanceId);
    // 免疫本次伤害并回复1HP
    hero.currentHp = Math.min(hero.maxHp, hero.currentHp + 1);
    return;
  }

  // 龙魂战铠：减伤1点
  let finalDamage = amount;
  const reduction = (() => {
    const armorCard = hero.equipment.armor
      ? G.cardInstances[hero.equipment.armor]
      : null;
    if (!armorCard) return 0;
    const tuxData = tux.find(t => t.ID === armorCard.staticId);
    if (tuxData && tuxData.CODE === 'FJ03') return 1; // 龙魂战铠
    return 0;
  })();
  finalDamage = Math.max(0, finalDamage - reduction);

  if (finalDamage <= 0) return;

  // 扣HP
  hero.currentHp = Math.max(0, hero.currentHp - finalDamage);

  // 五彩霞衣爆发：HP=0时可弃五彩霞衣，复活恢复2HP
  if (hero.currentHp <= 0 && hasWucaiRobe(G, hero.instanceId) && hero.equipment.armor) {
    // 弃掉五彩霞衣
    const armorInstanceId = hero.equipment.armor;
    hero.equipment.armor = null;
    G.piles.discardPile.push(armorInstanceId);
    // 复活恢复2HP
    hero.currentHp = 2;
    return;
  }

  // 检查死亡
  if (hero.currentHp <= 0 && hero.isAlive) {
    // 标记死亡
    hero.isAlive = false;
    target.isAlive = false;

    // 清理装备（装备进入弃牌堆）
    if (hero.equipment.weapon) {
      G.piles.discardPile.push(hero.equipment.weapon);
      hero.equipment.weapon = null;
    }
    if (hero.equipment.armor) {
      G.piles.discardPile.push(hero.equipment.armor);
      hero.equipment.armor = null;
    }
    if (hero.equipment.special) {
      G.piles.discardPile.push(hero.equipment.special);
      hero.equipment.special = null;
    }

    // 清理宠物
    if (hero.pet) {
      G.piles.discardPile.push(hero.pet);
      hero.pet = null;
    }

    // 倾慕链式反应：所有倾慕者各扣1HP
    // TODO: Phase 5 实现完整的倾慕机制（需要遍历所有角色的倾慕条件）
    // 当前简化：标记死亡但不触发倾慕
  }
}

/**
 * 回复HP（含天蛇杖加成）
 */
function applyHeal(G: GameState, targetPlayerId: string, amount: number): void {
  const target = G.players[targetPlayerId];
  if (!target || !target.isAlive) return;

  const hero = G.heroInstances[target.heroInstanceId];
  if (!hero) return;

  let finalHeal = amount;

  // 天蛇杖：HP回复量额外+1（倾慕除外）
  if (hasTiansheStaff(G, hero.instanceId)) {
    finalHeal += 1;
  }

  hero.currentHp = Math.min(hero.maxHp, hero.currentHp + finalHeal);
}

// ==================== 技牌效果 ====================

/**
 * 鼠儿果：指定一名玩家补2张手牌
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 鼠儿果卡牌实例ID
 * @param targetPlayerId 目标玩家ID
 */
export function playShuErGuo(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
  targetPlayerId: string,
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  // 验证卡牌
  if (!isTechCard(G, cardInstanceId)) return;
  const code = getCardCode(G, cardInstanceId);
  if (code !== 'JP04') return;

  // 验证目标玩家
  const target = G.players[targetPlayerId];
  if (!target || !target.isAlive) return;

  // 从手牌移除
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 目标补2张牌
  drawCards({ G, ctx: { ...ctx, currentPlayer: targetPlayerId } }, 2);
}

/**
 * 窥测天机：查看怪物牌堆顶2张，可调顺序放回
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 窥测天机卡牌实例ID
 * @param reorderedIds 重排后的怪物牌实例ID列表（可选，不传则保持原顺序）
 */
export function playKuiCeTianJi(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
  reorderedIds?: string[],
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  if (!isTechCard(G, cardInstanceId)) return;
  const code = getCardCode(G, cardInstanceId);
  if (code !== 'JP02') return;

  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 查看怪物牌堆顶2张
  const pile = G.piles.monsterPile;
  if (pile.length < 2) return;

  // 如果提供了重排顺序，放回时使用新顺序
  if (reorderedIds && reorderedIds.length === 2) {
    pile[0] = reorderedIds[0]!;
    pile[1] = reorderedIds[1]!;
  }
  // 否则保持原顺序（什么都不做）
}

/**
 * 偷盗：偷取任意玩家1张手牌
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 偷盗卡牌实例ID
 * @param targetPlayerId 目标玩家ID
 * @param stolenCardInstanceId 要偷取的卡牌实例ID
 */
export function playTouDao(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
  targetPlayerId: string,
  stolenCardInstanceId: string,
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  if (!isTechCard(G, cardInstanceId)) return;
  const code = getCardCode(G, cardInstanceId);
  if (code !== 'JP01') return;

  // 验证目标（偷盗的目标是敌方玩家 $）
  const target = G.players[targetPlayerId];
  if (!target || !target.isAlive) return;
  if (target.team === player.team) return; // 不能偷队友

  // 从手牌移除偷盗牌
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 从目标手牌偷取指定牌
  const stolenIndex = target.hand.indexOf(stolenCardInstanceId);
  if (stolenIndex === -1) return;
  target.hand.splice(stolenIndex, 1);

  // 加入自己手牌
  player.hand.push(stolenCardInstanceId);
  // 更新卡牌所有者
  const stolenCard = G.cardInstances[stolenCardInstanceId];
  if (stolenCard) {
    stolenCard.ownerId = playerId;
  }
}

/**
 * 铜钱镖：弃掉任意玩家1张手牌或装备
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 铜钱镖卡牌实例ID
 * @param targetPlayerId 目标玩家ID
 * @param discardedCardInstanceId 要弃掉的卡牌实例ID
 */
export function playTongQianBiao(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
  targetPlayerId: string,
  discardedCardInstanceId: string,
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  if (!isTechCard(G, cardInstanceId)) return;
  const code = getCardCode(G, cardInstanceId);
  if (code !== 'JP06') return;

  const target = G.players[targetPlayerId];
  if (!target || !target.isAlive) return;
  if (target.team === player.team) return; // 不能对队友使用

  // 从手牌移除铜钱镖
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 尝试从目标手牌弃掉
  const targetHandIndex = target.hand.indexOf(discardedCardInstanceId);
  if (targetHandIndex !== -1) {
    target.hand.splice(targetHandIndex, 1);
    G.piles.discardPile.push(discardedCardInstanceId);
    return;
  }

  // 尝试从目标装备区弃掉
  const targetHero = G.heroInstances[target.heroInstanceId];
  if (targetHero) {
    if (targetHero.equipment.weapon === discardedCardInstanceId) {
      targetHero.equipment.weapon = null;
      G.piles.discardPile.push(discardedCardInstanceId);
      return;
    }
    if (targetHero.equipment.armor === discardedCardInstanceId) {
      targetHero.equipment.armor = null;
      G.piles.discardPile.push(discardedCardInstanceId);
      return;
    }
    if (targetHero.equipment.special === discardedCardInstanceId) {
      targetHero.equipment.special = null;
      G.piles.discardPile.push(discardedCardInstanceId);
      return;
    }
  }
}

/**
 * 天雷破：指定一名玩家HP-2（雷属性伤害）
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 天雷破卡牌实例ID
 * @param targetPlayerId 目标玩家ID
 */
export function playTianLeiPo(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
  targetPlayerId: string,
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  if (!isTechCard(G, cardInstanceId)) return;
  const code = getCardCode(G, cardInstanceId);
  if (code !== 'JP05') return;

  const target = G.players[targetPlayerId];
  if (!target || !target.isAlive) return;

  // 从手牌移除
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 造成2点雷属性伤害
  applyHpDamage(G, targetPlayerId, 2, 'tech');
}

/**
 * 五气朝元：所有我方回复1HP；可弃牌补1
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 五气朝元卡牌实例ID
 * @param discardCardInstanceId 要弃掉的牌（用于补1效果，可选）
 */
export function playWuQiChaoYuan(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
  discardCardInstanceId?: string,
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  if (!isTechCard(G, cardInstanceId)) return;
  const code = getCardCode(G, cardInstanceId);
  if (code !== 'JP03') return;

  // 从手牌移除五气朝元
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 所有我方存活角色回复1HP
  for (const pid of Object.keys(G.players)) {
    const p = G.players[pid];
    if (p && p.isAlive && p.team === player.team) {
      applyHeal(G, pid, 1);
    }
  }

  // 典当效果：可弃1张手牌补1张
  if (discardCardInstanceId) {
    const discardIndex = player.hand.indexOf(discardCardInstanceId);
    if (discardIndex !== -1) {
      player.hand.splice(discardIndex, 1);
      G.piles.discardPile.push(discardCardInstanceId);
      drawCards({ G, ctx }, 1);
    }
  }
}

// ==================== 技牌调度器 ====================

/**
 * 根据卡牌CODE分发到对应的效果函数
 * 由 skill.ts 的 playTechCard move 调用
 */
export function dispatchTechCard(
  context: { G: GameState; ctx: any },
  cardInstanceId: string,
  params: Record<string, unknown>,
): void {
  const code = getCardCode(context.G, cardInstanceId);
  if (!code) return;

  switch (code) {
    case 'JP04': // 鼠儿果
      playShuErGuo(context, cardInstanceId, params.targetPlayerId as string);
      break;
    case 'JP02': // 窥测天机
      playKuiCeTianJi(context, cardInstanceId, params.reorderedIds as string[] | undefined);
      break;
    case 'JP01': // 偷盗
      playTouDao(
        context,
        cardInstanceId,
        params.targetPlayerId as string,
        params.stolenCardInstanceId as string,
      );
      break;
    case 'JP06': // 铜钱镖
      playTongQianBiao(
        context,
        cardInstanceId,
        params.targetPlayerId as string,
        params.discardedCardInstanceId as string,
      );
      break;
    case 'JP05': // 天雷破
      playTianLeiPo(context, cardInstanceId, params.targetPlayerId as string);
      break;
    case 'JP03': // 五气朝元
      playWuQiChaoYuan(
        context,
        cardInstanceId,
        params.discardCardInstanceId as string | undefined,
      );
      break;
  }
}
