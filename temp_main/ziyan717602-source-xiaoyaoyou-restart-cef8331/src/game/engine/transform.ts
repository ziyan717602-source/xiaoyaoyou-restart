/**
 * 仙剑逍遥游 - 变身系统
 * Phase 4：角色技能引擎
 *
 * 实现游戏中的变身逻辑：
 * - 赵灵儿 ↔ 赵灵儿·梦蛇（条件触发）
 * - 龙葵 ↔ 龙葵鬼（主动选择）
 * - 孔璘 → 魔尊（死亡时）
 * - 魔翳 → 湮世穹兵（队友全灭时）
 *
 * 核心规则：
 * - C# 源码是唯一真相
 * - 变身时必须完整继承 HP、装备、手牌
 * - changeType 决定继承程度：0=完全重置，1=部分重置，2=死亡后变身
 */

import { GameState } from '../../shared/types/game';
import { HeroInstance } from '../../shared/types/hero';

// ==================== 变身类型 ====================

/** 变身类型枚举 */
export enum TransformType {
  /** 完全重置（死亡/强制变身）- 清除所有数据 */
  FULL_RESET = 0,
  /** 部分重置（自选变身）- 保留 HP、装备、手牌 */
  PARTIAL_RESET = 1,
  /** 死亡后变身（NPC 加入）- 可指定 HP */
  DEATH_TRANSFORM = 2,
}

// ==================== 变身定义 ====================

/** 变身关系定义 */
export interface TransformRelation {
  /** 源角色编码（变身前） */
  sourceHeroCode: string;
  /** 目标角色编码（变身后） */
  targetHeroCode: string;
  /** 源角色静态 ID */
  sourceStaticId: number;
  /** 目标角色静态 ID */
  targetStaticId: number;
  /** 变身类型 */
  transformType: TransformType;
  /** 是否可逆（双向变身） */
  reversible: boolean;
  /** 变身时移除的技能 ID 列表 */
  removeSkillIds: string[];
  /** 变身时添加的技能 ID 列表 */
  addSkillIds: string[];
}

// ==================== 预定义变身关系 ====================

/** 所有变身关系 */
export const transformRelations: TransformRelation[] = [
  // 赵灵儿 ↔ 梦蛇
  {
    sourceHeroCode: 'XJ102',
    targetHeroCode: 'XJ103',
    sourceStaticId: 10102,
    targetStaticId: 10103,
    transformType: TransformType.PARTIAL_RESET,
    reversible: true,
    removeSkillIds: ['xj102_skill2'], // 移除梦蛇技能
    addSkillIds: ['xj103_skill1', 'xj103_skill2'], // 添加梦蛇技能
  },
  {
    sourceHeroCode: 'XJ103',
    targetHeroCode: 'XJ102',
    sourceStaticId: 10103,
    targetStaticId: 10102,
    transformType: TransformType.PARTIAL_RESET,
    reversible: true,
    removeSkillIds: ['xj103_skill1', 'xj103_skill2'], // 移除梦蛇技能
    addSkillIds: ['xj102_skill2'], // 添加赵灵儿技能
  },
  // 龙葵蓝 ↔ 龙葵红
  {
    sourceHeroCode: 'XJ303',
    targetHeroCode: 'XJ304',
    sourceStaticId: 10303,
    targetStaticId: 10304,
    transformType: TransformType.PARTIAL_RESET,
    reversible: true,
    removeSkillIds: ['xj303_skill1', 'xj303_skill2', 'xj303_skill3'], // 移除蓝葵技能
    addSkillIds: ['xj304_skill1', 'xj304_skill2', 'xj304_skill3'], // 添加红葵技能
  },
  {
    sourceHeroCode: 'XJ304',
    targetHeroCode: 'XJ303',
    sourceStaticId: 10304,
    targetStaticId: 10303,
    transformType: TransformType.PARTIAL_RESET,
    reversible: true,
    removeSkillIds: ['xj304_skill1', 'xj304_skill2', 'xj304_skill3'], // 移除红葵技能
    addSkillIds: ['xj303_skill1', 'xj303_skill2', 'xj303_skill3'], // 添加蓝葵技能
  },
  // 孔璘 → 魔尊（死亡时）
  {
    sourceHeroCode: 'XJ206',
    targetHeroCode: 'XJ207',
    sourceStaticId: 10206,
    targetStaticId: 10207,
    transformType: TransformType.FULL_RESET,
    reversible: false,
    removeSkillIds: [], // FULL_RESET 会自动移除所有技能
    addSkillIds: [], // FULL_RESET 会自动加载新技能
  },
  // 魔翳 → 湮世穹兵（队友全灭时）
  {
    sourceHeroCode: 'HL004',
    targetHeroCode: 'HL005',
    sourceStaticId: 19004,
    targetStaticId: 19005,
    transformType: TransformType.PARTIAL_RESET,
    reversible: false,
    removeSkillIds: ['hl004_skill1', 'hl004_skill2'],
    addSkillIds: ['hl005_skill1', 'hl005_skill2'],
  },
];

