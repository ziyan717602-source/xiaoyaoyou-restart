/**
 * 装备放置 Move
 *
 * 将手牌中的装备牌放入装备区：
 * - 武器：每人限1件，已有时替换
 * - 防具：每人限1件，已有时替换
 *
 * 装备效果：
 * - 武器（5件）：魔刀天吒、魔剑、无尘剑、天蛇杖、彩环
 * - 防具（5件）：乾坤道袍、龙魂战铠、天帝祭服、踏云靴、五彩霞衣
 *
 * 使用时机：技牌阶段
 */

import type { GameState } from '../../shared/types/game';
import { tux } from '../../shared/data';

// ==================== 装备类型判断 ====================

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
 * 判断是否为武器
 * 武器CODE前缀：WQ
 */
function isWeapon(code: string): boolean {
  return code.startsWith('WQ');
}

/**
 * 判断是否为防具
 * 防具CODE前缀：FJ
 */
function isArmor(code: string): boolean {
  return code.startsWith('FJ');
}

// ==================== 装备放置 ====================

/**
 * 装备武器
 * 每人限1件武器，已有则替换（旧武器进入弃牌堆）
 */
export function equipWeapon(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  const card = G.cardInstances[cardInstanceId];
  if (!card) return;

  const tuxData = tux.find(t => t.ID === card.staticId);
  if (!tuxData) return;

  if (!isWeapon(tuxData.CODE)) return;

  // 从手牌移除
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return;

  // 如果已有武器，旧武器进入弃牌堆
  if (hero.equipment.weapon) {
    G.piles.discardPile.push(hero.equipment.weapon);
  }

  // 装备新武器（属性加成由 combat.ts 的 getEquipmentPower/getEquipmentHit 统一计算）
}

/**
 * 装备防具
 * 每人限1件防具，已有则替换
 */
export function equipArmor(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  const card = G.cardInstances[cardInstanceId];
  if (!card) return;

  const tuxData = tux.find(t => t.ID === card.staticId);
  if (!tuxData) return;

  if (!isArmor(tuxData.CODE)) return;

  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return;

  // 如果已有防具，旧防具进入弃牌堆
  if (hero.equipment.armor) {
    G.piles.discardPile.push(hero.equipment.armor);
  }

  // 装备新防具（属性加成由 combat.ts 的 getEquipmentPower/getEquipmentHit 统一计算）
}

// ==================== 调度器 ====================

/**
 * 装备卡牌（自动判断武器/防具）
 */
export function equipCard(
  context: { G: GameState; ctx: any },
  cardInstanceId: string,
): void {
  const code = getCardCode(context.G, cardInstanceId);
  if (!code) return;

  if (isWeapon(code)) {
    equipWeapon(context, cardInstanceId);
  } else if (isArmor(code)) {
    equipArmor(context, cardInstanceId);
  }
}
