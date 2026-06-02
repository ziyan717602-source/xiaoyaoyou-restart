/**
 * 回合开始阶段
 *
 * 流程：
 * 1. 重置所有玩家 RAM
 * 2. 横置检查：若玩家被横置，跳过所有阶段进入弃牌阶段
 * 3. 触发回合开始技能
 * 4. 进入事件阶段
 */

import type { PhaseConfig } from 'boardgame.io';
import type { GameState } from '../../shared/types/game';
import { PhaseType } from '../../shared/types/enums';

export const turnStartPhase: PhaseConfig<GameState> = {
  start: true,
  next: 'event',
  onBegin: ({ G, ctx }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return;

    // 1. 重置所有玩家的 RAM
    for (const pid of Object.keys(G.players)) {
      const p = G.players[pid];
      if (p) p.ram = {};
    }

    // 2. 重置当前玩家的 RFM
    player.rfm = {};

    // 3. 更新当前阶段
    G.currentPhase = PhaseType.TURN_START;
    G.currentPlayerId = playerId;

    // 4. 横置检查：若被横置，直接跳到弃牌阶段
    if (player.immobilized) {
      player.skippedCombat = true;
    }
  },
  moves: {},
};
