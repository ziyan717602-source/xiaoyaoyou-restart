/**
 * 打断窗口引擎
 *
 * 处理两种打断窗口：
 * 1. 冰心诀打断窗口：任意玩家出牌时，其他玩家可打出冰心诀令其无效
 * 2. 隐蛊伤害响应窗口：玩家即将受到HP伤害时，可打出隐蛊抵消
 *
 * 机制：
 * - 通过 pendingInterrupts 记录待响应的打断窗口
 * - 通过 setActivePlayers({ all }) 同时激活所有可响应玩家
 * - 第一个响应的玩家生效，其他人的响应无效
 * - 超时后无人响应，原效果正常执行
 */

import type { GameState } from '../../shared/types/game';
import { tux } from '../../shared/data';

// ==================== 打断类型 ====================

/** 冰心诀打断：令打出的牌无效 */
export const INTERRUPT_TYPE_ICE_HEART = 'ICE_HEART';

/** 隐蛊伤害抵消：抵消HP伤害 */
export const INTERRUPT_TYPE_HIDE_BUG = 'HIDE_BUG';

/** 天帝祭服隐蛊：手牌当隐蛊使用 */
export const INTERRUPT_TYPE_TIAN_DI_ROBE = 'TIAN_DI_ROBE';

// ==================== 创建打断窗口 ====================

/**
 * 创建冰心诀打断窗口
 * 当任意玩家打出技牌/战牌/特殊牌时调用
 *
 * @param G 游戏状态
 * @param interruptId 打断窗口唯一ID
 * @param triggerPlayerId 出牌的玩家ID
 * @param cardInstanceId 被打出的卡牌实例ID
 * @param timeoutMs 超时时间（毫秒），默认30秒
 */
export function createIceHeartInterrupt(
  G: GameState,
  interruptId: string,
  triggerPlayerId: string,
  _cardInstanceId: string,
  timeoutMs: number = 30000,
): void {
  // 找出所有持有冰心诀的存活玩家（出牌者自己也可以响应）
  const availablePlayerIds: string[] = [];

  for (const pid of Object.keys(G.players)) {
    const player = G.players[pid];
    if (!player || !player.isAlive) continue;

    // 检查手牌中是否有冰心诀（CODE=TP01）
    for (const handCardId of player.hand) {
      const card = G.cardInstances[handCardId];
      if (!card) continue;

      const tuxData = tux.find(t => t.ID === card.staticId);
      if (tuxData && tuxData.CODE === 'TP01') {
        availablePlayerIds.push(pid);
        break;
      }
    }
  }

  // 如果没有玩家持有冰心诀，不创建打断窗口
  if (availablePlayerIds.length === 0) return;

  G.pendingInterrupts.push({
    id: interruptId,
    triggerPlayerId,
    availablePlayerIds,
    respondedPlayerIds: [],
    timeoutMs,
    type: INTERRUPT_TYPE_ICE_HEART,
  });
}

/**
 * 创建隐蛊伤害响应窗口
 * 当玩家即将受到HP伤害时调用
 *
 * @param G 游戏状态
 * @param interruptId 打断窗口唯一ID
 * @param triggerPlayerId 即将受伤的玩家ID
 * @param timeoutMs 超时时间（毫秒），默认30秒
 */
export function createHideBugInterrupt(
  G: GameState,
  interruptId: string,
  triggerPlayerId: string,
  timeoutMs: number = 30000,
): void {
  const availablePlayerIds: string[] = [];

  for (const pid of Object.keys(G.players)) {
    const player = G.players[pid];
    if (!player || !player.isAlive) continue;

    // 只有受伤者自己可以使用隐蛊（倾慕除外）
    if (pid !== triggerPlayerId) continue;

    // 检查手牌中是否有隐蛊（CODE=TP03）
    for (const handCardId of player.hand) {
      const card = G.cardInstances[handCardId];
      if (!card) continue;

      const tuxData = tux.find(t => t.ID === card.staticId);
      if (tuxData && tuxData.CODE === 'TP03') {
        availablePlayerIds.push(pid);
        break;
      }
    }

    // 检查是否装备了天帝祭服（手牌可当隐蛊）
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero && hero.equipment.armor) {
      const armorCard = G.cardInstances[hero.equipment.armor];
      if (armorCard) {
        const tuxData = tux.find(t => t.ID === armorCard.staticId);
        if (tuxData && tuxData.CODE === 'FJ02') {
          // 天帝祭服：任何手牌都可当隐蛊
          if (!availablePlayerIds.includes(pid)) {
            availablePlayerIds.push(pid);
          }
        }
      }
    }
  }

  if (availablePlayerIds.length === 0) return;

  G.pendingInterrupts.push({
    id: interruptId,
    triggerPlayerId,
    availablePlayerIds,
    respondedPlayerIds: [],
    timeoutMs,
    type: INTERRUPT_TYPE_HIDE_BUG,
  });
}

// ==================== 响应打断 ====================

/**
 * 响应冰心诀打断
 * 玩家打出冰心诀，令当前出的牌无效
 *
 * @returns 是否成功响应
 */
