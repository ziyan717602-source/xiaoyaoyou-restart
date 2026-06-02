/**
 * 仙剑逍遥游 - 怪物效果引擎
 * Phase 5：怪物/NPC
 *
 * 实现 20 个怪物的 4 类效果：
 * - Debut（出场效果）：怪物翻出时立即执行
 * - WinEff（胜利效果）：战斗胜利时执行
 * - LoseEff（失败效果）：战斗失败时执行
 * - Pet（宠物效果）：成为宠物后，IncrAction 获得时 / DecrAction 失去时
 *
 * C# 源码对照：PSDGamepkg/JNS/FG04.cs → MonsterCottage 类
 * 铁律：每行效果代码必须有 C# 源码对照
 */

import type { GameState } from '../../shared/types/game';
import { monsters, tux, heroes } from '../../shared/data';
import { drawCards } from '../moves/drawCards';
import {
  dealDamage,
  dealDamageToMultiple,
  dealDamageToAll,
  healTarget,
  healMultiple,
  immobilizeTarget,
  unequipAllCards,
  discardAllCards,
} from '../skills/effects';

// ==================== 辅助函数 ====================

/** 获取怪物静态定义 */
function getMonsterData(code: string) {
  return monsters.find(m => m.CODE === code);
}

/** 获取怪物实例 */
function getMonsterInst(G: GameState, instanceId: string) {
  return G.monsterInstances[instanceId];
}

/** 获取存活玩家列表 */
function getAlivePlayers(G: GameState) {
  return Object.entries(G.players).filter(([, p]) => p.isAlive);
}

/** 获取指定队伍的存活玩家 */
function getAliveTeamPlayers(G: GameState, team: string) {
  return Object.entries(G.players).filter(([, p]) => p.isAlive && p.team === team);
}

/** 获取敌方队伍 */
function getOppTeam(G: GameState, team: string): string {
  return team === 'A' ? 'B' : 'A';
}

/** 获取所有装备实例ID */
function getAllEquipIds(G: GameState, playerId: string): string[] {
  const player = G.players[playerId];
  if (!player) return [];
  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return [];
  const equips: string[] = [];
  if (hero.equipment.weapon) equips.push(hero.equipment.weapon);
  if (hero.equipment.armor) equips.push(hero.equipment.armor);
  if (hero.equipment.special) equips.push(hero.equipment.special);
  return equips;
}

/** 弃置指定装备 */
function discardEquip(G: GameState, playerId: string, cardInstanceId: string): void {
  const player = G.players[playerId];
  if (!player) return;
  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return;
  if (hero.equipment.weapon === cardInstanceId) {
    hero.equipment.weapon = null;
  } else if (hero.equipment.armor === cardInstanceId) {
    hero.equipment.armor = null;
  } else if (hero.equipment.special === cardInstanceId) {
    hero.equipment.special = null;
  }
  G.piles.discardPile.push(cardInstanceId);
}

/** 弃置所有装备 */
function discardAllEquips(G: GameState, playerId: string): void {
  const equips = getAllEquipIds(G, playerId);
  for (const eq of equips) {
    discardEquip(G, playerId, eq);
  }
}

/** 获取角色手牌上限 */
function getHandLimit(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  return player ? player.handLimit : 3;
}

/** 获取角色手牌数 */
function getHandCount(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  return player ? player.hand.length : 0;
}

/** 获取角色装备数 */
function getEquipCount(G: GameState, playerId: string): number {
  return getAllEquipIds(G, playerId).length;
}

/** 获取角色宠物数 */
function getPetCount(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  if (!player) return 0;
  const hero = G.heroInstances[player.heroInstanceId];
  return hero && hero.pet ? 1 : 0;
}

/** 弃置手牌到指定数量 */
function discardToCount(G: GameState, playerId: string, targetCount: number): void {
  const player = G.players[playerId];
  if (!player) return;
  while (player.hand.length > targetCount) {
    const card = player.hand.shift();
    if (card) G.piles.discardPile.push(card);
  }
}

/** 补牌到指定数量 */
function drawToCount(G: GameState, playerId: string, targetCount: number): void {
  const player = G.players[playerId];
  if (!player) return;
  const ctx = { currentPlayer: playerId };
  while (player.hand.length < targetCount) {
    if (G.piles.handPile.length === 0) break;
    drawCards({ G, ctx }, 1);
  }
}

// ==================== 怪物效果接口 ====================

/** 随机源接口（与 ctx.random.Die 兼容） */
export interface RandomSource {
  Die: (sides: number) => number;
}

export interface MonsterEffectHandler {
  debut?: (G: GameState, random?: RandomSource) => void;
  winEff?: (G: GameState) => void;
  loseEff?: (G: GameState) => void;
  petIncr?: (G: GameState, ownerId: string) => void;
  petDecr?: (G: GameState, ownerId: string) => void;
}

/**
 * 获取怪物五行属性 CODE 前缀
 * C# 对照：MonsterLib 构造函数中的 switch (code.Substring(0, 2))
 */
export function getMonsterElementCode(monsterCode: string): string {
  return monsterCode.substring(0, 2);
}

// ==================== 水属性怪物 ====================

/** GS01 千杯不醉 (STR 4, AGL 4, Lv1) */
const GS01: MonsterEffectHandler = {
  // 出场：您和一名妨碍者手牌对调
  debut: (G) => {
    if (!G.combat) return;
    const rounderId = G.currentPlayerId;
    const hinderId = G.combat.hindererPlayerId;
    if (!hinderId) return;
    const rounder = G.players[rounderId];
    const hinder = G.players[hinderId];
    if (!rounder || !hinder) return;
    // 交换手牌
    const tempHand = [...rounder.hand];
    rounder.hand = [...hinder.hand];
    hinder.hand = tempHand;
  },
  // 宠物：主人战力+1
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr = Math.max(0, hero.currentStr - 1);
  },
  // 失败：您的角色横置
  loseEff: (G) => {
    immobilizeTarget(G, G.currentPlayerId);
  },
};

