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
  /** 怪物效果伤害 */
  MONSTER = 'MONSTER',
}

// ==================== 怪物属性 ====================

/** 怪物属性（CODE前缀映射） */
export enum MonsterElement {
  /** 水（GS） */
  WATER = 'GS',
  /** 火（GH） */
  FIRE = 'GH',
  /** 雷（GL） */
  THUNDER = 'GL',
  /** 风（GF） */
  WIND = 'GF',
  /** 土（GT） */
  EARTH = 'GT',
  /** 阴（GI） */
  YIN = 'GI',
  /** 阳（GY） */
  YANG = 'GY',
}

/** 怪物等级 */
export enum MonsterLevel {
  /** 木人（等级0） */
  WOODEN = 0,
  /** 弱（等级1） */
  WEAK = 1,
  /** 强（等级2） */
  STRONG = 2,
  /** BOSS（等级3） */
  BOSS = 3,
}

// ==================== 技能触发时机 ====================

/**
 * 技能触发时机 — 映射自 skills.json OCCURS 编码系统
 *
 * OCCURS 格式: [lock][scope][phase/event]
 * - lock: ! = 强制, ? = 条件可选, 空 = 可选
 * - scope: # = 自己, * = 任意玩家, $ = 其他玩家 (回合阶段); 0 = 玩家级, 1 = 全局, 2 = 系统级 (游戏事件)
 * - phase/event: 2字符代码
 *
 * 参考: reference/psd48-master/PSDGamepkg/XIR.cs (回合流程)
 * 参考: reference/psd48-master/PSDGamepkg/XI.cs (事件注册)
 */
export enum SkillTrigger {
  // ==================== 回合阶段触发 (R[scope][phase]) ====================

  /** R#ST: 自己回合开始 */
  ROUND_START_SELF = 'ROUND_START_SELF',
  /** R*ST: 任意玩家回合开始 */
  ROUND_START_ANY = 'ROUND_START_ANY',
  /** R$ST: 其他玩家回合开始 */
  ROUND_START_OTHER = 'ROUND_START_OTHER',

  /** R#GR: 自己技牌阶段（使用技牌/装备/激活技能） */
  SKILL_PHASE_SELF = 'SKILL_PHASE_SELF',
  /** R*GR: 任意玩家技牌阶段 */
  SKILL_PHASE_ANY = 'SKILL_PHASE_ANY',

  /** R#GE: 自己技牌阶段结束 */
  SKILL_END_SELF = 'SKILL_END_SELF',
  /** R$GE: 其他玩家技牌阶段结束 */
  SKILL_END_OTHER = 'SKILL_END_OTHER',

  /** R#TM: 自己回合结束 */
  TURN_END_SELF = 'TURN_END_SELF',
  /** R*TM: 任意玩家回合结束 */
  TURN_END_ANY = 'TURN_END_ANY',
  /** R$TM: 其他玩家回合结束 */
  TURN_END_OTHER = 'TURN_END_OTHER',

  /** R#IC: 自己回合结束确认 */
  TURN_END_CONFIRM_SELF = 'TURN_END_CONFIRM_SELF',

  /** R#BC: 自己补牌阶段 */
  DRAW_PHASE_SELF = 'DRAW_PHASE_SELF',
  /** R#OC: 自己回合准备（重置RAM/检查横置） */
  ROUND_PREP_SELF = 'ROUND_PREP_SELF',

  /** R#EP: 自己事件准备阶段 */
  EVENT_PREP_SELF = 'EVENT_PREP_SELF',
  /** R#EV: 自己事件阶段 */
  EVENT_PHASE_SELF = 'EVENT_PHASE_SELF',
  /** R#EE: 自己事件结束 */
  EVENT_END_SELF = 'EVENT_END_SELF',

  /** R#ED: 自己回合最终结束（推进到下一玩家） */
  ROUND_END_SELF = 'ROUND_END_SELF',

  // ==================== 战斗阶段触发 ====================

  /** R#Z1: 自己战斗开始（沉默检查/战力池初始化/命中判定） */
  COMBAT_START_SELF = 'COMBAT_START_SELF',
  /** R*Z1: 任意玩家战斗开始 */
  COMBAT_START_ANY = 'COMBAT_START_ANY',
  /** R$Z1: 其他玩家战斗开始 */
  COMBAT_START_OTHER = 'COMBAT_START_OTHER',

  /** R#ZC: 自己战牌确认（启用玩家战力池/刷新命中） */
  BATTLE_CARD_CONFIRM_SELF = 'BATTLE_CARD_CONFIRM_SELF',
  /** R*ZC: 任意玩家战牌确认 */
  BATTLE_CARD_CONFIRM_ANY = 'BATTLE_CARD_CONFIRM_ANY',
  /** R$ZC: 其他玩家战牌确认 */
  BATTLE_CARD_CONFIRM_OTHER = 'BATTLE_CARD_CONFIRM_OTHER',

