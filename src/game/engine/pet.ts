/**
 * 仙剑逍遥游 - 宠物系统
 * Phase 5：怪物/NPC
 *
 * 实现宠物的获取、失去、交换逻辑：
 * - 获得宠物：战斗胜利后可选择捕获怪物作为宠物
 * - 失去宠物：特定条件触发（如怪物效果、弃牌等）
 * - 交换宠物：NPC效果或怪物效果触发
 *
 * 核心规则：
 * - 同属性唯一：每个角色只能拥有一个同属性宠物
 * - 宠物效果：获得时触发 petIncr，失去时触发 petDecr
 * - C# 源码对照：PSDGamepkg/Artiad/Kitty.cs
 */

import type { GameState } from '../../shared/types/game';
import { monsters } from '../../shared/data';
import { executePetIncr, executePetDecr, getMonsterElementCode } from '../monsters/monsterEffects';

// ==================== 宠物操作 ====================

/**
 * 获得宠物
 * 将怪物作为宠物分配给指定角色
 *
 * @param G 游戏状态
 * @param playerId 获得宠物的玩家ID
 * @param monsterInstanceId 怪物实例ID
 * @returns 是否成功获得
 */
export function obtainPet(
  G: GameState,
  playerId: string,
  monsterInstanceId: string,
): boolean {
  const player = G.players[playerId];
  if (!player || !player.isAlive) return false;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return false;

  const monsterInst = G.monsterInstances[monsterInstanceId];
  if (!monsterInst) return false;

  const monsterData = monsters.find(m => m.ID === monsterInst.staticId);
  if (!monsterData) return false;

  // 检查是否已有同属性宠物（五行属性匹配）
  // C# 对照：FiveElement 枚举，CODE前缀 GS=水, GH=火, GL=雷, GF=风, GT=土, GI=阴, GY=阳
  if (hero.pet) {
    const oldPetInst = G.monsterInstances[hero.pet];
    if (oldPetInst) {
      const oldPetData = monsters.find(m => m.ID === oldPetInst.staticId);
      if (oldPetData) {
        const newElement = getMonsterElementCode(monsterData.CODE);
        const oldElement = getMonsterElementCode(oldPetData.CODE);
        if (newElement === oldElement) {
          // 同属性，替换旧宠物
          releasePet(G, playerId, false); // 不触发Decr（被替换）
        }
      }
    }
  }

  // 执行旧宠物失去效果（如果有）
  if (hero.pet) {
    executePetDecr(G, hero.pet, playerId);
  }

  // 设置新宠物
  hero.pet = monsterInstanceId;

  // 从怪物牌堆移除（如果还在牌堆中）
  const pileIndex = G.piles.monsterPile.indexOf(monsterInstanceId);
  if (pileIndex !== -1) {
    G.piles.monsterPile.splice(pileIndex, 1);
  }

  // 执行宠物获得效果
  executePetIncr(G, monsterInstanceId, playerId);

  return true;
}

/**
 * 失去宠物
 * 移除指定角色的宠物
 *
 * @param G 游戏状态
 * @param playerId 失去宠物的玩家ID
 * @param triggerDecr 是否触发Decr效果（默认true）
 */
export function releasePet(
  G: GameState,
  playerId: string,
  triggerDecr: boolean = true,
): void {
  const player = G.players[playerId];
  if (!player) return;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero || !hero.pet) return;

  const petInstanceId = hero.pet;

  // 执行宠物失去效果
  if (triggerDecr) {
    executePetDecr(G, petInstanceId, playerId);
  }

  // 清除宠物引用
  hero.pet = null;

  // 宠物回到弃牌堆
  G.piles.discardPile.push(petInstanceId);
}

/**
 * 强制失去宠物（不触发Decr效果）
 */
export function forceReleasePet(G: GameState, playerId: string): void {
  releasePet(G, playerId, false);
}

/**
 * 交换宠物
 * 在两个角色之间交换宠物
 *
 * @param G 游戏状态
 * @param playerIdA 玩家A的ID
 * @param petInstanceIdA 玩家A要交换的宠物实例ID
 * @param playerIdB 玩家B的ID
 * @param petInstanceIdB 玩家B要交换的宠物实例ID
 */
