/**
 * 仙剑逍遥游 - 卡牌类型定义
 * Phase 1：数据层
 *
 * 定义所有卡牌的静态定义和运行时实例类型。
 * 静态定义（Static*）不变，从 JSON 数据加载；运行时实例（*Instance）在游戏过程中创建。
 *
 * 铁律：G 中卡牌只存 instanceId（字符串），禁止存完整对象。
 */

import { CardType } from './enums';

// ==================== 静态卡牌定义 ====================

/** 卡牌基础字段（所有静态卡牌定义共享） */
export interface StaticCardBase {
  /** 卡牌 ID（数据库主键） */
  id: number;
  /** 卡牌编码（如 JP01、GS01） */
  code: string;
  /** 卡牌名称 */
  name: string;
  /** 是否有效（1=有效，0=无效） */
  valid: boolean;
  /** 所属系列/分类 */
  genre: number;
}

/** 手牌静态定义（技牌/战牌/特殊牌/装备） */
export interface StaticCardDef extends StaticCardBase {
  /** 卡牌类型 */
  type: CardType;
  /** 数量配置（逗号分隔，不同版本的数量） */
  count: string;
  /** 使用条件/OCCURS 字段（编码格式） */
  occurs: string;
  /** 优先级/PRIORS 字段 */
  priors: string;
  /** 寄生条件/PARASITISM 字段 */
  parasitism: string;
  /** 终止条件/TERMHIND 字段 */
  termhind: string;
  /** 卡牌描述 */
  description: string;
  /** 特殊效果/SPECIAL 字段（如典当效果） */
  special: string;
  /** 目标/TARGET 字段（编码格式） */
  target: string;
  /** 成长/GROWUP 字段 */
  growup: string;
}

/** 怪物静态定义 */
export interface StaticMonsterDef extends StaticCardBase {
  /** 战力 */
  str: number;
  /** 闪避/敏捷 */
  agl: number;
  /** 强度等级（1-3） */
  level: number;
  /** 出场效果条件 */
  occurs: string;
  /** 优先级 */
  priors: string;
  /** 终止条件 */
  termini: string;
  /** 出场效果描述 */
  debutText: string;
  /** 宠物效果描述 */
  petText: string;
  /** 胜利效果描述 */
  winText: string;
  /** 失败效果描述 */
  loseText: string;
  /** SPI 位掩码（五行/效果类型编码） */
  spi: string;
}

/** 事件静态定义 */
export interface StaticEventDef extends StaticCardBase {
  /** 事件范围（如 "1,2" 表示在特定阶段触发） */
  range: string;
  /** 背景描述 */
  background: string;
  /** 事件效果描述 */
  effect: string;
  /** SPI 位掩码 */
  spi: string;
}

/** NPC 静态定义 */
export interface StaticNpcDef extends StaticCardBase {
  /** 战力 */
  str: number;
  /** 行动编码（NJ01,NJ09 等） */
  action: string;
  /** 关联角色 ID（ORG 字段） */
  org: number;
  /** 出场效果描述 */
  debutText: string;
  /** 性别 */
  gender: string;
}

// ==================== 运行时卡牌实例 ====================

/** 卡牌 Buff 效果 */
export interface CardBuff {
  /** Buff ID */
  id: string;
  /** Buff 名称 */
  name: string;
  /** 持续回合数（-1=永久） */
  duration: number;
  /** Buff 效果参数 */
  params: Record<string, unknown>;
}

/** 手牌运行时实例 */
export interface CardInstance {
  /** 唯一实例 ID（运行时生成） */
  instanceId: string;
  /** 引用静态定义 ID */
  staticId: number;
  /** 当前拥有者玩家 ID */
  ownerId: string;
  /** 卡牌当前 Buffs */
  buffs: CardBuff[];
}

/** 怪物运行时实例 */
export interface MonsterInstance {
  /** 唯一实例 ID */
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

/** 事件运行时实例 */
export interface EventInstance {
  /** 唯一实例 ID */
  instanceId: string;
  /** 引用静态定义 ID */
  staticId: number;
}

/** NPC 运行时实例 */
export interface NpcInstance {
  /** 唯一实例 ID */
  instanceId: string;
  /** 引用静态定义 ID */
  staticId: number;
  /** 当前战力 */
  currentStr: number;
  /** 当前 Buffs */
  buffs: CardBuff[];
}

// ==================== 类型别名 ====================

/** 手牌类型（技牌/战牌/特殊牌/装备） */
export type TuxCard = CardInstance;

/** 怪物牌类型 */
export type MonsterCard = MonsterInstance;

/** 事件牌类型 */
export type EventCard = EventInstance;

/** NPC 牌类型 */
export type NpcCard = NpcInstance;
