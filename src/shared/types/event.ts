/**
 * 仙剑逍遥游 - 事件牌类型定义
 * Phase 5.5：事件牌效果
 *
 * 定义事件牌相关的类型，包括事件效果上下文、执行结果等。
 * 事件牌在翻怪前（SG阶段）触发，影响所有玩家或特定玩家。
 */

import type { GameState } from './game';

// ==================== 事件效果上下文 ====================

/** 事件效果执行上下文 */
export interface EventContext {
  /** 游戏状态（可修改） */
  G: GameState;
  /** 当前回合玩家 ID */
  currentPlayerId: string;
  /** 当前事件实例 ID */
  eventInstanceId: string;
}

/** 事件效果执行结果 */
export interface EventResult {
  /** 是否成功执行 */
  success: boolean;
  /** 执行日志（用于UI展示） */
  logs: string[];
  /** 需要玩家交互的操作（如选择目标、弃牌等） */
  pendingActions?: PendingEventAction[];
}

/** 待处理的事件操作 */
export interface PendingEventAction {
  /** 操作 ID */
  actionId: string;
  /** 玩家 ID */
  playerId: string;
  /** 操作类型 */
  type: EventActionType;
  /** 可选项列表 */
  options: string[];
  /** 已选项列表 */
  selected: string[];
  /** 是否多选 */
  multiSelect: boolean;
  /** 最少选择数量 */
  minCount: number;
  /** 最多选择数量 */
  maxCount: number;
}

/** 事件操作类型 */
export enum EventActionType {
  /** 选择目标玩家 */
  SELECT_PLAYER = 'SELECT_PLAYER',
  /** 选择卡牌 */
  SELECT_CARD = 'SELECT_CARD',
  /** 弃牌 */
  DISCARD = 'DISCARD',
  /** 选择角色 */
  SELECT_HERO = 'SELECT_HERO',
}

// ==================== 事件效果函数类型 ====================

/**
 * 事件效果执行函数类型
 *
 * @param ctx 事件上下文
 * @returns 事件执行结果
 */
export type EventEffectFunction = (ctx: EventContext) => EventResult;

/** 事件效果映射（事件CODE → 效果函数） */
export type EventEffectMap = Record<string, EventEffectFunction>;
