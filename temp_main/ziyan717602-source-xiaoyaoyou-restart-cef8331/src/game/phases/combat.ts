/**
 * 战斗阶段（含子流程）
 *
 * 子流程：
 * 1. 选支援者 - 当前回合玩家从己方存活角色中选择
 * 2. 选妨碍者 - 敌方玩家自己选择
 * 3. 翻怪 - 从怪物牌堆顶翻1张
 * 4. 战斗开始 - 初始化战力、命中判定
 * 5. 出场效果 - 执行怪物出场效果
 * 6. 战牌阶段 - 双方轮流出战牌
 * 7. 战斗结算 - 比较战力，执行胜利/失败效果
 * 8. 战斗结束 - 清理状态
 *
 * 横置角色跳过此阶段
 */

import type { PhaseConfig } from 'boardgame.io';
import type { GameState } from '../../shared/types/game';
import { PhaseType, CombatStage, Team } from '../../shared/types/enums';
import { tux } from '../../shared/data';
import { dispatchCombatCard } from '../moves/playCombatCard';
import { calculateFinalPower } from '../engine/combat';
import {
  createBingXinJueWindow,
  hasInterruptResponse,
  clearInterrupt,
  respondWithIceHeart,
} from '../engine/interrupt';
import {
  executeMonsterDebut,
  executeMonsterWinEff,
  executeMonsterLoseEff,
} from '../monsters/monsterEffects';
import { obtainPet } from '../engine/pet';
import { handleDeath, checkTeamVictory } from '../engine/death';

