/**
 * 仙剑逍遥游 - 技能类型定义
 * Phase 1：数据层
 *
 * 定义技能的静态定义和运行时上下文类型。
 * 技能分为被动技能（TYPE=L）和触发技能（TYPE=LI/LC）。
 * 强制技能[!]在条件满足时自动触发，可选技能由玩家确认。
 */

import { SkillTrigger, CombatStage } from './enums';

// ==================== 静态技能定义 ====================

/** 技能类型 */
export enum SkillType {
  /** 被动技能（持续生效） */
  PASSIVE = 'L',
  /** 触发技能（条件满足时触发） */
  TRIGGER = 'LI',
  /** 变身技能（触发后变身） */
  TRANSFORM = 'LC',
}

/** 技能静态定义（不变数据，从 skills.json 加载） */
export interface StaticSkillDef {
  /** 技能 ID（数据库主键） */
  id: number;
  /** 技能编码（如 JN10101） */
  code: string;
  /** 技能类型（L/LI/LC） */
  type: string;
  /** 技能名称 */
  name: string;
  /** 触发条件编码（OCCURS 字段，如 "!R$Z1"） */
  occurs: string;
  /** 优先级（PRIORS 字段） */
  priors: string;
  /** 是否一次性（ONCE 字段，1=是） */
  once: string;
  /** 终止条件（TERMINI 字段） */
  termini: string;
  /** 寄生条件（PARASITISM 字段） */
  parasitism: string;
  /** 技能描述 */
  describe: string;
  /** 妨碍条件（HIND 字段） */
  hind: string | null;
}

// ==================== 技能触发条件 ====================

/** 技能触发条件编码解析 */
export interface SkillTriggerCondition {
  /** 是否强制触发（! 开头） */
  isForced: boolean;
  /** 触发阶段代码 */
  phaseCode: string;
  /** 目标条件 */
  targetCondition: string;
  /** 附加条件 */
  additionalCondition: string;
}

// ==================== 运行时技能实例 ====================

/** 技能运行时实例（G 中的数据） */
export interface SkillInstance {
  /** 唯一实例 ID */
  instanceId: string;
  /** 引用静态定义 ID */
  staticId: number;
  /** 所属角色实例 ID */
  heroInstanceId: string;
  /** 是否已使用（一次性技能） */
  used: boolean;
  /** 当前状态（激活/禁用） */
  active: boolean;
}

// ==================== 技能上下文 ====================

/** 技能执行上下文 */
export interface SkillContext {
  /** 触发者角色实例 ID */
  casterId: string;
  /** 目标角色实例 ID 列表 */
  targetIds: string[];
  /** 当前战斗阶段 */
  combatStage: CombatStage | null;
  /** 触发时机 */
  trigger: SkillTrigger;
  /** 额外参数 */
  params: Record<string, unknown>;
}

// ==================== 技能效果 ====================

/** 技能效果类型 */
export enum SkillEffectType {
  /** 改变 HP */
  HP_CHANGE = 'HP_CHANGE',
  /** 改变战力 */
  STR_CHANGE = 'STR_CHANGE',
  /** 改变命中 */
  DEX_CHANGE = 'DEX_CHANGE',
  /** 抽牌 */
  DRAW_CARD = 'DRAW_CARD',
  /** 弃牌 */
  DISCARD_CARD = 'DISCARD_CARD',
  /** 装备效果 */
  EQUIP_EFFECT = 'EQUIP_EFFECT',
  /** 变身 */
  TRANSFORM = 'TRANSFORM',
  /** 横置 */
  IMMOBILIZE = 'IMMOBILIZE',
  /** 特殊效果 */
  SPECIAL = 'SPECIAL',
}

/** 技能效果定义 */
export interface SkillEffect {
  /** 效果类型 */
  type: SkillEffectType;
  /** 效果数值（如 HP 变化量） */
  value: number;
  /** 目标选择方式 */
  targetMode: string;
  /** 效果参数 */
  params: Record<string, unknown>;
}
