/**
 * 仙剑逍遥游 - 怪物类型定义
 * Phase 1：数据层
 *
 * 定义怪物的静态定义和运行时实例类型。
 * 怪物有 4 个效果槽位：出场、宠物、胜利、失败。
 * SPI 位掩码系统用于编码五行属性和效果类型。
 */

import { CardBuff } from './card';

// ==================== 静态怪物定义 ====================

/** 怪物静态定义（不变数据，从 monsters.json 加载） */
export interface StaticMonsterDef {
  /** 怪物 ID（数据库主键） */
  id: number;
  /** 怪物编码（如 GS01） */
  code: string;
  /** 怪物名称 */
  name: string;
  /** 是否有效 */
  valid: boolean;
  /** 所属系列 */
  genre: number;
  /** 战力（STR） */
  str: number;
  /** 闪避/敏捷（AGL） */
  agl: number;
  /** 强度等级（1=弱，2=中，3=强） */
  level: number;
  /** 出场效果条件（OCCURS 字段，如 "^;^"） */
  occurs: string;
  /** 优先级（PRIORS 字段） */
  priors: string;
  /** 终止条件（TERMINI 字段） */
  termini: string;
  /** 出场效果描述 */
  debutText: string;
  /** 宠物效果描述（被收服为宠物时的效果） */
  petText: string;
  /** 胜利效果描述（战斗胜利时对敌方的效果） */
  winText: string;
  /** 失败效果描述（战斗失败时对己方的效果） */
  loseText: string;
  /** SPI 位掩码（编码五行属性和效果类型） */
  spi: string;
}

// ==================== SPI 位掩码解析 ====================

/** SPI 位掩码解析结果 */
export interface SpiMask {
  /** 五行属性（如有） */
  element: string | null;
  /** 效果类型编码 */
  effectType: string;
  /** 是否有特殊效果 */
  hasSpecialEffect: boolean;
}

// ==================== 运行时怪物实例 ====================

/** 怪物运行时实例（G 中的数据） */
export interface MonsterInstance {
  /** 唯一实例 ID（运行时生成） */
  instanceId: string;
  /** 引用静态定义 ID */
  staticId: number;
  /** 当前战力（可能受 Buff 影响） */
  currentStr: number;
  /** 当前闪避 */
  currentAgl: number;
  /** 当前 Buffs */
  buffs: CardBuff[];
}

// ==================== 怪物效果槽位 ====================

/** 怪物效果槽位类型 */
export enum MonsterEffectSlot {
  /** 出场效果（翻到怪物时立即触发） */
  DEBUT = 'DEBUT',
  /** 宠物效果（被收服为宠物时） */
  PET = 'PET',
  /** 胜利效果（战斗胜利时） */
  WIN = 'WIN',
  /** 失败效果（战斗失败时） */
  LOSE = 'LOSE',
}

/** 怪物效果定义 */
export interface MonsterEffect {
  /** 效果槽位 */
  slot: MonsterEffectSlot;
  /** 效果描述文本 */
  description: string;
  /** 效果条件编码（OCCURS 字段解析） */
  condition: string;
  /** 优先级 */
  priority: number;
}