export const combatPhase: PhaseConfig<GameState> = {
  next: 'draw',
  onBegin: ({ G, ctx }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return;

    if (player.immobilized) return;

    G.currentPhase = PhaseType.COMBAT;

    G.combat = {
      stage: CombatStage.SUPPORT,
      monsterInstanceId: '',
      supporterPlayerId: null,
      supporterHeroInstanceId: null,
      hindererPlayerId: null,
      hindererHeroInstanceId: null,
      participants: [],
      cardPlays: [],
      currentPlayerId: playerId,
      isFinished: false,
      result: null,
      attackerPool: 0,
      monsterPool: 0,
    };
  },
  moves: {
    chooseFight: ({ G, ctx, events }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player || player.immobilized || !G.combat) return;

      G.combat.stage = CombatStage.SUPPORT;

      events.setActivePlayers({
        currentPlayer: 'selectSupporter',
      });
    },

    chooseSkipCombat: ({ G, ctx, events }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player || player.immobilized) return;

      if (G.piles.monsterPile.length > 0) {
        const discarded = G.piles.monsterPile.shift();
        if (discarded) {
          G.piles.discardPile.push(discarded);
        }
      }

      player.skippedCombat = true;
      G.combat = null;
      events.endPhase();
    },

    selectSupporter: ({ G, ctx, events }, targetPlayerId: string) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player || !G.combat) return;

      const target = G.players[targetPlayerId];
      if (!target || target.team !== player.team || !target.isAlive) return;

      G.combat.supporterPlayerId = targetPlayerId;
      G.combat.supporterHeroInstanceId = target.heroInstanceId;

      G.combat.participants.push({
        playerId: targetPlayerId,
        heroInstanceId: target.heroInstanceId,
        isSupporter: true,
        isHinderer: false,
      });

      G.combat.stage = CombatStage.HINDER;

      const enemyTeam = player.team === Team.A ? Team.B : Team.A;
      const enemyPlayerIds = Object.keys(G.players).filter(pid => {
        const p = G.players[pid];
        return p && p.team === enemyTeam && p.isAlive;
      });

      if (enemyPlayerIds.length > 0) {
        events.setActivePlayers({
          value: Object.fromEntries(enemyPlayerIds.map(pid => [pid, 'selectHinderer'])),
        });
      } else {
        G.combat.stage = CombatStage.REVEAL;
      }
    },

    selectHinderer: ({ G, ctx, events }, targetPlayerId: string) => {
      const playerId = (ctx as any).playerID;
      if (!playerId || !G.combat) return;

      const player = G.players[playerId];
      if (!player) return;

      const target = G.players[targetPlayerId];
      if (!target || target.team !== player.team || !target.isAlive) return;

      G.combat.hindererPlayerId = targetPlayerId;
      G.combat.hindererHeroInstanceId = target.heroInstanceId;

      G.combat.participants.push({
        playerId: targetPlayerId,
        heroInstanceId: target.heroInstanceId,
        isSupporter: false,
        isHinderer: true,
      });

      G.combat.stage = CombatStage.REVEAL;

      events.setActivePlayers({
        currentPlayer: 'revealMonster',
      });
    },

    skipHinder: ({ G, events }) => {
      if (!G.combat) return;

      G.combat.stage = CombatStage.REVEAL;
      events.setActivePlayers({
        currentPlayer: 'revealMonster',
      });
    },

    revealMonster: ({ G, ctx }) => {
      if (!G.combat) return;

      if (G.piles.monsterPile.length === 0) {
        G.isGameOver = true;
        return;
      }

      const monsterInstanceId = G.piles.monsterPile.shift();
      if (!monsterInstanceId) return;

      G.combat.monsterInstanceId = monsterInstanceId;
      G.combat.stage = CombatStage.PLAY_CARD;

      // 执行怪物出场效果（Debut）
      executeMonsterDebut(G, monsterInstanceId, ctx.random);

      const rounderPlayer = G.players[G.currentPlayerId];
      const monster = G.monsterInstances[monsterInstanceId];
      if (rounderPlayer && monster) {
        // 攻击方战力 = 触发者战力 + 支援者战力（若命中）
        const rounderHero = G.heroInstances[rounderPlayer.heroInstanceId];
        if (rounderHero) {
          G.combat.attackerPool = calculateFinalPower(G, rounderHero.instanceId);
        }

        // 加入支援者战力
        if (G.combat.supporterHeroInstanceId) {
          const supporterPower = calculateFinalPower(G, G.combat.supporterHeroInstanceId);
          G.combat.attackerPool += supporterPower;
        }

        // 怪物方战力 = 怪物战力 + 妨碍者战力（若命中）
        G.combat.monsterPool = monster.currentStr;

        // 加入妨碍者战力
        if (G.combat.hindererHeroInstanceId) {
          const hindererPower = calculateFinalPower(G, G.combat.hindererHeroInstanceId);
          G.combat.monsterPool += hindererPower;
        }
      }

      // 确定谁先出牌（战力低的一方先出）
      if (G.combat.attackerPool <= G.combat.monsterPool) {
        G.combat.currentPlayerId = G.currentPlayerId;
      } else {
        G.combat.currentPlayerId = 'monster';
      }
    },

    /**
     * 打出战牌
     * 使用 dispatchCombatCard 分发到对应效果
     *
     * @param cardInstanceId 战牌实例ID
     * @param params 效果参数（如天玄五音的目标方）
     */
    playCombatCard: ({ G, ctx, events }, cardInstanceId: string, params: Record<string, unknown> = {}) => {
      const playerId = (ctx as any).playerID;
      if (!playerId || !G.combat) return;

      const player = G.players[playerId];
      if (!player) return;

      if (G.combat.currentPlayerId !== playerId) return;

      const cardIndex = player.hand.indexOf(cardInstanceId);
      if (cardIndex === -1) return;

      const card = G.cardInstances[cardInstanceId];
      if (!card) return;

      const tuxData = tux.find(t => t.ID === card.staticId);
      if (!tuxData) return;

      // 检查是否为战牌（CODE前缀 ZP）
      if (!tuxData.CODE.startsWith('ZP')) return;

      // 创建冰心诀打断窗口
      const interruptId = createBingXinJueWindow(G, playerId, cardInstanceId);

      // 如果有玩家可以响应冰心诀，激活所有玩家
      if (interruptId && !hasInterruptResponse(G, interruptId)) {
        const allPlayerIds = Object.keys(G.players).filter(pid => {
          const p = G.players[pid];
          return p && p.isAlive;
        });

        events.setActivePlayers({
          value: Object.fromEntries(allPlayerIds.map(pid => [pid, 'respondIceHeart'])),
        });
        return; // 等待冰心诀响应
      }

      // 无冰心诀响应或已超时，执行战牌效果
      // 从手牌移除
      player.hand.splice(cardIndex, 1);
      G.piles.discardPile.push(cardInstanceId);

      // 分发到战牌效果
      dispatchCombatCard({ G, ctx }, cardInstanceId, params);

      // 金蝉脱壳特殊处理：直接结束战斗
      if (tuxData.CODE === 'ZP01') {
        return; // 金蝉脱壳已设置 isFinished
      }

      // 切换到对方出牌
      if (G.combat.currentPlayerId === G.currentPlayerId) {
        G.combat.currentPlayerId = 'monster';
      } else {
        G.combat.currentPlayerId = G.currentPlayerId;
      }
    },

    /**
     * 响应冰心诀（战斗中）
     */
    respondIceHeart: ({ G, ctx, events }, iceHeartCardInstanceId: string, _targetCardInstanceId: string, interruptId: string) => {
      const playerId = (ctx as any).playerID ?? ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return;

      const success = respondWithIceHeart(G, interruptId, playerId, iceHeartCardInstanceId);

      if (success) {
        clearInterrupt(G, interruptId);
        events.setActivePlayers({});
      }
    },

    skipCombatCard: ({ G }) => {
      if (!G.combat) return;

      if (G.combat.currentPlayerId === G.currentPlayerId) {
        G.combat.currentPlayerId = 'monster';
      } else {
        G.combat.currentPlayerId = G.currentPlayerId;
      }
    },

    endCombat: ({ G, events }) => {
      if (!G.combat) return;

      G.combat.stage = CombatStage.SETTLE;

      if (G.combat.result === 'DRAW') {
        // 金蝉脱壳等特殊结束
      } else if (G.combat.attackerPool >= G.combat.monsterPool) {
        G.combat.result = 'WIN';
      } else {
        G.combat.result = 'LOSE';
      }

      const monsterInstanceId = G.combat.monsterInstanceId;
      const rounderId = G.currentPlayerId;
      const rounder = G.players[rounderId];

      // 执行怪物胜利/失败效果
      if (G.combat.result === 'WIN') {
        executeMonsterWinEff(G, monsterInstanceId);
        // 战斗胜利：可选择捕获怪物作为宠物
        if (rounder) {
          const hero = G.heroInstances[rounder.heroInstanceId];
          if (hero && !hero.pet) {
            // 简化：自动捕获（实际应由玩家选择）
            obtainPet(G, rounderId, monsterInstanceId);
          }
        }
      } else if (G.combat.result === 'LOSE') {
        executeMonsterLoseEff(G, monsterInstanceId);
      }

      G.combat.isFinished = true;
      G.combat = null;

      // 检查队伍胜负
      checkTeamVictory(G);

      events.setActivePlayers({});
    },
  },
  endIf: ({ G, ctx }) => {
    const playerId = ctx.currentPlayer;
    const player = G.players[playerId];
    if (!player) return true;
    if (player.immobilized) return true;
    if (!G.combat) return true;
    if (G.combat.isFinished) return true;
    return false;
  },
};
