/**
 * 战牌效果实现
 *
 * 4 种战牌，共 17 张：
 * 1. 金蝉脱壳（2张）：强制结束战斗，无胜败。仅参战者可使用
 * 2. 金蚕王（5张）：本场战力+3。仅参战且命中生效
 * 3. 天玄五音（8张）：指定一方本场战力+2。未参战亦可使用
 * 4. 天罡战气（2张）：翻倍装备/宠物/技能战力（不含战牌加成）。参战并命中生效
 *
 * 使用时机：战牌阶段（R*ZD）
 * 通过 combat.ts 的 playCombatCard move 调用
 */

import type { GameState } from '../../shared/types/game';
import { tux } from '../../shared/data';

// ==================== 辅助函数 ====================

/**
 * 获取卡牌的CODE
 */
function getCardCode(G: GameState, cardInstanceId: string): string | null {
  const card = G.cardInstances[cardInstanceId];
  if (!card) return null;
  const tuxData = tux.find(t => t.ID === card.staticId);
  return tuxData?.CODE ?? null;
}

/**
 * 检查玩家是否为参战者
 */
function isParticipant(G: GameState, playerId: string): boolean {
  if (!G.combat) return false;
  return G.combat.participants.some(p => p.playerId === playerId);
}

/**
 * 检查参战者是否命中（当前简化：所有参战者默认命中）
 */
function isHit(G: GameState, playerId: string): boolean {
  // TODO: Phase 5 实现完整的命中判定（考虑闪避值）
  // 当前简化：所有参战者都命中
  return isParticipant(G, playerId);
}

/**
 * 获取玩家的队伍是否为攻击方（触发者队伍）
 */
function isAttackerTeam(G: GameState, playerId: string): boolean {
  const player = G.players[playerId];
  const rounder = G.players[G.currentPlayerId];
  if (!player || !rounder) return false;
  return player.team === rounder.team;
}

// ==================== 战牌效果 ====================

/**
 * 金蝉脱壳：强制结束战斗，无胜败
 * 仅参战者可使用
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 金蝉脱壳卡牌实例ID
 */
export function playJinChanTuoQiao(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
): void {
  const playerId = (ctx as any).playerID ?? ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player || !G.combat) return;

  if (!isParticipant(G, playerId)) return;

  const code = getCardCode(G, cardInstanceId);
  if (code !== 'ZP01') return;

  // 从手牌移除
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 强制结束战斗，无胜败
  G.combat.result = 'DRAW';
  G.combat.isFinished = true;
}

/**
 * 金蚕王：本场战力+3
 * 仅参战且命中生效
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 金蚕王卡牌实例ID
 */
export function playJinCanWang(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
): void {
  const playerId = (ctx as any).playerID ?? ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player || !G.combat) return;

  if (!isParticipant(G, playerId)) return;
  if (!isHit(G, playerId)) return;

  const code = getCardCode(G, cardInstanceId);
  if (code !== 'ZP03') return;

  // 从手牌移除
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 记录出牌
  G.combat.cardPlays.push({
    playerId,
    cardInstanceId,
    order: G.combat.cardPlays.length + 1,
  });

  // 战力+3
  if (isAttackerTeam(G, playerId)) {
    G.combat.attackerPool += 3;
  } else {
    G.combat.monsterPool += 3;
  }
}

/**
 * 天玄五音：指定一方本场战力+2
 * 未参战亦可使用
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 天玄五音卡牌实例ID
 * @param targetSide 目标方：'attacker' 或 'monster'
 */
export function playTianXuanWuYin(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
  targetSide: 'attacker' | 'monster',
): void {
  const playerId = (ctx as any).playerID ?? ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player || !G.combat) return;

  const code = getCardCode(G, cardInstanceId);
  if (code !== 'ZP04') return;

  // 从手牌移除
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 记录出牌
  G.combat.cardPlays.push({
    playerId,
    cardInstanceId,
    order: G.combat.cardPlays.length + 1,
  });

  // 指定一方战力+2
  if (targetSide === 'attacker') {
    G.combat.attackerPool += 2;
  } else {
    G.combat.monsterPool += 2;
  }
}

/**
 * 天罡战气：翻倍装备/宠物/技能战力（不含战牌加成）
 * 参战并命中生效
 *
 * 翻倍计算在 combat.ts 的 calculateFinalPower 中处理
 * 此处只记录出牌标记
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 天罡战气卡牌实例ID
 */
export function playTianGangZhanQi(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
): void {
  const playerId = (ctx as any).playerID ?? ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player || !G.combat) return;

  if (!isParticipant(G, playerId)) return;
  if (!isHit(G, playerId)) return;

  const code = getCardCode(G, cardInstanceId);
  if (code !== 'ZP02') return;

  // 从手牌移除
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 记录出牌（天罡战气的翻倍效果由 combat.ts 处理）
  G.combat.cardPlays.push({
    playerId,
    cardInstanceId,
    order: G.combat.cardPlays.length + 1,
  });

  // 天罡战气不直接改变战力池
  // 翻倍计算在 calculateFinalPower 中根据 cardPlays 记录来判断
}

// ==================== 战牌调度器 ====================

/**
 * 根据卡牌CODE分发到对应的效果函数
 * 由 combat.ts 的 playCombatCard move 调用
 */
export function dispatchCombatCard(
  context: { G: GameState; ctx: any },
  cardInstanceId: string,
  params: Record<string, unknown> = {},
): void {
  const code = getCardCode(context.G, cardInstanceId);
  if (!code) return;

  switch (code) {
    case 'ZP01': // 金蝉脱壳
      playJinChanTuoQiao(context, cardInstanceId);
      break;
    case 'ZP03': // 金蚕王
      playJinCanWang(context, cardInstanceId);
      break;
    case 'ZP04': // 天玄五音
      playTianXuanWuYin(
        context,
        cardInstanceId,
        (params.targetSide as 'attacker' | 'monster') ?? 'attacker',
      );
      break;
    case 'ZP02': // 天罡战气
      playTianGangZhanQi(context, cardInstanceId);
      break;
  }
}
