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

      if (G.piles.eventPile.length === 0) return;

      const eventInstanceId = G.piles.eventPile.shift();
      if (!eventInstanceId) return;

      G.event.currentEventInstanceId = eventInstanceId;
      G.event.processed = true;
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
