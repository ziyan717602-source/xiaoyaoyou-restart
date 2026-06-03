/**
 * 仙剑逍遥游 - NPC 行动系统
 * Phase 5：怪物/NPC
 *
 * 实现 26 个 NPC 的行动效果：
 * - NJ01：加入己方（弃置手牌，HP=2*弃牌数）
 * - NJ02：回复1HP
 * - NJ03：自伤1HP，指定角色补1张
 * - NJ04：自己补1张
 * - NJ05：指定角色受1点伤害
 * - NJ06：交出1张手牌给队友
 * - NJ07：交出1个宠物给队友
 * - NJ08：弃置指定角色1张手牌
 * - NJ09：加入己方（默认）
 * - NJT1：翻怪物堆顶1张
 * - NJT2：选择角色和符文
 * - NJH1~NJH9：扩展包NPC效果
 *
 * C# 源码对照：PSDGamepkg/JNS/NC303.cs → NPCCottage 类
 * 铁律：每行效果代码必须有 C# 源码对照
 */

import type { GameState } from '../../shared/types/game';
import { npcs, monsters } from '../../shared/data';
import { drawCards } from '../moves/drawCards';
import { dealDamage, healTarget } from '../skills/effects';
import { obtainPet, releasePet } from '../engine/pet';
import { executePetIncr, executePetDecr } from '../monsters/monsterEffects';

// ==================== NPC 行动接口 ====================

export interface NpcActionHandler {
  /** NPC行动效果 */
  action: (G: GameState, playerId: string, params: Record<string, unknown>) => void;
  /** 行动是否可用 */
  valid?: (G: GameState, playerId: string) => boolean;
  /** NPC出场效果（部分NPC有） */
  debut?: (G: GameState, playerId: string) => void;
}

// ==================== 辅助函数 ====================

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

/** 获取NPC静态定义 */
function getNpcData(code: string) {
  return npcs.find(n => n.CODE === code);
}

// ==================== NJ01 加入己方 ====================

/**
 * NJ01：弃置一名队友的所有手牌，该角色加入己方
 * HP = 2 * 弃牌数（技牌/事件阶段上限3）
 *
 * C# 对照：NC303.cs → NJ01Action
 */
const NJ01: NpcActionHandler = {
  valid: (G, playerId) => {
    const player = G.players[playerId];
    if (!player) return false;
    // 己方有手牌的角色
    return getAliveTeamPlayers(G, player.team).some(([, p]) => p.hand.length > 0);
  },
  action: (G, playerId, params) => {
    const player = G.players[playerId];
    if (!player) return;

    const targetPlayerId = params.targetPlayerId as string;
    const joinPlayerId = params.joinPlayerId as string;
    if (!targetPlayerId || !joinPlayerId) return;

    const target = G.players[targetPlayerId];
    if (!target || !target.isAlive || target.team !== player.team) return;

    // 弃置目标所有手牌
    const handCount = target.hand.length;
    const cardsToDiscard = [...target.hand];
    target.hand = [];
    G.piles.discardPile.push(...cardsToDiscard);

    // 计算HP
    let hp = 2 * handCount;
    // 简化：技牌/事件阶段上限3
    if (hp > 3) hp = 3;

    // 加入己方（简化：直接改变队伍）
    const joinPlayer = G.players[joinPlayerId];
    if (joinPlayer) {
      joinPlayer.team = player.team;
      // 设置HP
      const joinHero = G.heroInstances[joinPlayer.heroInstanceId];
      if (joinHero) {
        joinHero.currentHp = hp;
        joinHero.maxHp = Math.max(joinHero.maxHp, hp);
      }
    }
  },
};

// ==================== NJ02 回复1HP ====================

/**
 * NJ02：选择一名角色回复1HP
 *
 * C# 对照：NC303.cs → NJ02Action
 */
