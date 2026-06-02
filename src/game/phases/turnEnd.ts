/**
 * 回合结束阶段
 *
 * 流程：
 * 1. 清理未使用的 PendingTux
 * 2. 清理战斗临时状态
 * 3. 检查是否有 HP=0 但未处理的玩家
 * 4. 解除横置状态
 * 5. 进入下一个玩家的回合
 */

import type { PhaseConfig } from 'boardgame.io';
import type { GameState } from '../../shared/types/game';
import { PhaseType } from '../../shared/types/enums';

export const turnEndPhase: PhaseConfig<GameState> = {
  onBegin: ({ G, ctx }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return;

    G.currentPhase = PhaseType.TURN_END;

    // 清理战斗临时状态
    G.combat = null;

    // 清理待处理状态
    G.pendingInterrupts = [];
    G.pendingChoices = [];

    // 解除横置状态
    if (player.immobilized) {
      player.immobilized = false;
    }
  },
  onEnd: ({ G }) => {
    // 回合结束，进入下一个玩家的回合
    G.turnCount += 1;
  },
  moves: {
    // 回合结束阶段无特殊操作
  },
  endIf: () => {
    return true; // 自动结束
  },
};
