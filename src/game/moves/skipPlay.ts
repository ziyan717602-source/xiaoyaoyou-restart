/**
 * 跳过 Move
 *
 * 跳过当前阶段的剩余操作
 */

import type { GameState } from '../../shared/types/game';

/**
 * 跳过当前阶段
 */
export function skipPlay({ G, ctx }: { G: GameState; ctx: any }): void {
  // 标记玩家已行动
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (player) {
    player.hasActed = true;
  }

  // 结束当前阶段
  ctx.events.endPhase();
}