export function respondWithIceHeart(
  G: GameState,
  interruptId: string,
  respondingPlayerId: string,
  iceHeartCardInstanceId: string,
): boolean {
  const interrupt = G.pendingInterrupts.find(i => i.id === interruptId);
  if (!interrupt) return false;
  if (interrupt.type !== INTERRUPT_TYPE_ICE_HEART) return false;
  if (interrupt.respondedPlayerIds.length > 0) return false; // 已有人响应

  // 检查玩家是否在可响应列表中
  if (!interrupt.availablePlayerIds.includes(respondingPlayerId)) return false;

  // 检查玩家手牌中是否有这张冰心诀
  const player = G.players[respondingPlayerId];
  if (!player) return false;

  const cardIndex = player.hand.indexOf(iceHeartCardInstanceId);
  if (cardIndex === -1) return false;

  const card = G.cardInstances[iceHeartCardInstanceId];
  if (!card) return false;

  const tuxData = tux.find(t => t.ID === card.staticId);
  if (!tuxData || tuxData.CODE !== 'TP01') return false;

  // 打出冰心诀
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(iceHeartCardInstanceId);

  // 标记已响应
  interrupt.respondedPlayerIds.push(respondingPlayerId);

  // 同时弃掉被取消的牌
  const triggerPlayer = G.players[interrupt.triggerPlayerId];
  if (triggerPlayer) {
    // 被取消的牌已经在出牌时从手牌移除，这里只需要标记
    // 实际的牌取消逻辑由调用方处理
  }

  return true;
}

/**
 * 响应隐蛊伤害抵消
 * 玩家打出隐蛊，抵消本次HP伤害
 *
 * @returns 是否成功响应
 */
export function respondWithHideBug(
  G: GameState,
  interruptId: string,
  respondingPlayerId: string,
  hideBugCardInstanceId: string,
): boolean {
  const interrupt = G.pendingInterrupts.find(i => i.id === interruptId);
  if (!interrupt) return false;
  if (interrupt.type !== INTERRUPT_TYPE_HIDE_BUG) return false;
  if (interrupt.respondedPlayerIds.length > 0) return false;

  if (!interrupt.availablePlayerIds.includes(respondingPlayerId)) return false;

  const player = G.players[respondingPlayerId];
  if (!player) return false;

  const cardIndex = player.hand.indexOf(hideBugCardInstanceId);
  if (cardIndex === -1) return false;

  const card = G.cardInstances[hideBugCardInstanceId];
  if (!card) return false;

  const tuxData = tux.find(t => t.ID === card.staticId);
  if (!tuxData) return false;

  // 检查是否为隐蛊，或者是天帝祭服效果下的任意手牌
  const hero = G.heroInstances[player.heroInstanceId];
  const hasTianDi = hero?.equipment.armor
    ? (() => {
        const armorCard = G.cardInstances[hero.equipment.armor];
        if (!armorCard) return false;
        const armorTux = tux.find(t => t.ID === armorCard.staticId);
        return !!(armorTux && armorTux.CODE === 'FJ02');
      })()
    : false;

  const isHideBug = tuxData.CODE === 'TP03';
  const isTianDiEffect = hasTianDi; // 天帝祭服效果：任意手牌当隐蛊

  if (!isHideBug && !isTianDiEffect) return false;

  // 打出隐蛊
  player.hand.splice(cardIndex, 1);
  G.piles.discardPile.push(hideBugCardInstanceId);

  interrupt.respondedPlayerIds.push(respondingPlayerId);

  return true;
}

// ==================== 打断窗口清理 ====================

/**
 * 清理指定打断窗口
 */
export function clearInterrupt(G: GameState, interruptId: string): void {
  const index = G.pendingInterrupts.findIndex(i => i.id === interruptId);
  if (index !== -1) {
    G.pendingInterrupts.splice(index, 1);
  }
}

/**
 * 清理所有打断窗口
 */
export function clearAllInterrupts(G: GameState): void {
  G.pendingInterrupts = [];
}

/**
 * 检查打断窗口是否已有人响应
 */
export function hasInterruptResponse(G: GameState, interruptId: string): boolean {
  const interrupt = G.pendingInterrupts.find(i => i.id === interruptId);
  if (!interrupt) return false;
  return interrupt.respondedPlayerIds.length > 0;
}

/**
 * 获取打断窗口的首个响应者
 */
export function getFirstResponder(G: GameState, interruptId: string): string | null {
  const interrupt = G.pendingInterrupts.find(i => i.id === interruptId);
  if (!interrupt || interrupt.respondedPlayerIds.length === 0) return null;
  return interrupt.respondedPlayerIds[0]!;
}

// ==================== 便捷创建函数 ====================

/**
 * 创建冰心诀打断窗口（便捷版本）
 * 返回打断窗口ID，如果不需要打断则返回null
 */
export function createBingXinJueWindow(
  G: GameState,
  triggerPlayerId: string,
  cardInstanceId: string,
): string | null {
  const interruptId = `ice_${triggerPlayerId}_${cardInstanceId}_${Date.now()}`;
  createIceHeartInterrupt(G, interruptId, triggerPlayerId, cardInstanceId);
  return interruptId;
}

/**
 * 创建隐蛊伤害响应窗口（便捷版本）
 * 返回打断窗口ID
 */
export function createYinGuWindow(
  G: GameState,
  targetPlayerId: string,
): string | null {
  const interruptId = `hidebug_${targetPlayerId}_${Date.now()}`;
  createHideBugInterrupt(G, interruptId, targetPlayerId);
  return interruptId;
}
