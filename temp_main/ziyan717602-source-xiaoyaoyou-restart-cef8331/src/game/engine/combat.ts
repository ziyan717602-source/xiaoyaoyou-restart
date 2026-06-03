/**
 * 战力计算引擎
 *
 * 分层计算战力：
 * 1. 基础战力（角色 STR）
 * 2. 装备战力（武器 + 防具）
 * 3. 宠物战力
 * 4. 技能修正（Phase 4 实现）
 * 5. 战牌修正（金蚕王 +3、天玄五音 +2 等）
 *
 * 天罡战气翻倍逻辑：
 * - 翻倍 = (基础 + 装备 + 宠物 + 技能) * 2
 * - 不翻倍战牌加成
 */

import type { GameState } from '../../shared/types/game';
import { tux, monsters } from '../../shared/data';

// ==================== 基础战力计算 ====================

/**
 * 获取角色基础战力
 */
export function getBasePower(G: GameState, heroInstanceId: string): number {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero) return 0;
  return hero.currentStr;
}

/**
 * 获取装备战力加成（武器 + 防具）
 */
export function getEquipmentPower(G: GameState, heroInstanceId: string): number {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero) return 0;

  let power = 0;

  // 武器战力
  if (hero.equipment.weapon) {
    const weaponCard = G.cardInstances[hero.equipment.weapon];
    if (weaponCard) {
      const tuxData = tux.find(t => t.ID === weaponCard.staticId);
      if (tuxData) {
        power += getWeaponPower(tuxData.CODE);
      }
    }
  }

  // 防具战力
  if (hero.equipment.armor) {
    const armorCard = G.cardInstances[hero.equipment.armor];
    if (armorCard) {
      const tuxData = tux.find(t => t.ID === armorCard.staticId);
      if (tuxData) {
        power += getArmorPower(tuxData.CODE);
      }
    }
  }

  return power;
}

/**
 * 获取宠物战力
 */
export function getPetPower(G: GameState, heroInstanceId: string): number {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero || !hero.pet) return 0;

  const monsterInst = G.monsterInstances[hero.pet];
  if (!monsterInst) return 0;

  const monsterData = monsters.find(m => m.ID === monsterInst.staticId);
  if (!monsterData) return 0;

  return monsterData.STR;
}

/**
 * 获取技能修正战力（Phase 4 实现，当前返回 0）
 */
export function getSkillPower(_G: GameState, _heroInstanceId: string): number {
  // TODO: Phase 4 实现技能战力修正
  return 0;
}

/**
 * 获取战牌修正战力
 */
export function getCombatCardPower(G: GameState, heroInstanceId: string): number {
  if (!G.combat) return 0;

  let power = 0;
  for (const play of G.combat.cardPlays) {
    const player = G.players[play.playerId];
    if (!player) continue;

    // 检查此出牌是否属于该角色
    if (player.heroInstanceId !== heroInstanceId) continue;

    const card = G.cardInstances[play.cardInstanceId];
    if (!card) continue;

    const tuxData = tux.find(t => t.ID === card.staticId);
    if (!tuxData) continue;

    const code = tuxData.CODE;

    // 金蚕王：战力+3
    if (code === 'ZP03') {
      power += 3;
    }
    // 天玄五音：战力+2（指定一方）
    if (code === 'ZP04') {
      power += 2;
    }
  }

  return power;
}

// ==================== 武器/防具战力映射 ====================

/**
 * 获取武器的战力加成
 * - 魔刀天吒(WQ03): +2
 * - 无尘剑(WQ01): +1
 * - 天蛇杖(WQ02): +1
 * - 魔剑(WQ04): +0（仅命中+1）
 * - 彩环(WQ05): +0（仅命中+2）
 */
function getWeaponPower(code: string): number {
  switch (code) {
    case 'WQ03': return 2; // 魔刀天吒
    case 'WQ01': return 1; // 无尘剑
    case 'WQ02': return 1; // 天蛇杖
    case 'WQ04': return 0; // 魔剑（仅命中）
    case 'WQ05': return 0; // 彩环（仅命中）
    default: return 0;
  }
}

/**
 * 获取防具的战力加成
 * - 乾坤道袍(FJ04): +1
 * - 五彩霞衣(FJ01): +1
 * - 龙魂战铠(FJ03): +0（仅减伤）
 * - 天帝祭服(FJ02): +0（隐蛊效果）
 * - 踏云靴(FJ05): +0（仅命中+1）
 */
function getArmorPower(code: string): number {
  switch (code) {
    case 'FJ04': return 1; // 乾坤道袍
    case 'FJ01': return 1; // 五彩霞衣
    case 'FJ03': return 0; // 龙魂战铠（仅减伤）
    case 'FJ02': return 0; // 天帝祭服（隐蛊效果）
    case 'FJ05': return 0; // 踏云靴（仅命中）
    default: return 0;
  }
}

// ==================== 命中计算 ====================

/**
 * 获取角色基础命中
 */
export function getBaseHit(G: GameState, heroInstanceId: string): number {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero) return 0;
  return hero.currentDex;
}

/**
 * 获取装备命中加成
 */
export function getEquipmentHit(G: GameState, heroInstanceId: string): number {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero) return 0;

  let hit = 0;

  if (hero.equipment.weapon) {
    const weaponCard = G.cardInstances[hero.equipment.weapon];
    if (weaponCard) {
      const tuxData = tux.find(t => t.ID === weaponCard.staticId);
      if (tuxData) {
        hit += getWeaponHit(tuxData.CODE);
      }
    }
  }

  if (hero.equipment.armor) {
    const armorCard = G.cardInstances[hero.equipment.armor];
    if (armorCard) {
      const tuxData = tux.find(t => t.ID === armorCard.staticId);
      if (tuxData) {
        hit += getArmorHit(tuxData.CODE);
      }
    }
  }

  return hit;
}

