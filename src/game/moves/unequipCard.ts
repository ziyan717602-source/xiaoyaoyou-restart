/**
 * 装备卸下 Move
 *
 * 将装备区的装备牌卸下放入弃牌堆
 * 卸下后移除装备的属性加成
 *
 * 使用时机：技牌阶段
 */

import type { GameState } from '../../shared/types/game';
import { tux } from '../../shared/data';

// ==================== 辅助函数 ====================

function getCardCode(G: GameState, cardInstanceId: string): string | null {
  const card = G.cardInstances[cardInstanceId];
  if (!card) return null;
  const tuxData = tux.find(t => t.ID === card.staticId);
  return tuxData?.CODE ?? null;
}

function getWeaponPowerBonus(code: string): number {
  switch (code) {
    case 'WQ03': return 2;
    case 'WQ01': return 1;
    case 'WQ02': return 1;
    default: return 0;
  }
}

function getWeaponHitBonus(code: string): number {
  switch (code) {
    case 'WQ05': return 2;
    case 'WQ04': return 1;
    case 'WQ01': return 1;
    default: return 0;
  }
}

function getArmorPowerBonus(code: string): number {
  switch (code) {
    case 'FJ04': return 1;
    case 'FJ01': return 1;
    default: return 0;
  }
}

function getArmorHitBonus(code: string): number {
  switch (code) {
    case 'FJ05': return 1;
    default: return 0;
  }
}

// ==================== 卸下装备 ====================

/**
 * 卸下武器
 */
export function unequipWeapon(
  { G, ctx }: { G: GameState; ctx: any },
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero || !hero.equipment.weapon) return;

  const weaponInstanceId = hero.equipment.weapon;
  const code = getCardCode(G, weaponInstanceId);

  // 移除属性加成
  if (code) {
    hero.currentStr -= getWeaponPowerBonus(code);
    hero.currentDex -= getWeaponHitBonus(code);
  }

  // 放入弃牌堆
  G.piles.discardPile.push(weaponInstanceId);
  hero.equipment.weapon = null;
}

/**
 * 卸下防具
 */
export function unequipArmor(
  { G, ctx }: { G: GameState; ctx: any },
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero || !hero.equipment.armor) return;

  const armorInstanceId = hero.equipment.armor;
  const code = getCardCode(G, armorInstanceId);

  // 移除属性加成
  if (code) {
    hero.currentStr -= getArmorPowerBonus(code);
    hero.currentDex -= getArmorHitBonus(code);
  }

  // 放入弃牌堆
  G.piles.discardPile.push(armorInstanceId);
  hero.equipment.armor = null;
}

/**
 * 卸下指定装备（通用）
 */
export function unequipCard(
  { G, ctx }: { G: GameState; ctx: any },
  slot: 'weapon' | 'armor' | 'special',
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return;

  const instanceId = hero.equipment[slot];
  if (!instanceId) return;

  const code = getCardCode(G, instanceId);

  // 移除属性加成
  if (code) {
    if (slot === 'weapon') {
      hero.currentStr -= getWeaponPowerBonus(code);
      hero.currentDex -= getWeaponHitBonus(code);
    } else if (slot === 'armor') {
      hero.currentStr -= getArmorPowerBonus(code);
      hero.currentDex -= getArmorHitBonus(code);
    }
  }

  // 放入弃牌堆
  G.piles.discardPile.push(instanceId);
  hero.equipment[slot] = null;
}
