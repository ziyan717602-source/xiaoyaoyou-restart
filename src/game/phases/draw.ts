/**
 * 补牌阶段
 *
 * 流程：
 * 1. 打过怪：补2张手牌
 * 2. 跳过战斗：补1张手牌
 * 3. 进入弃牌阶段
 *
 * 横置角色跳过此阶段
 */

import type { PhaseConfig } from 'boardgame.io';
import type { GameState } from '../../shared/types/game';
import { PhaseType } from '../../shared/types/enums';

export const drawPhase: PhaseConfig<GameState> = {
  next: 'discard',
  onBegin: ({ G, ctx, random }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return;

    if (player.immobilized) return;

    G.currentPhase = PhaseType.DRAW;

    // 自动补牌
    const drawCount = player.skippedCombat ? 1 : 2;

    for (let i = 0; i < drawCount; i++) {
      if (G.piles.handPile.length === 0) {
        if (G.piles.discardPile.length > 0) {
          G.piles.handPile = random.Shuffle([...G.piles.discardPile]);
          G.piles.discardPile = [];
        } else {
          break;
        }
      }

      const cardInstanceId = G.piles.handPile.shift();
      if (cardInstanceId) {
        player.hand.push(cardInstanceId);
      }
    }

    player.skippedCombat = false;
  },
  moves: {},
  endIf: ({ G, ctx }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return true;
    if (player.immobilized) return true;
    return true;
  },
};