/** GS02 勇气 (STR 4, AGL 5, Lv1) */
const GS02: MonsterEffectHandler = {
  // 胜利：敌方全体HP-1后，指定一人HP额外-2
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    // 敌方全体HP-1
    for (const [pid] of enemies) {
      dealDamage(G, pid, 1);
    }
    // 简化：对敌方第一个存活角色额外-2（实际应由玩家选择）
    if (enemies.length > 0) {
      dealDamage(G, enemies[0]![0], 2);
    }
  },
  // 失败：您的HP-2，然后失去1件装备
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 2);
    const equips = getAllEquipIds(G, G.currentPlayerId);
    if (equips.length > 0) {
      discardEquip(G, G.currentPlayerId, equips[0]!);
    }
  },
};

/** GS03 蛇妖男 (STR 9, AGL 2, Lv2) */
const GS03: MonsterEffectHandler = {
  // 胜利：妨碍者HP-4
  winEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    dealDamage(G, G.combat.hindererPlayerId, 4);
  },
  // 失败：您的HP-4
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 4);
  },
};

/** GS04 水魔兽 (STR 7, AGL 6, Lv3) */
const GS04: MonsterEffectHandler = {
  // 胜利：敌人全体HP-1，之后抽取妨碍者1件装备或手牌
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    for (const [pid] of enemies) {
      dealDamage(G, pid, 1);
    }
    // 简化：抽取妨碍者1张手牌（实际应由玩家选择装备或手牌）
    if (G.combat && G.combat.hindererPlayerId) {
      const hinder = G.players[G.combat.hindererPlayerId];
      if (hinder && hinder.hand.length > 0) {
        const card = hinder.hand.shift();
        if (card) rounder.hand.push(card);
      }
    }
  },
  // 宠物：主人战力+1，命中+1
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) {
      hero.currentStr += 1;
      hero.currentDex += 1;
    }
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) {
      hero.currentStr = Math.max(0, hero.currentStr - 1);
      hero.currentDex = Math.max(0, hero.currentDex - 1);
    }
  },
  // 失败：您的HP-2，之后妨碍者抽取您的1件装备或手牌
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 2);
    // 简化：妨碍者抽取触发者1张手牌
    if (G.combat && G.combat.hindererPlayerId) {
      const rounder = G.players[G.currentPlayerId];
      const hinder = G.players[G.combat.hindererPlayerId];
      if (rounder && hinder && rounder.hand.length > 0) {
        const card = rounder.hand.shift();
        if (card) hinder.hand.push(card);
      }
    }
  },
};

// ==================== 火属性怪物 ====================

/** GH01 赝月 (STR 4, AGL 1, Lv1) */
const GH01: MonsterEffectHandler = {
  // 胜利：妨碍者HP-2
  winEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    dealDamage(G, G.combat.hindererPlayerId, 2);
  },
  // 失败：您的HP-3
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 3);
  },
  // 宠物：主人战力+1
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr = Math.max(0, hero.currentStr - 1);
  },
};

/** GH02 肥肥 (STR 2, AGL 5, Lv1) */
const GH02: MonsterEffectHandler = {
  // 胜利：妨碍者HP-3
  winEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    dealDamage(G, G.combat.hindererPlayerId, 3);
  },
  // 失败：您的HP-3
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 3);
  },
};

/** GH03 赤鬼王 (STR 6, AGL 3, Lv2) */
const GH03: MonsterEffectHandler = {
  // 出场：支援者受到(触发者战力-1)点伤害
  debut: (G) => {
    if (!G.combat || !G.combat.supporterPlayerId) return;
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const hero = G.heroInstances[rounder.heroInstanceId];
    if (!hero) return;
    const damage = hero.currentStr - 1;
    if (damage > 0) {
      dealDamage(G, G.combat.supporterPlayerId, damage);
    }
  },
  // 胜利：妨碍者HP-3
  winEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    dealDamage(G, G.combat.hindererPlayerId, 3);
  },
  // 失败：敌方选择2名角色各受3点火伤害（简化：触发者和支援者各受3点）
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 3);
    if (G.combat && G.combat.supporterPlayerId) {
      dealDamage(G, G.combat.supporterPlayerId, 3);
    }
  },
  // 宠物：主人战力+2
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr += 2;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr = Math.max(0, hero.currentStr - 2);
  },
};

/** GH04 毒娘子 (STR 4, AGL 4, Lv2) */
const GH04: MonsterEffectHandler = {
  // 出场：所有存活角色HP-2
  debut: (G) => {
    dealDamageToAll(G, 2);
  },
  // 胜利：敌方全体HP-2
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    for (const [pid] of enemies) {
      dealDamage(G, pid, 2);
    }
  },
  // 失败：触发者和支援者各受2点伤害
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 2);
    if (G.combat && G.combat.supporterPlayerId) {
      dealDamage(G, G.combat.supporterPlayerId, 2);
    }
  },
  // 宠物：主人战力+2
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr += 2;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr = Math.max(0, hero.currentStr - 2);
  },
};

// ==================== 雷属性怪物 ====================

/** GL01 暗香 (STR 3, AGL 6, Lv1) */
const GL01: MonsterEffectHandler = {
  // 胜利：选择一名存活角色HP+2（简化：触发者HP+2）
  winEff: (G) => {
    healTarget(G, G.currentPlayerId, 2);
  },
  // 失败：您的HP-3
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 3);
  },
};

/** GL02 蝶精 (STR 2, AGL 7, Lv1) */
const GL02: MonsterEffectHandler = {
  // 出场：支援者命中+2（简化：标记到RAM）
  debut: (G) => {
    // 实际应修改支援者DEX，这里简化处理
    if (!G.combat || !G.combat.supporterPlayerId) return;
    const player = G.players[G.combat.supporterPlayerId];
    if (player) player.ram['gl02_dex_bonus'] = 2;
  },
  // 胜利：选择一名角色补2张牌（简化：触发者补2张）
  winEff: (G) => {
    const ctx = { currentPlayer: G.currentPlayerId };
    drawCards({ G, ctx }, 2);
  },
  // 失败：您的HP-2，然后失去所有装备并补等量手牌
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 2);
    const equipCount = getEquipCount(G, G.currentPlayerId);
    discardAllEquips(G, G.currentPlayerId);
    if (equipCount > 0) {
      const ctx = { currentPlayer: G.currentPlayerId };
      drawCards({ G, ctx }, equipCount);
    }
  },
};