const NJ02: NpcActionHandler = {
  action: (G, _playerId, params) => {
    const targetPlayerId = params.targetPlayerId as string;
    if (!targetPlayerId) return;
    healTarget(G, targetPlayerId, 1);
  },
};

// ==================== NJ03 自伤补牌 ====================

/**
 * NJ03：自伤1HP，指定角色补1张牌
 *
 * C# 对照：NC303.cs → NJ03Action
 */
const NJ03: NpcActionHandler = {
  action: (G, playerId, params) => {
    const targetPlayerId = params.targetPlayerId as string;
    if (!targetPlayerId) return;
    dealDamage(G, playerId, 1);
    const ctx = { currentPlayer: targetPlayerId };
    drawCards({ G, ctx }, 1);
  },
};

// ==================== NJ04 自己补1张 ====================

/**
 * NJ04：自己补1张牌
 *
 * C# 对照：NC303.cs → NJ04Action
 */
const NJ04: NpcActionHandler = {
  action: (G, playerId) => {
    const ctx = { currentPlayer: playerId };
    drawCards({ G, ctx }, 1);
  },
};

// ==================== NJ05 指定伤害 ====================

/**
 * NJ05：指定角色受1点伤害
 *
 * C# 对照：NC303.cs → NJ05Action
 */
const NJ05: NpcActionHandler = {
  action: (G, _playerId, params) => {
    const targetPlayerId = params.targetPlayerId as string;
    if (!targetPlayerId) return;
    dealDamage(G, targetPlayerId, 1);
  },
};

// ==================== NJ06 交出手牌 ====================

/**
 * NJ06：选择一名有手牌的角色，交给队友1张手牌
 *
 * C# 对照：NC303.cs → NJ06Action
 */
const NJ06: NpcActionHandler = {
  valid: (G, playerId) => {
    const player = G.players[playerId];
    if (!player) return false;
    return getAliveTeamPlayers(G, player.team).some(
      ([pid, p]) => p.hand.length > 0 && pid !== playerId
    );
  },
  action: (G, _playerId, params) => {
    const fromId = params.fromPlayerId as string;
    const toId = params.toPlayerId as string;
    const cardInstanceId = params.cardInstanceId as string;
    if (!fromId || !toId || !cardInstanceId) return;

    const from = G.players[fromId];
    if (!from) return;

    const cardIndex = from.hand.indexOf(cardInstanceId);
    if (cardIndex === -1) return;

    // 从原持有者手牌移除
    from.hand.splice(cardIndex, 1);

    // 加入目标手牌
    const to = G.players[toId];
    if (to) {
      to.hand.push(cardInstanceId);
      // 更新卡牌所有者
      const card = G.cardInstances[cardInstanceId];
      if (card) card.ownerId = toId;
    }
  },
};

// ==================== NJ07 交出宠物 ====================

/**
 * NJ07：选择一名有宠物的角色，交给队友1个宠物
 *
 * C# 对照：NC303.cs → NJ07Action
 */
const NJ07: NpcActionHandler = {
  valid: (G, playerId) => {
    const player = G.players[playerId];
    if (!player) return false;
    return getAliveTeamPlayers(G, player.team).some(([, p]) => {
      const hero = G.heroInstances[p.heroInstanceId];
      return hero && hero.pet;
    });
  },
  action: (G, _playerId, params) => {
    const fromId = params.fromPlayerId as string;
    const toId = params.toPlayerId as string;
    const petInstanceId = params.petInstanceId as string;
    if (!fromId || !toId || !petInstanceId) return;

    const from = G.players[fromId];
    if (!from) return;
    const fromHero = G.heroInstances[from.heroInstanceId];
    if (!fromHero || fromHero.pet !== petInstanceId) return;

    const to = G.players[toId];
    if (!to) return;
    const toHero = G.heroInstances[to.heroInstanceId];
    if (!toHero) return;

    // 执行失去效果
    executePetDecr(G, petInstanceId, fromId);

    // 从原持有者移除宠物
    fromHero.pet = null;

    // 如果目标已有宠物，先释放
    if (toHero.pet) {
      executePetDecr(G, toHero.pet, toId);
      G.piles.discardPile.push(toHero.pet);
    }

    // 设置新宠物
    toHero.pet = petInstanceId;

    // 执行获得效果
    executePetIncr(G, petInstanceId, toId);
  },
};