export function tradePets(
  G: GameState,
  playerIdA: string,
  petInstanceIdA: string,
  playerIdB: string,
  petInstanceIdB: string,
): void {
  const playerA = G.players[playerIdA];
  const playerB = G.players[playerIdB];
  if (!playerA || !playerB) return;

  const heroA = G.heroInstances[playerA.heroInstanceId];
  const heroB = G.heroInstances[playerB.heroInstanceId];
  if (!heroA || !heroB) return;

  // 执行失去效果
  if (heroA.pet) executePetDecr(G, heroA.pet, playerIdA);
  if (heroB.pet) executePetDecr(G, heroB.pet, playerIdB);

  // 交换宠物
  const tempPet = heroA.pet;
  heroA.pet = heroB.pet;
  heroB.pet = tempPet;

  // 执行获得效果
  if (heroA.pet) executePetIncr(G, heroA.pet, playerIdA);
  if (heroB.pet) executePetIncr(G, heroB.pet, playerIdB);
}

// ==================== 宠物查询 ====================

/**
 * 获取角色的宠物战力
 */
export function getPetPower(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  if (!player) return 0;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero || !hero.pet) return 0;

  const monsterInst = G.monsterInstances[hero.pet];
  if (!monsterInst) return 0;

  const monsterData = monsters.find(m => m.ID === monsterInst.staticId);
  return monsterData ? monsterData.STR : 0;
}

/**
 * 获取角色的宠物属性（五行CODE前缀）
 */
export function getPetElement(G: GameState, playerId: string): string | null {
  const player = G.players[playerId];
  if (!player) return null;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero || !hero.pet) return null;

  const monsterInst = G.monsterInstances[hero.pet];
  if (!monsterInst) return null;

  const monsterData = monsters.find(m => m.ID === monsterInst.staticId);
  return monsterData ? getMonsterElementCode(monsterData.CODE) : null;
}

/**
 * 检查角色是否有宠物
 */
export function hasPet(G: GameState, playerId: string): boolean {
  const player = G.players[playerId];
  if (!player) return false;
  const hero = G.heroInstances[player.heroInstanceId];
  return !!(hero && hero.pet);
}

/**
 * 获取所有有宠物的角色
 */
export function getPlayersWithPets(G: GameState): string[] {
  return Object.entries(G.players)
    .filter(([, player]) => {
      if (!player.isAlive) return false;
      const hero = G.heroInstances[player.heroInstanceId];
      return !!(hero && hero.pet);
    })
    .map(([playerId]) => playerId);
}

/**
 * 检查角色是否拥有同属性宠物
 */
export function hasSameElementPet(G: GameState, playerId: string, elementCode: string): boolean {
  const player = G.players[playerId];
  if (!player) return false;
  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero || !hero.pet) return false;
  const petElement = getPetElement(G, playerId);
  return petElement === elementCode;
}

/**
 * 检查两个怪物是否同属性
 */
export function isSameMonsterElement(codeA: string, codeB: string): boolean {
  return getMonsterElementCode(codeA) === getMonsterElementCode(codeB);
}

// ==================== 宠物效果查询 ====================

/**
 * 获取宠物的效果描述文本
 */
export function getPetEffectText(G: GameState, playerId: string): string {
  const player = G.players[playerId];
  if (!player) return '';

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero || !hero.pet) return '';

  const monsterInst = G.monsterInstances[hero.pet];
  if (!monsterInst) return '';

  const monsterData = monsters.find(m => m.ID === monsterInst.staticId);
  return monsterData ? monsterData.PETTEXT : '';
}

/**
 * 获取怪物的出场效果描述文本
 */
export function getMonsterDebutText(monsterCode: string): string {
  const monsterData = monsters.find(m => m.CODE === monsterCode);
  return monsterData ? monsterData.DEBUTTEXT : '';
}

/**
 * 获取怪物的胜利效果描述文本
 */
export function getMonsterWinText(monsterCode: string): string {
  const monsterData = monsters.find(m => m.CODE === monsterCode);
  return monsterData ? monsterData.WINTEXT : '';
}

/**
 * 获取怪物的失败效果描述文本
 */
export function getMonsterLoseText(monsterCode: string): string {
  const monsterData = monsters.find(m => m.CODE === monsterCode);
  return monsterData ? monsterData.LOSETEXT : '';
}
