/**
 * 技牌阶段
 *
 * 流程：
 * 1. 玩家可执行操作（任意顺序、任意次数）：
 *    - 使用技牌（绿色牌面的手牌，打出后执行效果）
 *    - 放置装备（蓝色牌面的手牌，放入装备区）
 *    - 使用特殊牌（灵葫仙丹等可在技牌阶段使用的牌）
 *    - 发动角色技能
 * 2. 玩家选择跳过此阶段，进入战斗阶段
 *
 * 横置角色跳过此阶段
 */

import type { PhaseConfig } from 'boardgame.io';
import type { GameState } from '../../shared/types/game';
import { PhaseType } from '../../shared/types/enums';
import { tux } from '../../shared/data';
import { dispatchTechCard } from '../moves/playTuxCard';
import { equipCard } from '../moves/equipCard';
import { useLingHuXianDan } from '../moves/useItem';
import { drawCards } from '../moves/drawCards';
import {
  createBingXinJueWindow,
  hasInterruptResponse,
  clearInterrupt,
  respondWithIceHeart,
} from '../engine/interrupt';

export const skillPhase: PhaseConfig<GameState> = {
  next: 'combat',
  onBegin: ({ G, ctx }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return;

    if (player.immobilized) return;

    G.currentPhase = PhaseType.SKILL;
  },
  moves: {
    /**
     * 使用技牌
     * 根据卡牌CODE分发到对应的效果函数
     *
     * @param cardInstanceId 技牌实例ID
     * @param params 效果参数（目标玩家ID等）
     */
    playTechCard: ({ G, ctx, events }, cardInstanceId: string, params: Record<string, unknown> = {}) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player || player.immobilized) return;

      const cardIndex = player.hand.indexOf(cardInstanceId);
      if (cardIndex === -1) return;

      const card = G.cardInstances[cardInstanceId];
      if (!card) return;

      const tuxData = tux.find(t => t.ID === card.staticId);
      if (!tuxData) return;

      // 检查是否为技牌（CODE前缀 JP）
      if (!tuxData.CODE.startsWith('JP')) return;

      // 创建冰心诀打断窗口
      const interruptId = createBingXinJueWindow(G, playerId, cardInstanceId);

      // 如果有玩家可以响应冰心诀，激活所有玩家
      if (interruptId && !hasInterruptResponse(G, interruptId)) {
        // 激活所有存活玩家可以打出冰心诀
        const allPlayerIds = Object.keys(G.players).filter(pid => {
          const p = G.players[pid];
          return p && p.isAlive;
        });

        events.setActivePlayers({
          value: Object.fromEntries(allPlayerIds.map(pid => [pid, 'respondIceHeart'])),
        });
        return; // 等待冰心诀响应
      }

      // 无冰心诀响应或已超时，执行技牌效果
      dispatchTechCard({ G, ctx }, cardInstanceId, params);
    },

    /**
     * 响应冰心诀
     * 其他玩家打出冰心诀令当前技牌无效
     *
     * @param iceHeartCardInstanceId 冰心诀实例ID
     * @param targetCardInstanceId 被取消的牌实例ID
     * @param interruptId 打断窗口ID
     */
    respondIceHeart: ({ G, ctx, events }, iceHeartCardInstanceId: string, _targetCardInstanceId: string, interruptId: string) => {
      const playerId = (ctx as any).playerID ?? ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return;

      const success = respondWithIceHeart(G, interruptId, playerId, iceHeartCardInstanceId);

      if (success) {
        // 冰心诀生效，目标牌无效
        // 弃掉冰心诀（已在 respondWithIceHeart 中处理）
        clearInterrupt(G, interruptId);
        events.setActivePlayers({});
      }
    },

    /**
     * 放置装备
     * 将手牌中的装备牌放入装备区
     *
     * @param cardInstanceId 装备牌实例ID
     */
    equipCard: ({ G, ctx }, cardInstanceId: string) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player || player.immobilized) return;

      const cardIndex = player.hand.indexOf(cardInstanceId);
      if (cardIndex === -1) return;

      const card = G.cardInstances[cardInstanceId];
      if (!card) return;

      const tuxData = tux.find(t => t.ID === card.staticId);
      if (!tuxData) return;

      // 检查是否为装备牌（CODE前缀 WQ 或 FJ）
      const isWeapon = tuxData.CODE.startsWith('WQ');
      const isArmor = tuxData.CODE.startsWith('FJ');
      if (!isWeapon && !isArmor) return;

      equipCard({ G, ctx }, cardInstanceId);
    },

    /**
     * 使用灵葫仙丹
     * 自己HP+2；或HP=0角色复活+2HP
     *
     * @param cardInstanceId 灵葫仙丹实例ID
     * @param targetPlayerId 目标玩家ID（可选）
     */
    useLingHuXianDan: ({ G, ctx }, cardInstanceId: string, targetPlayerId?: string) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player || player.immobilized) return;

      useLingHuXianDan({ G, ctx }, cardInstanceId, targetPlayerId);
    },

    /**
     * 使用魔剑典当效果
     * 弃掉魔剑，补2张牌
     */
    useMoJianDianDang: ({ G, ctx }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player || player.immobilized) return;

      const hero = G.heroInstances[player.heroInstanceId];
      if (!hero || !hero.equipment.weapon) return;

      const weaponCard = G.cardInstances[hero.equipment.weapon];
      if (!weaponCard) return;

      const tuxData = tux.find(t => t.ID === weaponCard.staticId);
      if (!tuxData || tuxData.CODE !== 'WQ04') return; // 魔剑

      // 弃掉魔剑
      const weaponInstanceId = hero.equipment.weapon;
      hero.equipment.weapon = null;
      hero.currentDex -= 1; // 移除命中+1
      G.piles.discardPile.push(weaponInstanceId);

      // 补2张牌
      drawCards({ G, ctx }, 2);
    },

    /**
     * 跳过技牌阶段
     */
    skipSkillPhase: ({ G, ctx, events }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player || player.immobilized) return;

      events.endPhase();
    },
  },
  endIf: ({ G, ctx }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return true;
    if (player.immobilized) return true;
    return false;
  },
};