/** GL03 刑天 (STR 5, AGL 4, Lv2) */
const GL03: MonsterEffectHandler = {
  // 胜利：弃置手牌，每弃1张HP+2（简化：弃1张HP+2）
  winEff: (G) => {
    const player = G.players[G.currentPlayerId];
    if (player && player.hand.length > 0) {
      const card = player.hand.shift();
      if (card) {
        G.piles.discardPile.push(card);
        healTarget(G, G.currentPlayerId, 2);
      }
    }
  },
  // 失败：失去所有装备，然后所有玩家中装备最多的弃置所有装备
  loseEff: (G) => {
    discardAllEquips(G, G.currentPlayerId);
    // 简化：所有存活玩家弃置所有装备
    for (const [pid] of getAlivePlayers(G)) {
      discardAllEquips(G, pid);
    }
  },
  // 宠物：主人命中+2
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentDex += 2;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentDex = Math.max(0, hero.currentDex - 2);
  },
};

/** GL04 金蟾鬼母 (STR 3, AGL 5, Lv3) */
const GL04: MonsterEffectHandler = {
  // 胜利：己方有装备的角色各补等量手牌
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      const eqCount = getEquipCount(G, pid);
      if (eqCount > 0) {
        const ctx = { currentPlayer: pid };
        drawCards({ G, ctx }, eqCount);
      }
    }
  },
  // 失败：己方全体HP-2
  loseEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      dealDamage(G, pid, 2);
    }
  },
  // 宠物：敌方武器无效（简化：标记）
  petIncr: (G, _ownerId) => {
    // 实际应禁用敌方武器效果，这里简化标记
    G.rfm = G.rfm || {};
    (G as any).rfm_gl04_weapon_disabled = true;
  },
  petDecr: (G, _ownerId) => {
    (G as any).rfm_gl04_weapon_disabled = false;
  },
};

// ==================== 风属性怪物 ====================

/** GF01 璇龟 (STR 3, AGL 3, Lv1) */
const GF01: MonsterEffectHandler = {
  // 胜利：触发者补1张牌
  winEff: (G) => {
    const ctx = { currentPlayer: G.currentPlayerId };
    drawCards({ G, ctx }, 1);
  },
  // 失败：您的HP-2
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 2);
  },
};

/** GF02 句芒 (STR 2, AGL 4, Lv1) */
const GF02: MonsterEffectHandler = {
  // 胜利：触发者HP+2
  winEff: (G) => {
    healTarget(G, G.currentPlayerId, 2);
  },
  // 失败：敌方全体HP+2
  loseEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    for (const [pid] of enemies) {
      healTarget(G, pid, 2);
    }
  },
  // 宠物：主人战力+1
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr = Math.max(0, hero.currentStr - 1);
  },
};

/** GF03 五毒兽 (STR 4, AGL 5, Lv2) */
const GF03: MonsterEffectHandler = {
  // 胜利：触发者和支援者各HP+2
  winEff: (G) => {
    healTarget(G, G.currentPlayerId, 2);
    if (G.combat && G.combat.supporterPlayerId) {
      healTarget(G, G.combat.supporterPlayerId, 2);
    }
  },
  // 失败：己方全体弃置所有手牌后补等量，然后各HP-2
  loseEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      const handCount = getHandCount(G, pid);
      discardAllCards(G, pid);
      const ctx = { currentPlayer: pid };
      drawCards({ G, ctx }, handCount);
      dealDamage(G, pid, 2);
    }
  },
};

/** GF04 叶灵 (STR 2, AGL 6, Lv2) */
const GF04: MonsterEffectHandler = {
  // 胜利：敌方选择一名角色HP+2（简化：敌方第一个角色HP+2）
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    if (enemies.length > 0) {
      healTarget(G, enemies[0]![0], 2);
    }
  },
};

// ==================== 土属性怪物 ====================

/** GT01 积粮隐者 (STR 5, AGL 2, Lv1) */
const GT01: MonsterEffectHandler = {
  // 胜利：触发者和支援者各受3点伤害
  winEff: (G) => {
    dealDamage(G, G.currentPlayerId, 3);
    if (G.combat && G.combat.supporterPlayerId) {
      dealDamage(G, G.combat.supporterPlayerId, 3);
    }
  },
  // 失败：妨碍者HP-3
  loseEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    dealDamage(G, G.combat.hindererPlayerId, 3);
  },
};

/** GT02 邪剑仙 (STR 6, AGL 3, Lv2) */
const GT02: MonsterEffectHandler = {
  // 出场：非参战角色各受到等于其手牌数的伤害
  debut: (G) => {
    if (!G.combat) return;
    const rounderId = G.currentPlayerId;
    const supporterId = G.combat.supporterPlayerId;
    const hinderId = G.combat.hindererPlayerId;
    const attendIds = new Set([rounderId, supporterId, hinderId].filter(Boolean));
    for (const [pid, player] of getAlivePlayers(G)) {
      if (!attendIds.has(pid)) {
        const damage = player.hand.length;
        if (damage > 0) dealDamage(G, pid, damage);
      }
    }
  },
  // 宠物：主人命中+1
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentDex += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentDex = Math.max(0, hero.currentDex - 1);
  },
};

/** GT03 熔岩兽王 (STR 8, AGL 1, Lv3) */
const GT03: MonsterEffectHandler = {
  // 出场：自身战力+3
  debut: (G) => {
    if (!G.combat) return;
    const monster = G.monsterInstances[G.combat.monsterInstanceId];
    if (monster) monster.currentStr += 3;
  },
  // 胜利：敌方全体HP-1
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    for (const [pid] of enemies) {
      dealDamage(G, pid, 1);
    }
  },
  // 失败：己方全体HP-2
  loseEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      dealDamage(G, pid, 2);
    }
  },
};

// ==================== 阴属性怪物 ====================