// ==================== 变身核心函数 ====================

/**
 * 查找变身关系
 * @param sourceStaticId - 源角色静态 ID
 * @returns 变身关系列表
 */
export function findTransformRelations(
  sourceStaticId: number
): TransformRelation[] {
  return transformRelations.filter(
    relation => relation.sourceStaticId === sourceStaticId
  );
}

/**
 * 查找可逆变身关系
 * @param sourceStaticId - 源角色静态 ID
 * @param targetStaticId - 目标角色静态 ID
 * @returns 变身关系
 */
export function findReversibleRelation(
  sourceStaticId: number,
  targetStaticId: number
): TransformRelation | undefined {
  return transformRelations.find(
    relation =>
      relation.sourceStaticId === sourceStaticId &&
      relation.targetStaticId === targetStaticId &&
      relation.reversible
  );
}

/**
 * 执行变身
 * @param G - 游戏状态
 * @param playerId - 玩家 ID
 * @param targetStaticId - 目标角色静态 ID
 * @param指定 HP（仅 DEATH_TRANSFORM 类型有效）
 */
export function executeTransform(
  G: GameState,
  playerId: string,
  targetStaticId: number,
  specifiedHp?: number
): void {
  const player = G.players[playerId];
  if (!player) {
    console.error(`[Transform] Player not found: ${playerId}`);
    return;
  }

  const currentHero = G.heroInstances[player.heroInstanceId];
  if (!currentHero) {
    console.error(`[Transform] Hero not found: ${player.heroInstanceId}`);
    return;
  }

  // 查找变身关系
  const relation = transformRelations.find(
    r =>
      r.sourceStaticId === currentHero.staticId &&
      r.targetStaticId === targetStaticId
  );

  if (!relation) {
    console.error(
      `[Transform] No transform relation found: ${currentHero.staticId} -> ${targetStaticId}`
    );
    return;
  }

  console.log(
    `[Transform] ${playerId} transforming from ${currentHero.staticId} to ${targetStaticId}`
  );

  // 根据变身类型执行
  switch (relation.transformType) {
    case TransformType.FULL_RESET:
      executeFullResetTransform(G, playerId, targetStaticId, specifiedHp);
      break;
    case TransformType.PARTIAL_RESET:
      executePartialResetTransform(G, playerId, targetStaticId);
      break;
    case TransformType.DEATH_TRANSFORM:
      executeDeathTransform(G, playerId, targetStaticId, specifiedHp);
      break;
  }
}

/**
 * 完全重置变身（changeType=0）
 * 清除所有数据，重新初始化
 */
