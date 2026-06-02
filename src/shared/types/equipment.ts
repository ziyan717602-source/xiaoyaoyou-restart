/**
 * 仙剑逍遥游 - 装备类型定义
 * Phase 1：数据层
 *
 * 定义装备的静态定义类型。
 * 装备分为武器和防具，各有特殊效果。
 * 装备替换规则：已有同类装备时，新装备替换旧装备。
 */

import { Element } from './enums';
import { StaticCardDef } from './card';

// ==================== 装备基础 ====================

/** 装备类型 */
export enum EquipmentType {
  /** 武器 */
  WEAPON = 'WEAPON',
  /** 防具 */
  ARMOR = 'ARMOR',
}

// ==================== 武器定义 ====================

/** 武器静态定义 */
export interface WeaponDef {
  /** 卡牌基础信息 */
  card: StaticCardDef;
  /** 武器战力加成 */
  strBonus: number;
  /** 武器命中加成 */
  dexBonus: number;
  /** 武器五行属性（如有） */
  element: Element | null;
  /** 特殊效果描述 */
  specialEffect: string;
  /** 使用条件（如 "R#GR" 表示技牌阶段可使用） */
  useCondition: string;
}

// ==================== 防具定义 ====================

/** 防具静态定义 */
export interface ArmorDef {
  /** 卡牌基础信息 */
  card: StaticCardDef;
  /** 防具战力加成 */
  strBonus: number;
  /** 防具命中加成 */
  dexBonus: number;
  /** 防具五行属性（如有） */
  element: Element | null;
  /** 特殊效果描述 */
  specialEffect: string;
  /** 爆发效果描述（被击破时触发） */
  burstEffect: string;
  /** 使用条件 */
  useCondition: string;
  /** 爆发条件（触发爆发效果的条件） */
  burstCondition: string;
}

// ==================== 装备槽位 ====================

/** 装备槽位类型 */
export enum EquipmentSlotType {
  /** 武器槽 */
  WEAPON = 'WEAPON',
  /** 防具槽 */
  ARMOR = 'ARMOR',
  /** 特殊装备槽 */
  SPECIAL = 'SPECIAL',
}

/** 装备槽位状态 */
export interface EquipmentSlotState {
  /** 武器卡牌实例 ID */
  weapon: string | null;
  /** 防具卡牌实例 ID */
  armor: string | null;
  /** 特殊装备卡牌实例 ID */
  special: string | null;
}

// ==================== 装备规则 ====================

/** 装备规则 */
export interface EquipmentRule {
  /** 同类装备是否可叠加 */
  stackable: boolean;
  /** 最大装备数量 */
  maxCount: number;
  /** 替换规则描述 */
  replaceRule: string;
}