/** GIT1 天鬼皇 (STR 5, AGL 4, Lv1) */
const GIT1: MonsterEffectHandler = {
  // 出场：支援者战力+1
  debut: (G) => {
    if (!G.combat || !G.combat.supporterPlayerId) return;
    const player = G.players[G.combat.supporterPlayerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr += 1;
  },
  // 胜利：己方队友各补1张牌
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      if (pid !== G.currentPlayerId) {
        const ctx = { currentPlayer: pid };
        drawCards({ G, ctx }, 1);
      }
    }
  },
  // 失败：您的HP-3，然后弃置1件装备并补1张牌
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 3);
    const equips = getAllEquipIds(G, G.currentPlayerId);
    if (equips.length > 0) {
      discardEquip(G, G.currentPlayerId, equips[0]!);
      const ctx = { currentPlayer: G.currentPlayerId };
      drawCards({ G, ctx }, 1);
    }
  },
};

/** GIT3 魔骨 (STR 4, AGL 3, Lv2) */
const GIT3: MonsterEffectHandler = {
  // 出场：交换触发者和妨碍者的基础装备
  debut: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    const rounder = G.players[G.currentPlayerId];
    const hinder = G.players[G.combat.hindererPlayerId];
    if (!rounder || !hinder) return;
    const rounderHero = G.heroInstances[rounder.heroInstanceId];
    const hinderHero = G.heroInstances[hinder.heroInstanceId];
    if (!rounderHero || !hinderHero) return;
    // 交换武器
    const tempWeapon = rounderHero.equipment.weapon;
    rounderHero.equipment.weapon = hinderHero.equipment.weapon;
    hinderHero.equipment.weapon = tempWeapon;
    // 交换防具
    const tempArmor = rounderHero.equipment.armor;
    rounderHero.equipment.armor = hinderHero.equipment.armor;
    hinderHero.equipment.armor = tempArmor;
  },
  // 胜利：敌方有装备的角色各受等于装备数的伤害
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    for (const [pid] of enemies) {
      const eqCount = getEquipCount(G, pid);
      if (eqCount > 0) dealDamage(G, pid, eqCount);
    }
  },
  // 失败：己方有装备的角色各受等于装备数的伤害
  loseEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      const eqCount = getEquipCount(G, pid);
      if (eqCount > 0) dealDamage(G, pid, eqCount);
    }
  },
  // 宠物：主人战力+1或命中+1（简化：战力+1）
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr = Math.max(0, hero.currentStr - 1);
  },
};

/** GIT4 鬼将军 (STR 5, AGL 5, Lv2) */
const GIT4: MonsterEffectHandler = {
  // 出场：掷骰，战力+ceil(骰值/2)
  // C# 对照：FG04.cs → GIT4Debut: XI.RaiseGMessage("G0TT,..."); int val = (DiceValue + 1) / 2;
  debut: (G, random) => {
    if (!G.combat) return;
    const monster = G.monsterInstances[G.combat.monsterInstanceId];
    if (!monster) return;
    const diceValue = random ? random.Die(6) : 4; // 默认4（无随机源时）
    const bonus = Math.floor((diceValue + 1) / 2);
    if (bonus > 0) monster.currentStr += bonus;
  },
  // 胜利：妨碍者HP-2
  winEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    dealDamage(G, G.combat.hindererPlayerId, 2);
  },
  // 失败：触发者和支援者各受2点伤害
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 2);
    if (G.combat && G.combat.supporterPlayerId) {
      dealDamage(G, G.combat.supporterPlayerId, 2);
    }
  },
  // 宠物：主人战力+1
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr = Math.max(0, hero.currentStr - 1);
  },
};

/** GIT5 积粮隐者·改 (STR 4, AGL 4, Lv1) */
const GIT5: MonsterEffectHandler = {
  // 出场：自身战力+存活人数
  debut: (G) => {
    if (!G.combat) return;
    const monster = G.monsterInstances[G.combat.monsterInstanceId];
    if (!monster) return;
    const aliveCount = getAlivePlayers(G).length;
    monster.currentStr += aliveCount;
  },
  // 胜利：敌方全体HP-1
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    for (const [pid] of enemies) {
      dealDamage(G, pid, 1);
    }
  },
  // 失败：己方全体HP-1
  loseEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      dealDamage(G, pid, 1);
    }
  },
};

/** GIT8 戾枭 (STR 3, AGL 6, Lv2) */
const GIT8: MonsterEffectHandler = {
  // 出场：掷骰，获得战力墙(骰值/2)
  debut: (G) => {
    if (!G.combat) return;
    const monster = G.monsterInstances[G.combat.monsterInstanceId];
    if (!monster) return;
    // 简化：战力+2
    monster.currentStr += 2;
  },
  // 胜利：抽取敌方一名角色1张手牌并对其造成2点伤害
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam).filter(([, p]) => p.hand.length > 0);
    if (enemies.length > 0) {
      const [targetId, target] = enemies[0]!;
      const card = target.hand.shift();
      if (card) rounder.hand.push(card);
      dealDamage(G, targetId, 2);
    }
  },
  // 失败：妨碍者执行相同效果
  loseEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    const hinder = G.players[G.combat.hindererPlayerId];
    if (!hinder) return;
    const oppTeam = getOppTeam(G, hinder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam).filter(([, p]) => p.hand.length > 0);
    if (enemies.length > 0) {
      const [targetId, target] = enemies[0]!;
      const card = target.hand.shift();
      if (card) hinder.hand.push(card);
      dealDamage(G, targetId, 2);
    }
  },
};

// ==================== 阳属性怪物 ====================

/** GYT1 句芒·阳 (STR 3, AGL 5, Lv1) */
const GYT1: MonsterEffectHandler = {
  // 出场：手牌不足3张的各补至3张
  debut: (G) => {
    for (const [pid] of getAlivePlayers(G)) {
      drawToCount(G, pid, 3);
    }
  },
  // 胜利：选择最多3名角色各获得一个五行标记（简化：标记到RAM）
  winEff: (G) => {
    // 简化处理：触发者获得标记
    const player = G.players[G.currentPlayerId];
    if (player) player.ram['gyt1_rune'] = true;
  },
  // 宠物：主人战力+1，命中+2
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) {
      hero.currentStr += 1;
      hero.currentDex += 2;
    }
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) {
      hero.currentStr = Math.max(0, hero.currentStr - 1);
      hero.currentDex = Math.max(0, hero.currentDex - 2);
    }
  },
};