function executeFullResetTransform(
  G: GameState,
  playerId: string,
  targetStaticId: number,
  specifiedHp?: number
): void {
  const player = G.players[playerId];
  if (!player) return;

  const currentHero = G.heroInstances[player.heroInstanceId];
  if (!currentHero) return;

  // 保存需要继承的数据
  const savedTeam = player.team;
  const savedSeatNumber = player.seatNumber;

  // 完全重置：清除所有数据
  // 1. 移除装备效果
  // 2. 移除宠物效果
  // 3. 移除所有技能
  // 4. 清除所有 Token
  // 5. 重置 STRb/DEXb

  // 创建新角色实例
  const newInstanceId = `hero_${playerId}_${Date.now()}`;
  const newHero: HeroInstance = {
    instanceId: newInstanceId,
    staticId: targetStaticId,
    currentHp: specifiedHp ?? 1, // 默认 1 HP，实际应从静态定义加载
    maxHp: specifiedHp ?? 1,
    currentStr: 0,
    currentDex: 0,
    immobilized: false,
    isAlive: true,
    equipment: { weapon: null, armor: null, special: null },
    pet: null,
    buffs: [],
    hand: [], // 完全重置不保留手牌
  };

  // 注册新角色实例
  G.heroInstances[newInstanceId] = newHero;

  // 更新玩家引用
  player.heroInstanceId = newInstanceId;
  player.team = savedTeam;
  player.seatNumber = savedSeatNumber;

  // 移除旧角色实例
  delete G.heroInstances[currentHero.instanceId];

  // 重新加载技能（实际实现时需要根据目标角色的技能列表）
  // 这里简化处理，实际应该从技能注册表中加载

  console.log(`[Transform] Full reset transform completed: ${newInstanceId}`);
}

/**
 * 部分重置变身（changeType=1）
 * 保留 HP、装备、手牌
 */
function executePartialResetTransform(
  G: GameState,
  playerId: string,
  targetStaticId: number
): void {
  const player = G.players[playerId];
  if (!player) return;

  const currentHero = G.heroInstances[player.heroInstanceId];
  if (!currentHero) return;

  // 保存需要继承的数据
  const savedHp = currentHero.currentHp;
  const savedMaxHp = currentHero.maxHp;
  const savedEquipment = { ...currentHero.equipment };
  const savedHand = [...currentHero.hand];
  const savedPet = currentHero.pet;
  const savedBuffs = [...currentHero.buffs];
  const savedTeam = player.team;
  const savedSeatNumber = player.seatNumber;

  // 部分重置：仅移除装备和宠物效果
  // 1. 移除装备效果（但保留装备卡牌）
  // 2. 移除宠物效果（但保留宠物）
  // 不移除技能和 Token

  // 创建新角色实例
  const newInstanceId = `hero_${playerId}_${Date.now()}`;
  const newHero: HeroInstance = {
    instanceId: newInstanceId,
    staticId: targetStaticId,
    currentHp: savedHp,
    maxHp: savedMaxHp,
    currentStr: 0, // 重置为 0，实际应从静态定义加载
    currentDex: 0, // 重置为 0，实际应从静态定义加载
    immobilized: false,
    isAlive: true,
    equipment: savedEquipment,
    pet: savedPet,
    buffs: savedBuffs,
    hand: savedHand,
  };

  // 注册新角色实例
  G.heroInstances[newInstanceId] = newHero;

  // 更新玩家引用
  player.heroInstanceId = newInstanceId;
  player.team = savedTeam;
  player.seatNumber = savedSeatNumber;

  // 移除旧角色实例
  delete G.heroInstances[currentHero.instanceId];

  // 重新激活装备效果
  // 重新激活宠物效果

  console.log(`[Transform] Partial reset transform completed: ${newInstanceId}`);
}

/**
 * 死亡后变身（changeType=2）
 * 可指定 HP，保留部分数据
 */
