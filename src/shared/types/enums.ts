/**
 * 仙剑逍遥游 - 枚举类型定义
 * Phase 1：数据层
 *
 * 定义游戏中的所有枚举类型，包括阶段、卡牌类型、五行属性等。
 * 所有枚举值均可序列化为 JSON。
 */

// ==================== 游戏阶段 ====================

/** 回合阶段类型 */
export enum PhaseType {
  /** 回合开始阶段 */
  TURN_START = 'TURN_START',
  /** 事件阶段 */
  EVENT = 'EVENT',
  /** 技牌阶段 */
  SKILL = 'SKILL',
  /** 战斗阶段 */
  COMBAT = 'COMBAT',
  /** 补牌阶段 */
  DRAW = 'DRAW',
  /** 弃牌阶段 */
  DISCARD = 'DISCARD',
  /** 回合结束阶段 */
  TURN_END = 'TURN_END',
}

// ==================== 卡牌类型 ====================

/** 手牌类型 */
export enum CardType {
  /** 技牌（绿色牌面，使用后执行效果） */
  TECH = 'TECH',
  /** 战牌（战斗中使用） */
  COMBAT = 'COMBAT',
  /** 特殊牌（冰心诀、隐蛊等） */
  SPECIAL = 'SPECIAL',
  /** 武器牌 */
  WEAPON = 'WEAPON',
  /** 防具牌 */
  ARMOR = 'ARMOR',
}

// ==================== 五行属性 ====================

/** 五行属性 */
export enum Element {
  /** 风 */
  WIND = 'WIND',
  /** 雷 */
  THUNDER = 'THUNDER',
  /** 水 */
  WATER = 'WATER',
  /** 火 */
  FIRE = 'FIRE',
  /** 土 */
  EARTH = 'EARTH',
}

// ==================== 伤害类型 ====================

/** 伤害类型 */
export enum DamageType {
  /** 普通伤害（无属性） */
  NORMAL = 'NORMAL',
  /** 技能伤害 */
  SKILL = 'SKILL',
  /** 战斗伤害 */
  COMBAT = 'COMBAT',
  /** 倾慕伤害（角色死亡时触发） */
  ADMIRATION = 'ADMIRATION',
}

// ==================== 技能触发时机 ====================

/** 技能触发时机 */
export enum SkillTrigger {
  /** 回合开始时 */
  TURN_START = 'TURN_START',
  /** 事件阶段 */
  EVENT_PHASE = 'EVENT_PHASE',
  /** 技牌阶段 */
  SKILL_PHASE = 'SKILL_PHASE',
  /** 战斗开始时 */
  COMBAT_START = 'COMBAT_START',
  /** 战斗牌阶段 */
  COMBAT_CARD_PHASE = 'COMBAT_CARD_PHASE',
  /** 战斗结束时 */
  COMBAT_END = 'COMBAT_END',
  /** HP 变化时 */
  ON_HP_CHANGE = 'ON_HP_CHANGE',
  /** 角色死亡时 */
  ON_DEATH = 'ON_DEATH',
  /** 装备时 */
  ON_EQUIP = 'ON_EQUIP',
  /** 使用技牌时 */
  ON_USE_TECH = 'ON_USE_TECH',
}

// ==================== 战斗阶段 ====================

/** 战斗阶段子阶段 */
export enum CombatStage {
  /** 选择支援者 */
  SUPPORT = 'SUPPORT',
  /** 选择妨碍者 */
  HINDER = 'HINDER',
  /** 翻怪物牌 */
  REVEAL = 'REVEAL',
  /** 命中判定 */
  HIT_CHECK = 'HIT_CHECK',
  /** 出战牌阶段（轮流出牌） */
  PLAY_CARD = 'PLAY_CARD',
  /** 结算阶段 */
  SETTLE = 'SETTLE',
  /** 战斗结束 */
  END = 'END',
}

// ==================== 玩家队伍 ====================

/** 玩家队伍 */
export enum Team {
  /** A 队 */
  A = 'A',
  /** B 队 */
  B = 'B',
}

// ==================== 性别 ====================

/** 角色性别 */
export enum Gender {
  /** 男 */
  M = 'M',
  /** 女 */
  F = 'F',
}

// ==================== 卡牌所属 ====================

/** 卡牌所属（用于区分卡牌来源） */
export enum CardOwner {
  /** 手牌堆 */
  HAND_PILE = 'HAND_PILE',
  /** 事件牌堆 */
  EVENT_PILE = 'EVENT_PILE',
  /** 怪物牌堆 */
  MONSTER_PILE = 'MONSTER_PILE',
  /** 弃牌堆 */
  DISCARD_PILE = 'DISCARD_PILE',
  /** 玩家手牌 */
  PLAYER_HAND = 'PLAYER_HAND',
  /** 玩家装备区 */
  PLAYER_EQUIPMENT = 'PLAYER_EQUIPMENT',
  /** 玩家宠物区 */
  PLAYER_PET = 'PLAYER_PET',
}
