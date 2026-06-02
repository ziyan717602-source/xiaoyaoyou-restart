/**
 * 特殊牌效果实现
 *
 * 4 种特殊牌，共 14 张：
 * 1. 冰心诀（3张）：令当前打出的牌无效。任意玩家出牌时使用
 * 2. 洞冥宝镜（4张）：查看怪物牌堆顶1张。决定是否翻怪前使用
 * 3. 隐蛊（4张）：抵消一次自己受到的HP伤害。受伤时使用
 * 4. 灵葫仙丹（3张）：自己HP+2；或HP=0角色复活+2HP。技牌阶段使用
 *
 * 使用时机各不相同：
 * - 冰心诀：响应窗口（G0CD），任意玩家出牌时
 * - 洞冥宝镜：翻怪前（G1SG），决定是否翻怪时
 * - 隐蛊：受伤时（G0OH），响应窗口
 * - 灵葫仙丹：技牌阶段（R#GR）或濒死时（G0ZH）
 */

import type { GameState } from '../../shared/types/game';
import { tux } from '../../shared/data';
import {
  respondWithIceHeart,
  respondWithHideBug,
  clearInterrupt,
} from '../engine/interrupt';

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

// ==================== 冰心诀 ====================

/**
 * 冰心诀：令当前打出的牌无效
 * 任意玩家出牌时使用（响应窗口）
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param iceHeartCardInstanceId 冰心诀卡牌实例ID
 * @param targetCardInstanceId 要取消的卡牌实例ID
 * @param interruptId 对应的打断窗口ID
 */
export function useBingXinJue(
  { G, ctx }: { G: GameState; ctx: any },
  iceHeartCardInstanceId: string,
  _targetCardInstanceId: string,
  interruptId: string,
): boolean {
  const playerId = (ctx as any).playerID ?? ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return false;

  // 验证是否为冰心诀
  const code = getCardCode(G, iceHeartCardInstanceId);
  if (code !== 'TP01') return false;

  // 通过打断引擎处理
  const success = respondWithIceHeart(G, interruptId, playerId, iceHeartCardInstanceId);
  if (!success) return false;

  // 冰心诀生效：目标牌无效
  // 被取消的牌已经不在手牌中（出牌时已移除）
  // 这里需要标记该牌效果不执行
  // 具体的取消逻辑由调用方（skill.ts/combat.ts）处理

  // 清理打断窗口
  clearInterrupt(G, interruptId);

  return true;
}

// ==================== 洞冥宝镜 ====================

/**
 * 洞冥宝镜：查看怪物牌堆顶1张
 * 决定是否翻怪前使用
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 洞冥宝镜卡牌实例ID
 * @returns 怪物牌堆顶的卡牌实例ID，如果牌堆为空则返回null
 */
export function useDongMingBaoJing(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
): string | null {
  const playerId = (ctx as any).playerID ?? ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return null;

  const code = getCardCode(G, cardInstanceId);
  if (code !== 'TP04') return null;

  // 从手牌移除
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return null;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 查看怪物牌堆顶1张
  if (G.piles.monsterPile.length === 0) return null;
  const topCard = G.piles.monsterPile[0]!;
  return topCard;
}

// ==================== 隐蛊 ====================

/**
 * 隐蛊：抵消一次自己受到的HP伤害
 * 受伤时使用（响应窗口）
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param hideBugCardInstanceId 隐蛊卡牌实例ID
 * @param interruptId 对应的打断窗口ID
 */
export function useYinGu(
  { G, ctx }: { G: GameState; ctx: any },
  hideBugCardInstanceId: string,
  interruptId: string,
): boolean {
  const playerId = (ctx as any).playerID ?? ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return false;

  const code = getCardCode(G, hideBugCardInstanceId);
  if (code !== 'TP03') return false;

  const success = respondWithHideBug(G, interruptId, playerId, hideBugCardInstanceId);
  if (!success) return false;

  // 隐蛊生效：伤害被抵消
  // 具体的伤害取消逻辑由调用方处理

  clearInterrupt(G, interruptId);

  return true;
}

// ==================== 灵葫仙丹 ====================

/**
 * 灵葫仙丹：自己HP+2；或HP=0角色复活+2HP
 * 技牌阶段使用 / 濒死时使用
 *
 * @param G 游戏状态
 * @param ctx boardgame.io 上下文
 * @param cardInstanceId 灵葫仙丹卡牌实例ID
 * @param targetPlayerId 目标玩家ID（可选，不传则为自己）
 */
export function useLingHuXianDan(
  { G, ctx }: { G: GameState; ctx: any },
  cardInstanceId: string,
  targetPlayerId?: string,
): void {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  if (!player) return;

  const code = getCardCode(G, cardInstanceId);
  if (code !== 'TP02') return;

  // 从手牌移除
  const cardIndex = player.hand.indexOf(cardInstanceId);
  if (cardIndex === -1) return;
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(cardInstanceId);

  // 确定目标
  const actualTarget = targetPlayerId ?? playerId;
  const target = G.players[actualTarget];
  if (!target) return;

  const hero = G.heroInstances[target.heroInstanceId];
  if (!hero) return;

  // 效果1：自己HP+2（默认）
  // 效果2：HP=0角色复活+2HP
  if (hero.currentHp === 0 && !hero.isAlive) {
    // 复活：恢复2HP，设置为存活
    hero.currentHp = 2;
    hero.isAlive = true;
  } else {
    // 普通效果：HP+2
    hero.currentHp = Math.min(hero.maxHp, hero.currentHp + 2);
  }
}

// ==================== 调度器 ====================

/**
 * 根据卡牌CODE分发到对应的效果函数
 */
export function dispatchSpecialCard(
  context: { G: GameState; ctx: any },
  cardInstanceId: string,
  params: Record<string, unknown> = {},
): void {
  const code = getCardCode(context.G, cardInstanceId);
  if (!code) return;

  switch (code) {
    case 'TP01': // 冰心诀
      useBingXinJue(
        context,
        cardInstanceId,
        params.targetCardInstanceId as string,
        params.interruptId as string,
      );
      break;
    case 'TP04': // 洞冥宝镜
      useDongMingBaoJing(context, cardInstanceId);
      break;
    case 'TP03': // 隐蛊
      useYinGu(context, cardInstanceId, params.interruptId as string);
      break;
    case 'TP02': // 灵葫仙丹
      useLingHuXianDan(
        context,
        cardInstanceId,
        params.targetPlayerId as string | undefined,
      );
      break;
  }
}