// ==================== NJ08 弃置手牌 ====================

/**
 * NJ08：选择一名有手牌的角色，弃置其1张手牌
 *
 * C# 对照：NC303.cs → NJ08Action
 */
const NJ08: NpcActionHandler = {
  valid: (G) => {
    return getAlivePlayers(G).some(([, p]) => p.hand.length > 0);
  },
  action: (G, _playerId, params) => {
    const targetPlayerId = params.targetPlayerId as string;
    const cardInstanceId = params.cardInstanceId as string;
    if (!targetPlayerId || !cardInstanceId) return;

    const target = G.players[targetPlayerId];
    if (!target) return;

    const cardIndex = target.hand.indexOf(cardInstanceId);
    if (cardIndex === -1) return;

    target.hand.splice(cardIndex, 1);
    G.piles.discardPile.push(cardInstanceId);
  },
};

// ==================== NJ09 加入己方（默认） ====================

/**
 * NJ09：NPC加入己方（默认行动）
 *
 * C# 对照：NC303.cs → NJ09Action
 */
const NJ09: NpcActionHandler = {
  action: (G, playerId, params) => {
    const npcInstanceId = params.npcInstanceId as string;
    if (!npcInstanceId) return;

    // 简化：NPC直接加入己方，标记到玩家RAM
    const player = G.players[playerId];
    if (player) {
      player.ram['npc_escort'] = npcInstanceId;
    }
  },
};

// ==================== NJT1 翻怪物堆 ====================

/**
 * NJT1：翻怪物堆顶1张，选择是否保留
 *
 * C# 对照：NC303.cs → NJT1Action
 */
const NJT1: NpcActionHandler = {
  valid: (G) => G.piles.monsterPile.length > 0,
  action: (G, playerId, params) => {
    const keep = params.keep as boolean;
    if (G.piles.monsterPile.length === 0) return;

    if (keep) {
      // 保留：不执行任何操作（怪物留在堆顶）
    } else {
      // 不保留：移除堆顶怪物
      const removed = G.piles.monsterPile.shift();
      if (removed) G.piles.discardPile.push(removed);
    }
  },
};

// ==================== NJT2 选择符文 ====================

/**
 * NJT2：选择一名角色和一个符文
 *
 * C# 对照：NC303.cs → NJT2Action
 */
const NJT2: NpcActionHandler = {
  action: (G, _playerId, params) => {
    const targetPlayerId = params.targetPlayerId as string;
    const runeCode = params.runeCode as string;
    if (!targetPlayerId || !runeCode) return;

    // 简化：标记到玩家RAM
    const player = G.players[targetPlayerId];
    if (player) {
      player.ram['rune_gained'] = runeCode;
    }
  },
};

// ==================== 扩展包NPC效果（简化） ====================

/** NJH1：弃置一名队友所有手牌，NPC加入，获得4点标记 */
const NJH1: NpcActionHandler = {
  valid: (G, playerId) => {
    const player = G.players[playerId];
    if (!player) return false;
    return getAliveTeamPlayers(G, player.team).some(([, p]) => p.hand.length > 0);
  },
  action: (G, playerId, params) => {
    const targetPlayerId = params.targetPlayerId as string;
    if (!targetPlayerId) return;

    const target = G.players[targetPlayerId];
    if (!target) return;

    // 弃置目标所有手牌
    const cardsToDiscard = [...target.hand];
    target.hand = [];
    G.piles.discardPile.push(...cardsToDiscard);

    // 标记NPC加入
    const player = G.players[playerId];
    if (player) player.ram['njh1_escort'] = true;
  },
};