/** GYT3 千杯不醉·阳 (STR 5, AGL 4, Lv2) */
const GYT3: MonsterEffectHandler = {
  // 出场：所有角色手牌调整至3张
  debut: (G) => {
    for (const [pid, player] of getAlivePlayers(G)) {
      if (player.hand.length > 3) {
        discardToCount(G, pid, 3);
      } else if (player.hand.length < 3) {
        drawToCount(G, pid, 3);
      }
    }
  },
  // 胜利：触发者获得3张牌（简化：从牌堆补3张）
  winEff: (G) => {
    const ctx = { currentPlayer: G.currentPlayerId };
    drawCards({ G, ctx }, 3);
  },
  // 失败：妨碍者获得3张牌
  loseEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    const ctx = { currentPlayer: G.combat.hindererPlayerId };
    drawCards({ G, ctx }, 3);
  },
  // 宠物：主人战力+1，命中+1，手牌上限+1
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) {
      hero.currentStr += 1;
      hero.currentDex += 1;
    }
    player.handLimit += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) {
      hero.currentStr = Math.max(0, hero.currentStr - 1);
      hero.currentDex = Math.max(0, hero.currentDex - 1);
    }
    player.handLimit = Math.max(1, player.handLimit - 1);
  },
};

/** GYT4 赤鬼王·阳 (STR 4, AGL 3, Lv2) */
const GYT4: MonsterEffectHandler = {
  // 出场：所有角色失去正面五行标记
  debut: (G) => {
    for (const [, player] of getAlivePlayers(G)) {
      player.ram['gyt4_rune_lost'] = true;
    }
  },
  // 胜利：敌方弃置1张手牌，触发者获得1个正面五行标记
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam).filter(([, p]) => p.hand.length > 0);
    if (enemies.length > 0) {
      const [targetId, target] = enemies[0]!;
      const card = target.hand.shift();
      if (card) G.piles.discardPile.push(card);
    }
    rounder.ram['gyt4_rune_gained'] = true;
  },
  // 失败：触发者执行相同效果
  loseEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam).filter(([, p]) => p.hand.length > 0);
    if (enemies.length > 0) {
      const [targetId, target] = enemies[0]!;
      const card = target.hand.shift();
      if (card) G.piles.discardPile.push(card);
    }
    rounder.ram['gyt4_rune_gained'] = true;
  },
};

/** GYT5 水魔兽·阳 (STR 4, AGL 5, Lv1) */
const GYT5: MonsterEffectHandler = {
  // 出场：所有有手牌的角色各弃1张
  debut: (G) => {
    for (const [pid, player] of getAlivePlayers(G)) {
      if (player.hand.length > 0) {
        const card = player.hand.shift();
        if (card) G.piles.discardPile.push(card);
      }
    }
  },
  // 胜利：敌方选择一名角色弃1张手牌
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam).filter(([, p]) => p.hand.length > 0);
    if (enemies.length > 0) {
      const [targetId, target] = enemies[0]!;
      const card = target.hand.shift();
      if (card) G.piles.discardPile.push(card);
    }
  },
  // 宠物：主人命中+1
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentDex += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentDex = Math.max(0, hero.currentDex - 1);
  },
};

/** GYT6 蝶精·阳 (STR 4, AGL 4, Lv1) */
const GYT6: MonsterEffectHandler = {
  // 出场：非参战角色各弃置所有装备
  debut: (G) => {
    if (!G.combat) return;
    const rounderId = G.currentPlayerId;
    const supporterId = G.combat.supporterPlayerId;
    const hinderId = G.combat.hindererPlayerId;
    const attendIds = new Set([rounderId, supporterId, hinderId].filter(Boolean));
    for (const [pid] of getAlivePlayers(G)) {
      if (!attendIds.has(pid)) {
        discardAllEquips(G, pid);
      }
    }
  },
  // 胜利：敌方有装备的角色各弃1件装备
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    for (const [pid] of enemies) {
      const equips = getAllEquipIds(G, pid);
      if (equips.length > 0) {
        discardEquip(G, pid, equips[0]!);
      }
    }
  },
  // 宠物：主人战力+1
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentStr = Math.max(0, hero.currentStr - 1);
  },
};

/** GYT7 金蟾鬼母·阳 (STR 3, AGL 5, Lv2) */
const GYT7: MonsterEffectHandler = {
  // 出场：手牌超过上限的角色各弃至上限
  debut: (G) => {
    for (const [pid, player] of getAlivePlayers(G)) {
      if (player.hand.length > player.handLimit) {
        discardToCount(G, pid, player.handLimit);
      }
    }
  },
  // 胜利：选择一名队友补至手牌上限
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    // 简化：触发者补至手牌上限
    drawToCount(G, G.currentPlayerId, getHandLimit(G, G.currentPlayerId));
  },
  // 宠物：主人命中+1
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentDex += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentDex = Math.max(0, hero.currentDex - 1);
  },
};

/** GYT8 刑天·阳 (STR 5, AGL 4, Lv3) */
const GYT8: MonsterEffectHandler = {
  // 出场：所有角色获得1个负面五行标记
  debut: (G) => {
    for (const [, player] of getAlivePlayers(G)) {
      player.ram['gyt8_negative_rune'] = true;
    }
  },
  // 胜利：选择一名角色掷骰，>4补(骰值-4)张，<4弃(4-骰值)张
  winEff: (G) => {
    // 简化：触发者补2张（平均值）
    const ctx = { currentPlayer: G.currentPlayerId };
    drawCards({ G, ctx }, 2);
  },
  // 失败：妨碍者执行相同效果
  loseEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    const ctx = { currentPlayer: G.combat.hindererPlayerId };
    drawCards({ G, ctx }, 2);
  },
};

// ==================== 扩展包怪物（简化实现） ====================

