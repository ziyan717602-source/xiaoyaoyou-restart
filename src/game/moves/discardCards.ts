/**
 * 弃牌 Move
 *
 * 从玩家手牌中弃掉指定的牌
 */

import type { GameState } from '../../shared/types/game';

/**
 * 弃牌
 */
export function discardCard({ G, ctx }: { G: GameState; ctx: any }, cardInstanceId: string): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  // 检查手牌中是否有此牌
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;

  // 弃掉手牌
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);
}

/**
 * 批量弃牌
 */
export function discardCards({ G, ctx }: { G: GameState; ctx: any }, cardInstanceIds: string[]): void {
  for (const cardId of cardInstanceIds) {
    discardCard({ G, ctx }, cardId);
  }
}