function getWeaponHit(code: string): number {
  switch (code) {
    case 'WQ04': return 1; // 魔剑
    case 'WQ01': return 1; // 无尘剑
    case 'WQ05': return 2; // 彩环
    default: return 0;
  }
}

function getArmorHit(code: string): number {
  switch (code) {
    case 'FJ05': return 1; // 踏云靴
    default: return 0;
  }
}

// ==================== 总战力计算 ====================

/**
 * 计算角色总战力（不含天罡战气翻倍）
 */
export function calculateTotalPower(G: GameState, heroInstanceId: string): number {
  const base = getBasePower(G, heroInstanceId);
  const equipment = getEquipmentPower(G, heroInstanceId);
  const pet = getPetPower(G, heroInstanceId);
  const skill = getSkillPower(G, heroInstanceId);
  const combatCard = getCombatCardPower(G, heroInstanceId);

  return base + equipment + pet + skill + combatCard;
}

/**
 * 计算天罡战气翻倍后的战力
 * 翻倍 = (基础 + 装备 + 宠物 + 技能) * 2 + 战牌修正
 */
export function calculatePowerWithTianGang(G: GameState, heroInstanceId: string): number {
  const base = getBasePower(G, heroInstanceId);
  const equipment = getEquipmentPower(G, heroInstanceId);
  const pet = getPetPower(G, heroInstanceId);
  const skill = getSkillPower(G, heroInstanceId);
  const combatCard = getCombatCardPower(G, heroInstanceId);

  return (base + equipment + pet + skill) * 2 + combatCard;
}

/**
 * 检查角色是否拥有天罡战气buff
 */
export function hasTianGangBuff(G: GameState, heroInstanceId: string): boolean {
  if (!G.combat) return false;

  for (const play of G.combat.cardPlays) {
    const player = G.players[play.playerId];
    if (!player || player.heroInstanceId !== heroInstanceId) continue;

    const card = G.cardInstances[play.cardInstanceId];
    if (!card) continue;

    const tuxData = tux.find(t => t.ID === card.staticId);
    if (tuxData && tuxData.CODE === 'ZP02') {
      return true;
    }
  }

  return false;
}

/**
 * 计算角色最终战力（考虑天罡战气）
 */
export function calculateFinalPower(G: GameState, heroInstanceId: string): number {
  if (hasTianGangBuff(G, heroInstanceId)) {
    return calculatePowerWithTianGang(G, heroInstanceId);
  }
  return calculateTotalPower(G, heroInstanceId);
}

// ==================== 伤害减免 ====================

/**
 * 计算龙魂战铠减伤
 * 受到任何伤害（倾慕除外），HP损失降低1点
 */
export function getDragonArmorReduction(G: GameState, heroInstanceId: string): number {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero || !hero.equipment.armor) return 0;

  const armorCard = G.cardInstances[hero.equipment.armor];
  if (!armorCard) return 0;

  const tuxData = tux.find(t => t.ID === armorCard.staticId);
  if (tuxData && tuxData.CODE === 'FJ03') {
    return 1; // 龙魂战铠：减伤1点
  }

  return 0;
}

/**
 * 检查角色是否装备了乾坤道袍（免疫技牌HP伤害）
 */
export function hasQiankunRobe(G: GameState, heroInstanceId: string): boolean {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero || !hero.equipment.armor) return false;

  const armorCard = G.cardInstances[hero.equipment.armor];
  if (!armorCard) return false;

  const tuxData = tux.find(t => t.ID === armorCard.staticId);
  return !!(tuxData && tuxData.CODE === 'FJ04');
}

/**
 * 检查角色是否装备了天帝祭服（手牌可当隐蛊）
 */
export function hasTianDiRobe(G: GameState, heroInstanceId: string): boolean {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero || !hero.equipment.armor) return false;

  const armorCard = G.cardInstances[hero.equipment.armor];
  if (!armorCard) return false;

  const tuxData = tux.find(t => t.ID === armorCard.staticId);
  return !!(tuxData && tuxData.CODE === 'FJ02');
}

/**
 * 检查角色是否装备了踏云靴（受伤时可爆发）
 */
export function hasTayunBoots(G: GameState, heroInstanceId: string): boolean {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero || !hero.equipment.armor) return false;

  const armorCard = G.cardInstances[hero.equipment.armor];
  if (!armorCard) return false;

  const tuxData = tux.find(t => t.ID === armorCard.staticId);
  return !!(tuxData && tuxData.CODE === 'FJ05');
}

/**
 * 检查角色是否装备了五彩霞衣（HP=0时可爆发复活）
 */
export function hasWucaiRobe(G: GameState, heroInstanceId: string): boolean {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero || !hero.equipment.armor) return false;

  const armorCard = G.cardInstances[hero.equipment.armor];
  if (!armorCard) return false;

  const tuxData = tux.find(t => t.ID === armorCard.staticId);
  return !!(tuxData && tuxData.CODE === 'FJ01');
}

/**
 * 检查角色是否装备了天蛇杖（HP回复量额外+1）
 */
export function hasTiansheStaff(G: GameState, heroInstanceId: string): boolean {
  const hero = G.heroInstances[heroInstanceId];
  if (!hero || !hero.equipment.weapon) return false;

  const weaponCard = G.cardInstances[hero.equipment.weapon];
  if (!weaponCard) return false;

  const tuxData = tux.find(t => t.ID === weaponCard.staticId);
  return !!(tuxData && tuxData.CODE === 'WQ02');
}