/** GST1 蝶精·T (STR 3, AGL 6, Lv1) - Package 4# */
const GST1: MonsterEffectHandler = {
  debut: (G) => {
    if (!G.combat || !G.combat.supporterPlayerId) return;
    // 支援者命中-4（简化：标记）
    const player = G.players[G.combat.supporterPlayerId];
    if (player) player.ram['gst1_dex_penalty'] = 4;
  },
  winEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    const hinder = G.players[G.combat.hindererPlayerId];
    if (!hinder) return;
    // 妨碍者弃置所有手牌或补满后横置
    if (hinder.hand.length >= 2) {
      discardAllCards(G, G.combat.hindererPlayerId);
    } else {
      drawToCount(G, G.combat.hindererPlayerId, hinder.handLimit);
      immobilizeTarget(G, G.combat.hindererPlayerId);
    }
  },
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 3);
  },
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentDex += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) hero.currentDex = Math.max(0, hero.currentDex - 1);
  },
};

/** GST2 暗香·T (STR 4, AGL 5, Lv1) - Package 4# */
const GST2: MonsterEffectHandler = {
  winEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    const hinder = G.players[G.combat.hindererPlayerId];
    if (!hinder) return;
    const eqCount = getEquipCount(G, G.combat.hindererPlayerId);
    dealDamage(G, G.combat.hindererPlayerId, eqCount + 2);
    if (eqCount > 0) {
      const equips = getAllEquipIds(G, G.combat.hindererPlayerId);
      discardEquip(G, G.combat.hindererPlayerId, equips[0]!);
    }
  },
  loseEff: (G) => {
    const eqCount = getEquipCount(G, G.currentPlayerId);
    dealDamage(G, G.currentPlayerId, eqCount + 2);
    if (eqCount > 0) {
      const equips = getAllEquipIds(G, G.currentPlayerId);
      discardEquip(G, G.currentPlayerId, equips[0]!);
    }
  },
};

/** GHT1 赤鬼王·T (STR 5, AGL 3, Lv2) - Package 4# */
const GHT1: MonsterEffectHandler = {
  debut: (G) => {
    if (!G.combat) return;
    const monster = G.monsterInstances[G.combat.monsterInstanceId];
    if (!monster) return;
    // 战力+=己方火宠物战力总和
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    let bonus = 0;
    // 简化：检查队友宠物
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [, tm] of teammates) {
      const hero = G.heroInstances[tm.heroInstanceId];
      if (hero && hero.pet) {
        const petInst = G.monsterInstances[hero.pet];
        if (petInst) {
          const petData = monsters.find(m => m.ID === petInst.staticId);
          if (petData && petData.CODE.startsWith('GH')) {
            bonus += petData.STR;
          }
        }
      }
    }
    if (bonus > 0) monster.currentStr += bonus;
  },
  winEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    dealDamage(G, G.combat.hindererPlayerId, 2);
  },
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 2);
    if (G.combat && G.combat.supporterPlayerId) {
      dealDamage(G, G.combat.supporterPlayerId, 2);
    }
  },
};

/** GHT2 毒娘子·T (STR 5, AGL 4, Lv2) - Package 4# */
const GHT2: MonsterEffectHandler = {
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    for (const [pid] of enemies) {
      dealDamage(G, pid, 3);
    }
  },
  loseEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      dealDamage(G, pid, 3);
    }
  },
};

/** GFT1 五毒兽·T (STR 4, AGL 5, Lv1) - Package 4# */
const GFT1: MonsterEffectHandler = {
  debut: (G) => {
    for (const [pid] of getAlivePlayers(G)) {
      healTarget(G, pid, 1);
    }
  },
  winEff: (G) => {
    healTarget(G, G.currentPlayerId, 3);
  },
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 2);
    if (G.combat && G.combat.supporterPlayerId) {
      dealDamage(G, G.combat.supporterPlayerId, 2);
    }
    // 己方手牌>1的角色各弃至1张
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      discardToCount(G, pid, 1);
    }
  },
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (player) player.handLimit += 1;
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (player) player.handLimit = Math.max(1, player.handLimit - 1);
  },
};

/** GFT2 句芒·T (STR 3, AGL 5, Lv2) - Package 4# */
const GFT2: MonsterEffectHandler = {
  debut: (G) => {
    for (const [pid, player] of getAlivePlayers(G)) {
      if (player.hand.length > 0) {
        const card = player.hand.shift();
        if (card) G.piles.discardPile.push(card);
      }
    }
  },
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      healTarget(G, pid, 2);
    }
  },
  loseEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    for (const [pid] of enemies) {
      healTarget(G, pid, 1);
    }
  },
};

/** GTT1 积粮隐者·T (STR 5, AGL 2, Lv1) - Package 4# */
const GTT1: MonsterEffectHandler = {
  winEff: (G) => {
    const player = G.players[G.currentPlayerId];
    if (!player) return;
    // 触发者弃置最多2张手牌
    const discardCount = Math.min(2, player.hand.length);
    discardToCount(G, G.currentPlayerId, player.hand.length - discardCount);
    // 支援者弃置最多2张手牌
    if (G.combat && G.combat.supporterPlayerId) {
      const supporter = G.players[G.combat.supporterPlayerId];
      if (supporter) {
        const sDiscard = Math.min(2, supporter.hand.length);
        discardToCount(G, G.combat.supporterPlayerId, supporter.hand.length - sDiscard);
      }
    }
  },
  loseEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    const hinder = G.players[G.combat.hindererPlayerId];
    if (!hinder) return;
    const discardCount = Math.min(2, hinder.hand.length);
    discardToCount(G, G.combat.hindererPlayerId, hinder.hand.length - discardCount);
  },
};

/** GTT2 邪剑仙·T (STR 6, AGL 3, Lv2) - Package 4# */
const GTT2: MonsterEffectHandler = {
  debut: (G) => {
    for (const [pid, player] of getAlivePlayers(G)) {
      const damage = Math.floor((player.hand.length + 2) / 3);
      if (damage > 0) dealDamage(G, pid, damage);
    }
  },
  loseEff: (G) => {
    // 己方弃置累积战力>=4的宠物
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      const player = G.players[pid];
      if (!player) continue;
      const hero = G.heroInstances[player.heroInstanceId];
      if (hero && hero.pet) {
        const petInst = G.monsterInstances[hero.pet];
        if (petInst) {
          const petData = monsters.find(m => m.ID === petInst.staticId);
          if (petData && petData.STR >= 4) {
            hero.pet = null;
            G.piles.discardPile.push(petInst.instanceId);
          }
        }
      }
    }
  },
};

