/**
 * 弃牌阶段
 *
 * 流程：
 * 1. 检查手牌是否超过上限（默认3张）
 * 2. 若超过，玩家选择弃掉多余的手牌
 * 3. 弃牌阶段结束后解除横置状态
 *
 * 横置角色也执行此阶段（跳过其他阶段但执行弃牌）
 */

import type { PhaseConfig } from 'boardgame.io';
import type { GameState } from '../../shared/types/game';
import { PhaseType } from '../../shared/types/enums';

export const discardPhase: PhaseConfig<GameState> = {
  next: 'turnEnd',
  onBegin: ({ G, ctx, events }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return;

    G.currentPhase = PhaseType.DISCARD;

    const excess = player.hand.length - player.handLimit;
    if (excess <= 0) {
      if (player.immobilized) {
        player.immobilized = false;
      }
      return;
    }

    events.setActivePlayers({
      currentPlayer: 'discardCards',
    });
  },
  moves: {
    discardCard: ({ G, ctx, events }, cardInstanceId: string) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return;

      const cardIndex = player.hand.indexOf(cardInstanceId);
      if (cardIndex === -1) return;

      player.hand.splice(cardIndex, 1);
      G.piles.discardPile.push(cardInstanceId);

      const excess = player.hand.length - player.handLimit;
      if (excess <= 0) {
        if (player.immobilized) {
          player.immobilized = false;
        }
        events.setActivePlayers({});
      }
    },
  },
  endIf: ({ G, ctx }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return true;

    const excess = player.hand.length - player.handLimit;
    return excess <= 0;
  },
};