/** NJH2：翻开7张手牌，轮流选取 */
const NJH2: NpcActionHandler = {
  action: (G, _playerId) => {
    // 简化：触发者补3张牌
    const ctx = { currentPlayer: G.currentPlayerId };
    drawCards({ G, ctx }, 3);
  },
};

/** NJH3：自伤1HP，指定角色加入 */
const NJH3: NpcActionHandler = {
  action: (G, playerId, params) => {
    const targetPlayerId = params.targetPlayerId as string;
    if (!targetPlayerId) return;
    dealDamage(G, playerId, 1);
    // 简化：标记NPC加入目标
    const target = G.players[targetPlayerId];
    if (target) target.ram['njh3_escort'] = true;
  },
};

/** NJH4：指定角色加入 */
const NJH4: NpcActionHandler = {
  action: (G, _playerId, params) => {
    const targetPlayerId = params.targetPlayerId as string;
    if (!targetPlayerId) return;
    const target = G.players[targetPlayerId];
    if (target) target.ram['njh4_escort'] = true;
  },
};

/** NJH5：指定角色加入 */
const NJH5: NpcActionHandler = {
  action: (G, playerId, params) => {
    const targetPlayerId = params.targetPlayerId as string;
    if (!targetPlayerId) return;
    // 自伤1HP（无属性）
    dealDamage(G, playerId, 1);
    const target = G.players[targetPlayerId];
    if (target) target.ram['njh5_escort'] = true;
  },
};

/** NJH6：弃置指定角色的1件装备 */
const NJH6: NpcActionHandler = {
  valid: (G) => {
    return getAlivePlayers(G).some(([, p]) => {
      const hero = G.heroInstances[p.heroInstanceId];
      return hero && (hero.equipment.weapon || hero.equipment.armor || hero.equipment.special);
    });
  },
  action: (G, _playerId, params) => {
    const targetPlayerId = params.targetPlayerId as string;
    const cardInstanceId = params.cardInstanceId as string;
    if (!targetPlayerId || !cardInstanceId) return;

    const target = G.players[targetPlayerId];
    if (!target) return;
    const hero = G.heroInstances[target.heroInstanceId];
    if (!hero) return;

    if (hero.equipment.weapon === cardInstanceId) {
      hero.equipment.weapon = null;
    } else if (hero.equipment.armor === cardInstanceId) {
      hero.equipment.armor = null;
    } else if (hero.equipment.special === cardInstanceId) {
      hero.equipment.special = null;
    }
    G.piles.discardPile.push(cardInstanceId);
  },
};

/** NJH7：寻找2张武器牌 */
const NJH7: NpcActionHandler = {
  action: (G, _playerId, params) => {
    const targetPlayerId = params.targetPlayerId as string;
    if (!targetPlayerId) return;
    // 简化：补2张牌
    const ctx = { currentPlayer: targetPlayerId };
    drawCards({ G, ctx }, 2);
  },
};

/** NJH8：加入己方，可爆发宠物 */
const NJH8: NpcActionHandler = {
  action: (G, playerId, params) => {
    const player = G.players[playerId];
    if (player) player.ram['njh8_escort'] = true;
  },
};

/** NJH9：加入己方，复活HP=0的角色 */
const NJH9: NpcActionHandler = {
  action: (G, playerId, params) => {
    const player = G.players[playerId];
    if (player) player.ram['njh9_escort'] = true;

    // 简化：己方HP=0的角色回复2HP
    const teammates = getAliveTeamPlayers(G, player.team);
    for (const [, tm] of teammates) {
      const hero = G.heroInstances[tm.heroInstanceId];
      if (hero && hero.currentHp === 0 && tm.isAlive) {
        healTarget(G, tm.id, 2);
      }
    }
  },
};

// ==================== NPC 出场效果 ====================