  /** R*ZD: 任意玩家战牌阶段（轮流出战牌） */
  BATTLE_CARD_ANY = 'BATTLE_CARD_ANY',

  /** R*ZN: 任意玩家战斗结果（记录胜负/关闭战力池） */
  BATTLE_RESULT_ANY = 'BATTLE_RESULT_ANY',

  /** R#VS: 自己战斗失败处理 */
  COMBAT_FAIL_SELF = 'COMBAT_FAIL_SELF',
  /** R*VS: 任意玩家战斗失败处理 */
  COMBAT_FAIL_ANY = 'COMBAT_FAIL_ANY',

  /** R#ZW: 自己战斗结束 */
  COMBAT_END_SELF = 'COMBAT_END_SELF',
  /** R*ZW: 任意玩家战斗结束 */
  COMBAT_END_ANY = 'COMBAT_END_ANY',

  /** R#ZF: 自己战斗结束（清理战斗状态） */
  COMBAT_CLEANUP_SELF = 'COMBAT_CLEANUP_SELF',

  /** R*Z2: 任意玩家战斗结束准备（重置AX状态） */
  COMBAT_END_PREP_ANY = 'COMBAT_END_PREP_ANY',

  /** R#ZU: 自己支援确认 */
  SUPPORT_CONFIRM_SELF = 'SUPPORT_CONFIRM_SELF',
  /** R*ZU: 任意玩家支援确认 */
  SUPPORT_CONFIRM_ANY = 'SUPPORT_CONFIRM_ANY',

  /** R#ZM: 自己翻怪物牌 */
  MONSTER_REVEAL_SELF = 'MONSTER_REVEAL_SELF',

  /** R#ZW: 自己选择支援/妨碍 */
  SUPPORT_SELECT_SELF = 'SUPPORT_SELECT_SELF',

  /** R#QR: 自己弃牌阶段 */
  DISCARD_PHASE_SELF = 'DISCARD_PHASE_SELF',

  // ==================== 玩家级事件触发 (G0[event]) ====================

  /** G0IS: 角色进场（登场） */
  HERO_ENTER = 'HERO_ENTER',
  /** G0OS: 角色离场 */
  HERO_LEAVE = 'HERO_LEAVE',
  /** G0HD: 获得宠物 */
  PET_GAINED = 'PET_GAINED',
  /** G0HL: 失去宠物 */
  PET_LOST = 'PET_LOST',
  /** G0OH: 受到HP伤害 */
  ON_HP_DAMAGE = 'ON_HP_DAMAGE',
  /** G0ZW: 角色死亡/撤退 */
  ON_DEATH = 'ON_DEATH',
  /** G0ZH: HP归零检测（倾慕触发） */
  ON_HP_ZERO = 'ON_HP_ZERO',
  /** G0DH: 手牌变化（获得/弃置） */
  ON_HAND_CHANGE = 'ON_HAND_CHANGE',
  /** G0IH: HP回复 */
  ON_HP_RECOVER = 'ON_HP_RECOVER',
  /** G0HT: 补牌 */
  ON_DRAW_CARDS = 'ON_DRAW_CARDS',
  /** G0QR: 弃牌检查 */
  ON_DISCARD_CHECK = 'ON_DISCARD_CHECK',
  /** G0DS: 横置设置/解除 */
  ON_IMMOBILIZE = 'ON_IMMOBILIZE',
  /** G0CC: 技牌使用后 */
  ON_TECH_USED = 'ON_TECH_USED',
  /** G0CD: 卡牌使用响应窗口 */
  ON_CARD_PLAYED = 'ON_CARD_PLAYED',
  /** G0WB: 宠物战力效果 */
  ON_PET_POWER = 'ON_PET_POWER',
  /** G09P: 命中判定 */
  ON_HIT_CHECK = 'ON_HIT_CHECK',
  /** G0TT: 骰子判定 */
  ON_DICE_ROLL = 'ON_DICE_ROLL',
  /** G0IT: 道具进场 */
  ON_ITEM_ENTER = 'ON_ITEM_ENTER',
  /** G0OT: 道具离场 */
  ON_ITEM_LEAVE = 'ON_ITEM_LEAVE',
  /** G0IC: 装备进场确认 */
  ON_EQUIP_ENTER = 'ON_EQUIP_ENTER',
  /** G0OC: 装备离场确认 */
  ON_EQUIP_LEAVE = 'ON_EQUIP_LEAVE',
  /** G0IX: 武器进场 */
  ON_WEAPON_ENTER = 'ON_WEAPON_ENTER',
  /** G0OX: 武器离场 */
  ON_WEAPON_LEAVE = 'ON_WEAPON_LEAVE',
  /** G0IW: 防具进场 */
  ON_ARMOR_ENTER = 'ON_ARMOR_ENTER',
  /** G0OW: 防具离场 */
  ON_ARMOR_LEAVE = 'ON_ARMOR_LEAVE',
  /** G0IY: 角色变身登场 */
  ON_TRANSFORM = 'ON_TRANSFORM',
  /** G0OY: 角色最终离场 */
  ON_FINAL_LEAVE = 'ON_FINAL_LEAVE',
  /** G0AX: 重置AX状态 */
  ON_RESET_AX = 'ON_RESET_AX',
  /** G0ZB: 饰品装备 */
  ON_ACCESSORY_EQUIP = 'ON_ACCESSORY_EQUIP',
  /** G0FI: 场上信息变化 */
  ON_FIELD_CHANGE = 'ON_FIELD_CHANGE',
  /** G0OJ: 对象加入（傀儡/友方） */
  ON_OBJECT_JOIN = 'ON_OBJECT_JOIN',
  /** G0HC: HP变化（通用） */
  ON_HP_CHANGE = 'ON_HP_CHANGE',
  /** G0HZ: HP归零链 */
  ON_HP_ZERO_CHAIN = 'ON_HP_ZERO_CHAIN',
  /** G0WN: 胜利判定 */
  ON_VICTORY = 'ON_VICTORY',

