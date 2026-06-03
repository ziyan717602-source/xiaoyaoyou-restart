/**
 * 事件牌出牌 Move
 *
 * 处理事件牌的使用逻辑：
 * 1. 从事件牌堆翻取事件牌
 * 2. 执行事件效果
 * 3. 将事件牌放入弃牌堆
 *
 * 通过 event.ts 的 drawEvent move 调用
 */

import type { GameState } from '../../shared/types/game';
import { dispatchEvent } from '../events/index';

/**
 * 执行事件牌效果
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param eventInstanceId 事件牌实例ID（可选，不传则从牌堆翻取）
 * @returns 事件执行结果
 */
export function executeEventCard(
  G: GameState,
  ctx: { currentPlayerId: string },
  eventInstanceId?: string,
): { success: boolean; logs: string[] } {
  const { currentPlayerId } = ctx;

  // 如果没有指定事件实例ID，从牌堆翻取
  if (!eventInstanceId) {
    if (G.piles.eventPile.length === 0) {
      return { success: false, logs: ['事件牌堆为空'] };
    }

    eventInstanceId = G.piles.eventPile.shift()!;
    G.event.currentEventInstanceId = eventInstanceId;
  }

  // 验证事件实例存在
  if (!G.eventInstances[eventInstanceId]) {
    return { success: false, logs: ['事件实例不存在'] };
  }

  // 执行事件效果
  const result = dispatchEvent(G, currentPlayerId, eventInstanceId);

  // 将事件牌放入弃牌堆
  if (result.success) {
    G.piles.discardPile.push(eventInstanceId);
    G.event.processed = true;
  }

  return result;
}