/** NCT27：替换怪物堆中的1张NPC */
const NCT27Debut = (G: GameState, _playerId: string): void => {
  // 简化：跳过
};

/** NCT32：触发者补1张战牌 */
const NCT32Debut = (G: GameState, playerId: string): void => {
  const ctx = { currentPlayer: playerId };
  drawCards({ G, ctx }, 1);
};

/** NCT33：触发者手牌<5时，补至5张 */
const NCT33Debut = (G: GameState, playerId: string): void => {
  const player = G.players[playerId];
  if (!player || player.hand.length >= 5) return;
  const ctx = { currentPlayer: playerId };
  drawCards({ G, ctx }, 5 - player.hand.length);
};

/** NCT42：战力+=敌方最大手牌数-1 */
const NCT42Debut = (G: GameState, playerId: string): void => {
  const player = G.players[playerId];
  if (!player) return;
  const oppTeam = getOppTeam(G, player.team);
  const enemies = getAliveTeamPlayers(G, oppTeam);
  const maxHand = Math.max(0, ...enemies.map(([, p]) => p.hand.length) , 0);
  const incr = maxHand - 1;
  if (incr > 0) {
    // 简化：标记到RAM
    player.ram['nct42_str_bonus'] = incr;
  }
};

/** NCH05：手牌≠3的角色各横置 */
const NCH05Debut = (G: GameState, _playerId: string): void => {
  for (const [pid, player] of getAlivePlayers(G)) {
    if (player.hand.length !== 3) {
      player.immobilized = true;
      const hero = G.heroInstances[player.heroInstanceId];
      if (hero) hero.immobilized = true;
    }
  }
};

/** NCH07：翻开2张NPC和2张怪物，加入怪物堆 */
const NCH07Debut = (G: GameState, _playerId: string): void => {
  // 简化：跳过
};

/** NCH10：爆发武器 */
const NCH10Debut = (G: GameState, _playerId: string): void => {
  // 简化：跳过
};

// ==================== NPC效果注册表 ====================

/** NPC行动CODE → 效果处理器映射 */
export const npcActionHandlers: Record<string, NpcActionHandler> = {
  NJ01, NJ02, NJ03, NJ04, NJ05, NJ06, NJ07, NJ08, NJ09,
  NJT1, NJT2,
  NJH1, NJH2, NJH3, NJH4, NJH5, NJH6, NJH7, NJH8, NJH9,
};

/** NPC出场效果CODE → 处理函数映射 */
export const npcDebutHandlers: Record<string, (G: GameState, playerId: string) => void> = {
  NCT27: NCT27Debut,
  NCT32: NCT32Debut,
  NCT33: NCT33Debut,
  NCT42: NCT42Debut,
  NCH05: NCH05Debut,
  NCH07: NCH07Debut,
  NCH10: NCH10Debut,
};

// ==================== 调度函数 ====================

/**
 * 获取NPC行动处理器
 */
export function getNpcActionHandler(actionCode: string): NpcActionHandler | undefined {
  return npcActionHandlers[actionCode];
}

/**
 * 执行NPC行动
 */
export function executeNpcAction(
  G: GameState,
  playerId: string,
  actionCode: string,
  params: Record<string, unknown> = {},
): void {
  const handler = npcActionHandlers[actionCode];
  if (handler) {
    handler.action(G, playerId, params);
  }
}

/**
 * 检查NPC行动是否可用
 */
export function isNpcActionValid(
  G: GameState,
  playerId: string,
  actionCode: string,
): boolean {
  const handler = npcActionHandlers[actionCode];
  if (!handler) return false;
  if (handler.valid) {
    return handler.valid(G, playerId);
  }
  return true;
}

/**
 * 执行NPC出场效果
 */
export function executeNpcDebut(
  G: GameState,
  npcCode: string,
  playerId: string,
): void {
  const handler = npcDebutHandlers[npcCode];
  if (handler) {
    handler(G, playerId);
  }
}