// ==================== 扩展包怪物（HL 系列简化） ====================

/** GSH1 熔岩兽王·H (Boss) */
const GSH1: MonsterEffectHandler = {
  debut: (G) => {
    if (!G.combat) return;
    const monster = G.monsterInstances[G.combat.monsterInstanceId];
    if (!monster) return;
    // 战力+=己方宠物数*2
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    let petCount = 0;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [, tm] of teammates) {
      petCount += getPetCount(G, tm.id);
    }
    if (petCount > 0) monster.currentStr += petCount * 2;
  },
  winEff: (G) => {
    const player = G.players[G.currentPlayerId];
    if (!player) return;
    // 弃置手牌补牌（简化：弃1补1）
    if (player.hand.length > 0) {
      const card = player.hand.shift();
      if (card) G.piles.discardPile.push(card);
      const ctx = { currentPlayer: G.currentPlayerId };
      drawCards({ G, ctx }, 1);
    }
  },
  loseEff: (G) => {
    dealDamage(G, G.currentPlayerId, 2);
    if (G.combat && G.combat.hindererPlayerId) {
      healTarget(G, G.combat.hindererPlayerId, 2);
    }
    // 选择是否弃置所有装备及宠物
    const player = G.players[G.currentPlayerId];
    if (player) {
      discardAllEquips(G, G.currentPlayerId);
      const hero = G.heroInstances[player.heroInstanceId];
      if (hero && hero.pet) {
        G.piles.discardPile.push(hero.pet);
        hero.pet = null;
      }
    }
  },
  petIncr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) {
      hero.currentStr += 1;
      hero.currentDex += 1;
    }
  },
  petDecr: (G, ownerId) => {
    const player = G.players[ownerId];
    if (!player) return;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero) {
      hero.currentStr = Math.max(0, hero.currentStr - 1);
      hero.currentDex = Math.max(0, hero.currentDex - 1);
    }
  },
};

/** GSH2 天鬼皇·H (Boss) */
const GSH2: MonsterEffectHandler = {
  debut: (G) => {
    // 非参战角色手牌无效（简化：标记）
    if (!G.combat) return;
    const rounderId = G.currentPlayerId;
    const supporterId = G.combat.supporterPlayerId;
    const hinderId = G.combat.hindererPlayerId;
    const attendIds = new Set([rounderId, supporterId, hinderId].filter(Boolean));
    for (const [pid] of getAlivePlayers(G)) {
      if (!attendIds.has(pid)) {
        const player = G.players[pid];
        if (player) player.ram['gsh2_tux_disabled'] = true;
      }
    }
  },
  winEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    dealDamage(G, G.combat.hindererPlayerId, 4);
  },
  loseEff: (G) => {
    if (!G.combat || !G.combat.hindererPlayerId) return;
    dealDamage(G, G.combat.hindererPlayerId, 4);
  },
};

/** GSH3 熔岩兽王·H2 (Boss) */
const GSH3: MonsterEffectHandler = {
  debut: (G) => {
    // 跳过战牌阶段（简化：标记）
    if (G.combat) G.combat.isFinished = true;
  },
};

/** GHH1 邪剑仙·H (Boss) */
const GHH1: MonsterEffectHandler = {
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const oppTeam = getOppTeam(G, rounder.team);
    const enemies = getAliveTeamPlayers(G, oppTeam);
    for (const [pid] of enemies) {
      dealDamage(G, pid, 2);
    }
    // 妨碍者弃牌回复HP
    if (G.combat && G.combat.hindererPlayerId) {
      const hinder = G.players[G.combat.hindererPlayerId];
      if (hinder && hinder.hand.length > 0) {
        const cardCount = hinder.hand.length;
        discardAllCards(G, G.combat.hindererPlayerId);
        for (const [pid] of enemies) {
          healTarget(G, pid, cardCount);
        }
      }
    }
  },
  loseEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      dealDamage(G, pid, 2);
    }
    // 触发者弃牌回复HP
    if (rounder.hand.length > 0) {
      const cardCount = rounder.hand.length;
      discardAllCards(G, G.currentPlayerId);
      for (const [pid] of teammates) {
        healTarget(G, pid, cardCount);
      }
    }
  },
};

/** GHH2 鬼将军·H (Boss) */
const GHH2: MonsterEffectHandler = {
  debut: (G) => {
    // 手牌传递（简化：跳过）
  },
  winEff: (G) => {
    const player = G.players[G.currentPlayerId];
    if (player) discardAllCards(G, G.currentPlayerId);
    if (G.combat && G.combat.hindererPlayerId) {
      dealDamage(G, G.combat.hindererPlayerId, 2);
    }
  },
  loseEff: (G) => {
    for (const [pid] of getAlivePlayers(G)) {
      dealDamage(G, pid, 1);
    }
  },
};

/** GLH1 暗香·H (Boss) */
const GLH1: MonsterEffectHandler = {
  debut: (G) => {
    // 战力+=死亡或受伤角色数
    if (!G.combat) return;
    const monster = G.monsterInstances[G.combat.monsterInstanceId];
    if (!monster) return;
    let cnt = 0;
    for (const [, player] of getAlivePlayers(G)) {
      const hero = G.heroInstances[player.heroInstanceId];
      if (hero && hero.currentHp < hero.maxHp) cnt++;
    }
    if (cnt > 0) monster.currentStr += cnt;
  },
  winEff: (G) => {
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      const petCount = getPetCount(G, pid);
      if (petCount > 0) {
        const ctx = { currentPlayer: pid };
        drawCards({ G, ctx }, petCount);
      }
    }
  },
  loseEff: (G) => {
    // 己方有手牌且对面存活的角色各交1张手牌给对面
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return;
    const teammates = getAliveTeamPlayers(G, rounder.team);
    for (const [pid] of teammates) {
      const player = G.players[pid];
      if (!player || player.hand.length === 0) continue;
      const oppTeam = getOppTeam(G, player.team);
      const enemies = getAliveTeamPlayers(G, oppTeam);
      if (enemies.length > 0) {
        const card = player.hand.shift();
        if (card) {
          const targetPlayer = G.players[enemies[0]![0]];
          if (targetPlayer) targetPlayer.hand.push(card);
        }
      }
    }
  },
};