function executeDeathTransform(
  G: GameState,
  playerId: string,
  targetStaticId: number,
  specifiedHp?: number
): void {
  const player = G.players[playerId];
  if (!player) return;

  const currentHero = G.heroInstances[player.heroInstanceId];
  if (!currentHero) return;

  // 保存需要继承的数据
  const savedTeam = player.team;
  const savedSeatNumber = player.seatNumber;

  // 死亡后变身：清除所有数据，但可指定 HP
  // 1. 移除装备效果
  // 2. 移除宠物效果
  // 3. 移除所有技能
  // 4. 清除所有 Token
  // 5. 重置 STRb/DEXb

  // 创建新角色实例
  const newInstanceId = `hero_${playerId}_${Date.now()}`;
  const newHero: HeroInstance = {
    instanceId: newInstanceId,
    staticId: targetStaticId,
    currentHp: specifiedHp ?? 1, // 使用指定 HP 或默认 1
    maxHp: specifiedHp ?? 1,
    currentStr: 0,
    currentDex: 0,
    immobilized: false,
    isAlive: true,
    equipment: { weapon: null, armor: null, special: null },
    pet: null,
    buffs: [],
    hand: [],
  };

  // 注册新角色实例
  G.heroInstances[newInstanceId] = newHero;

  // 更新玩家引用
  player.heroInstanceId = newInstanceId;
  player.team = savedTeam;
  player.seatNumber = savedSeatNumber;

  // 移除旧角色实例
  delete G.heroInstances[currentHero.instanceId];

  // 重新加载技能（实际实现时需要根据目标角色的技能列表）
  // 这里简化处理，实际应该从技能注册表中加载

  console.log(`[Transform] Death transform completed: ${newInstanceId}`);
}

// ==================== 变身触发条件检查 ====================

/**
 * 检查赵灵儿是否应该变身为梦蛇
 * 条件：敌方宠物总数 >= 3
 */
export function shouldZhaoLingerTransformToMengshe(G: GameState, casterPlayerId: string): boolean {
  const casterPlayer = G.players[casterPlayerId];
  if (!casterPlayer) return false;

  let enemyPetCount = 0;

  for (const [pid, player] of Object.entries(G.players)) {
    if (pid === casterPlayerId) continue; // 跳过自己
    if (player.isAlive && player.team !== casterPlayer.team) {
      const hero = G.heroInstances[player.heroInstanceId];
      if (hero && hero.pet) {
        enemyPetCount++;
      }
    }
  }

  return enemyPetCount >= 3;
}

/**
 * 检查梦蛇是否应该变回赵灵儿
 * 条件：敌方宠物总数 < 3
 */
export function shouldMengsheTransformToZhaoLinger(G: GameState, casterPlayerId: string): boolean {
  return !shouldZhaoLingerTransformToMengshe(G, casterPlayerId);
}

/**
 * 检查龙葵是否可以变身
 * 条件：主动选择
 */
export function canLongKuiTransform(G: GameState, playerId: string): boolean {
  const player = G.players[playerId];
  if (!player) return false;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return false;

  // 龙葵蓝 (10303) 和龙葵红 (10304) 都可以变身
  return hero.staticId === 10303 || hero.staticId === 10304;
}

/**
 * 检查孔璘是否应该变身为魔尊
 * 条件：死亡时
 */
export function shouldKongLinTransformToMozun(
  G: GameState,
  playerId: string
): boolean {
  const player = G.players[playerId];
  if (!player) return false;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return false;

  // 孔璘 (10206) 死亡时变身
  return hero.staticId === 10206 && !hero.isAlive;
}

/**
 * 检查魔翳是否应该变身为湮世穹兵
 * 条件：队友全灭时
 */
export function shouldMoYiTransformToYanShi(
  G: GameState,
  playerId: string
): boolean {
  const player = G.players[playerId];
  if (!player) return false;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return false;

  // 魔翳 (19004) 且队友全灭时变身
  if (hero.staticId !== 19004) return false;

  // 检查队友是否全灭
  const teammates = Object.values(G.players).filter(
    p => p.isAlive && p.team === player.team && p.id !== playerId
  );

  return teammates.length === 0;
}

// ==================== 导出 ====================

export default {
  transformRelations,
  findTransformRelations,
  findReversibleRelation,
  executeTransform,
  shouldZhaoLingerTransformToMengshe,
  shouldMengsheTransformToZhaoLinger,
  canLongKuiTransform,
  shouldKongLinTransformToMozun,
  shouldMoYiTransformToYanShi,
};
