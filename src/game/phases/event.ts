/**
 * 事件阶段
 *
 * 流程：
 * 1. 玩家选择是否翻取事件牌
 * 2. 若翻取，从事件牌堆顶摸1张事件牌并执行效果
 * 3. 若跳过，进入技牌阶段
 *
 * 横置角色跳过此阶段
 */

import type { PhaseConfig } from 'boardgame.io';
import type { GameState } from '../../shared/types/game';
import { PhaseType } from '../../shared/types/enums';
import { dispatchEvent } from '../events/index';

export const eventPhase: PhaseConfig<GameState> = {
  next: 'skill',
  onBegin: ({ G, ctx }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return;

    // 横置角色跳过此阶段
    if (player.immobilized) return;

    G.currentPhase = PhaseType.EVENT;
  },
  moves: {
    drawEvent: ({ G, ctx }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player || player.immobilized) return;

      // 事件牌堆为空时，将弃牌堆洗回事件牌堆
      if (G.piles.eventPile.length === 0) {
        // 找出弃牌堆中的事件牌（instanceId 以 "event_" 开头）
        const eventDiscards = G.piles.discardPile.filter(id => id.startsWith('event_'));
        if (eventDiscards.length === 0) return; // 没有事件牌可重洗

        // 将事件牌从弃牌堆移除
        G.piles.discardPile = G.piles.discardPile.filter(id => !id.startsWith('event_'));

        // 洗牌后放入事件牌堆
        G.piles.eventPile = ctx.random.Shuffle(eventDiscards);
      }

      const eventInstanceId = G.piles.eventPile.shift();
      if (!eventInstanceId) return;

      G.event.currentEventInstanceId = eventInstanceId;
      G.event.processed = true;

      // 执行事件效果
      const result = dispatchEvent(G, playerId, eventInstanceId);
      console.log('[Event] 执行事件:', result.logs);

      // 将事件牌放入弃牌堆
      G.piles.discardPile.push(eventInstanceId);
    },

    skipEvent: ({ G, ctx, events }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player || player.immobilized) return;

      events.endPhase();
    },
  },
  endIf: ({ G, ctx }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return true;
    if (player.immobilized) return true;
    if (G.event.processed) return true;
    return false;
  },
};