/** GFH1 璇龟·H (Boss) */
const GFH1: MonsterEffectHandler = {
  debut: (G) => {
    // 标记战斗混乱（简化）
    if (G.combat) (G.combat as any).fightTangled = true;
  },
  winEff: (G) => {
    // 交换宠物（简化：跳过复杂逻辑）
  },
  loseEff: (G) => {
    // 交换宠物（简化：跳过复杂逻辑）
  },
};

/** GTH1 熔岩兽王·T (Boss) */
const GTH1: MonsterEffectHandler = {
  debut: (G) => {
    // 所有玩家放回1件装备
    for (const [pid] of getAlivePlayers(G)) {
      const equips = getAllEquipIds(G, pid);
      if (equips.length > 0) {
        discardEquip(G, pid, equips[0]!);
      }
    }
  },
  winEff: (G) => {
    const ctx = { currentPlayer: G.currentPlayerId };
    drawCards({ G, ctx }, 1);
  },
  loseEff: (G) => {
    if (G.combat && G.combat.supporterPlayerId) {
      dealDamage(G, G.combat.supporterPlayerId, 3);
    }
  },
};

/** GTH2 邪剑仙·H2 (Boss) */
const GTH2: MonsterEffectHandler = {
  debut: (G) => {
    // 支援者/妨碍者展示战牌并使用（简化：跳过）
  },
  winEff: (G) => {
    // 所有角色手牌重置为3张
    for (const [pid] of getAlivePlayers(G)) {
      const player = G.players[pid];
      if (!player) continue;
      if (player.hand.length > 3) {
        discardToCount(G, pid, 3);
      } else if (player.hand.length < 3) {
        drawToCount(G, pid, 3);
      }
    }
  },
  loseEff: (G) => {
    // 所有角色手牌重置为3张
    for (const [pid] of getAlivePlayers(G)) {
      const player = G.players[pid];
      if (!player) continue;
      if (player.hand.length > 3) {
        discardToCount(G, pid, 3);
      } else if (player.hand.length < 3) {
        drawToCount(G, pid, 3);
      }
    }
  },
};

// ==================== 效果注册表 ====================

/** 怪物CODE → 效果处理器映射 */
export const monsterEffectHandlers: Record<string, MonsterEffectHandler> = {
  // 水
  GS01, GS02, GS03, GS04,
  // 火
  GH01, GH02, GH03, GH04,
  // 雷
  GL01, GL02, GL03, GL04,
  // 风
  GF01, GF02, GF03, GF04,
  // 土
  GT01, GT02, GT03,
  // 阴
  GIT1, GIT3, GIT4, GIT5, GIT8,
  // 阳
  GYT1, GYT3, GYT4, GYT5, GYT6, GYT7, GYT8,
  // 扩展包 4#
  GST1, GST2, GHT1, GHT2, GFT1, GFT2, GTT1, GTT2,
  // 扩展包 HL
  GSH1, GSH2, GSH3, GHH1, GHH2, GLH1, GFH1, GTH1, GTH2,
};

// ==================== 调度函数 ====================

/**
 * 获取怪物效果处理器
 * @param monsterCode 怪物编码（如 GS01、GHT1）
 */
export function getMonsterHandler(monsterCode: string): MonsterEffectHandler | undefined {
  return monsterEffectHandlers[monsterCode];
}

/**
 * 执行怪物出场效果
 */
export function executeMonsterDebut(G: GameState, monsterInstanceId: string, random?: RandomSource): void {
  const monsterInst = G.monsterInstances[monsterInstanceId];
  if (!monsterInst) return;

  const monsterData = monsters.find(m => m.ID === monsterInst.staticId);
  if (!monsterData) return;

  const handler = monsterEffectHandlers[monsterData.CODE];
  if (handler?.debut) {
    handler.debut(G, random);
  }
}

/**
 * 执行怪物胜利效果
 */
export function executeMonsterWinEff(G: GameState, monsterInstanceId: string): void {
  const monsterInst = G.monsterInstances[monsterInstanceId];
  if (!monsterInst) return;

  const monsterData = monsters.find(m => m.ID === monsterInst.staticId);
  if (!monsterData) return;

  const handler = monsterEffectHandlers[monsterData.CODE];
  if (handler?.winEff) {
    handler.winEff(G);
  }
}

/**
 * 执行怪物失败效果
 */
export function executeMonsterLoseEff(G: GameState, monsterInstanceId: string): void {
  const monsterInst = G.monsterInstances[monsterInstanceId];
  if (!monsterInst) return;

  const monsterData = monsters.find(m => m.ID === monsterInst.staticId);
  if (!monsterData) return;

  const handler = monsterEffectHandlers[monsterData.CODE];
  if (handler?.loseEff) {
    handler.loseEff(G);
  }
}

/**
 * 执行宠物获得效果（IncrAction）
 */
export function executePetIncr(G: GameState, monsterInstanceId: string, ownerId: string): void {
  const monsterInst = G.monsterInstances[monsterInstanceId];
  if (!monsterInst) return;

  const monsterData = monsters.find(m => m.ID === monsterInst.staticId);
  if (!monsterData) return;

  const handler = monsterEffectHandlers[monsterData.CODE];
  if (handler?.petIncr) {
    handler.petIncr(G, ownerId);
  }
}

/**
 * 执行宠物失去效果（DecrAction）
 */
export function executePetDecr(G: GameState, monsterInstanceId: string, ownerId: string): void {
  const monsterInst = G.monsterInstances[monsterInstanceId];
  if (!monsterInst) return;

  const monsterData = monsters.find(m => m.ID === monsterInst.staticId);
  if (!monsterData) return;

  const handler = monsterEffectHandlers[monsterData.CODE];
  if (handler?.petDecr) {
    handler.petDecr(G, ownerId);
  }
}
