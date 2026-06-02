/**
 * 摸牌 Move
 *
 * 从手牌堆顶摸指定数量的牌到玩家手牌
 */

import type { GameState } from '../../shared/types/game';

/**
 * 摸牌
 */
export function drawCards({ G, ctx }: { G: GameState; ctx: any }, count: number = 1): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  for (let i = 0; i < count; i++) {
    // 检查手牌堆是否有牌
    if (G.piles.handPile.length === 0) {
      // 牌堆空了，将弃牌堆洗回手牌堆
      if (G.piles.discardPile.length > 0) {
        G.piles.handPile = ctx.random.Shuffle([...G.piles.discardPile]);
        G.piles.discardPile = [];
      } else {
        break; // 没牌可摸了
      }
    }

    const cardInstanceId = G.piles.handPile.shift();
    if (cardInstanceId) {
      player.hand.push(cardInstanceId);
    }
  }
}