  // ==================== 全局事件触发 (G1[event]) ====================

  /** G1CH: 支援命中 */
  GLOBAL_SUPPORT_HIT = 'GLOBAL_SUPPORT_HIT',
  /** G1TH: 任意玩家HP减少后 */
  GLOBAL_HP_DECREASE = 'GLOBAL_HP_DECREASE',
  /** G1SG: 翻怪前 */
  GLOBAL_PRE_REVEAL = 'GLOBAL_PRE_REVEAL',
  /** G1EV: 事件阶段（全局） */
  GLOBAL_EVENT_PHASE = 'GLOBAL_EVENT_PHASE',
  /** G1GE: 战斗胜负效果 */
  GLOBAL_COMBAT_RESULT = 'GLOBAL_COMBAT_RESULT',
  /** G1DI: 全局补牌 */
  GLOBAL_DRAW = 'GLOBAL_DRAW',
  /** G1IZ: 武器装备（全局） */
  GLOBAL_WEAPON_EQUIP = 'GLOBAL_WEAPON_EQUIP',
  /** G1OZ: 武器移除（全局） */
  GLOBAL_WEAPON_REMOVE = 'GLOBAL_WEAPON_REMOVE',
  /** G1ZK: 关闭战力池 */
  GLOBAL_CLOSE_POOL = 'GLOBAL_CLOSE_POOL',
  /** G1WJ: 怪物牌堆耗尽 */
  GLOBAL_MONSTER_EXHAUST = 'GLOBAL_MONSTER_EXHAUST',
  /** G1LY: 忠诚效果 */
  GLOBAL_LOYALTY = 'GLOBAL_LOYALTY',
  /** G1YP: NPC效果 */
  GLOBAL_NPC_EFFECT = 'GLOBAL_NPC_EFFECT',
  /** G1UE: 事件使用 */
  GLOBAL_EVENT_USE = 'GLOBAL_EVENT_USE',

  // ==================== 寄生触发 (&card&type) ====================

  /** &TP01&0: 冰心诀使用 */
  CARD_BINGXINJUE = 'CARD_BINGXINJUE',
  /** &TP02&0/&TP02&1: 灵葫仙丹使用 */
  CARD_LINGHU = 'CARD_LINGHU',
  /** &TP03&0: 隐蛊使用 */
  CARD_YINGU = 'CARD_YINGU',
  /** &TP04&0: 洞冥宝镜使用 */
  CARD_DONGMING = 'CARD_DONGMING',

  // ==================== 别名触发 (%N) ====================

  /** %1: 技牌使用事件 */
  ALIAS_TECH_USE = 'ALIAS_TECH_USE',
  /** %2: 特殊牌使用事件 */
  ALIAS_SPECIAL_USE = 'ALIAS_SPECIAL_USE',
  /** %4: 任意非装备牌使用事件 */
  ALIAS_ANY_CARD_USE = 'ALIAS_ANY_CARD_USE',
  /** %5: 技牌使用后事件 */
  ALIAS_TECH_POST = 'ALIAS_TECH_POST',
  /** %7: 隐蛊使用事件 */
  ALIAS_YINGU = 'ALIAS_YINGU',
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
