/**
 * 仙剑逍遥游 - boardgame.io Game 主入口
 *
 * 配置：
 * - phases: 回合开始 → 事件 → 技牌 → 战斗 → 补牌 → 弃牌 → 回合结束
 * - moves: 基础操作（摸牌、弃牌、跳过）
 * - activePlayers: 支持多人同时响应（如妨碍者选择、打断窗口）
 */

import type { Game } from 'boardgame.io';
import { setup } from './setup';
import { turnStartPhase } from './phases/turnStart';
import { eventPhase } from './phases/event';
import { skillPhase } from './phases/skill';
import { combatPhase } from './phases/combat';
import { drawPhase } from './phases/draw';
import { discardPhase } from './phases/discard';
import { turnEndPhase } from './phases/turnEnd';
import type { GameState } from '../shared/types/game';

export const XiaoyaoyouGame: Game<GameState> = {
  name: 'xiaoyaoyou',

  setup,

  phases: {
    turnStart: turnStartPhase,
    event: eventPhase,
    skill: skillPhase,
    combat: combatPhase,
    draw: drawPhase,
    discard: discardPhase,
    turnEnd: turnEndPhase,
  },

  turn: {
    minMoves: 0,
    maxMoves: Infinity,
  },

  endIf: ({ G }) => {
    if (G.isGameOver) {
      return { winner: G.winnerTeam };
    }
    return undefined;
  },
};
