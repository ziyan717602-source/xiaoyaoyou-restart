/**
 * 仙剑逍遥游 - 角色类型定义
 * Phase 1：数据层
 *
 * 定义角色的静态定义和运行时实例类型。
 * 静态定义从 JSON 数据加载，运行时实例在游戏过程中创建。
 *
 * 变身关系：部分角色可通过条件触发变身（如赵灵儿→赵灵儿·梦蛇）。
 * 变身时保留 HP、装备、手牌，但替换角色属性和技能。
 */

import { Gender } from './enums';
import { CardBuff } from './card';

// ==================== 静态角色定义 ====================

/** 角色静态定义（不变数据，从 heroes.json 加载） */
export interface StaticHeroDef {
  /** 角色 ID（数据库主键，如 10101） */
  id: number;
  /** 角色编码（如 XJ101） */
  code: string;
  /** 角色名称 */
  name: string;
  /** 是否有效 */
  valid: boolean;
  /** HP 上限 */
  hp: number;
  /** 战力（STR） */
  str: number;
  /** 命中（DEX） */
  dex: number;
  /** 性别 */
  gender: Gender;
  /** 倾慕角色 ID 列表（逗号分隔，如 "10102,10104,10105"） */
  spouse: string;
  /** 变身目标角色 ID（ISO 字段，如 "10103" 表示可变身为此角色） */
  iso: string;
  /** 技能编码列表（逗号分隔，如 "JN10101,JN10102"） */
  skill: string;
  /** 别名（如 "E,双剑" 表示特殊装备能力） */
  alias: string | null;
  /** 传记/BIO 字段 */
  bio: string;
  /** 所属系列（1=仙剑一，2=仙剑二，...） */
  genre: number;
}

// ==================== 运行时角色实例 ====================

/** 装备槽位 */
export interface EquipmentSlot {
  /** 武器卡牌实例 ID */
  weapon: string | null;
  /** 防具卡牌实例 ID */
  armor: string | null;
  /** 特殊装备卡牌实例 ID */
  special: string | null;
}

/** 角色运行时实例（G 中的数据） */
export interface HeroInstance {
  /** 唯一实例 ID（运行时生成） */
  instanceId: string;
  /** 引用静态定义 ID */
  staticId: number;
  /** 当前 HP */
  currentHp: number;
  /** HP 上限（可被技能修改） */
  maxHp: number;
  /** 当前战力（基础 + 装备 + Buff） */
  currentStr: number;
  /** 当前命中（基础 + 装备 + Buff） */
  currentDex: number;
  /** 是否横置（下回合跳过除弃牌外的所有阶段） */
  immobilized: boolean;
  /** 是否存活 */
  isAlive: boolean;
  /** 装备槽位 */
  equipment: EquipmentSlot;
  /** 宠物卡牌实例 ID（只能有一个同属性宠物） */
  pet: string | null;
  /** 当前 Buffs */
  buffs: CardBuff[];
  /** 拥有的手牌实例 ID 列表 */
  hand: string[];
}

// ==================== 变身关联 ====================

/** 变身关系定义 */
export interface TransformRelation {
  /** 源角色 ID（变身前） */
  sourceHeroId: number;
  /** 目标角色 ID（变身后） */
  targetHeroId: number;
  /** 变身条件（技能编码，触发变身的技能） */
  skillCode: string;
  /** 是否可逆（某些变身是双向的） */
  reversible: boolean;
}

// ==================== 角色选择 ====================

/** 角色选择状态 */
export interface HeroSelection {
  /** 玩家 ID */
  playerId: string;
  /** 可选角色 ID 列表（随机发3张） */
  candidates: number[];
  /** 已选角色 ID（null 表示未选择） */
  selectedId: number | null;
  /** 是否已确认 */
  confirmed: boolean;
}
