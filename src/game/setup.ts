/**
 * 仙剑逍遥游 - 游戏初始化函数
 *
 * boardgame.io setup 函数，负责：
 * 1. 洗牌（使用 ctx.random.Shuffle）
 * 2. 随机发 3 张角色牌（模拟选将）
 * 3. 发初始 3 张手牌
 * 4. 初始化玩家状态
 */

import { heroes, monsters, tux, npcs } from '../shared/data';
import type { GameState, PlayerState } from '../shared/types/game';
import type { HeroInstance } from '../shared/types/hero';
import type { CardInstance, MonsterInstance } from '../shared/types/card';
import { Team } from '../shared/types/enums';

/**
 * 创建卡牌实例
 */
function createCardInstance(tuxId: number, instanceId: string, ownerId: string): CardInstance {
  return {
    instanceId,
    staticId: tuxId,
    ownerId,
    buffs: [],
  };
}

/**
 * 创建角色实例
 */
function createHeroInstance(heroId: number, instanceId: string): HeroInstance {
  const heroData = heroes.find(h => h.ID === heroId);
  if (!heroData) {
    throw new Error(`Hero not found: ${heroId}`);
  }
  return {
    instanceId,
    staticId: heroId,
    currentHp: heroData.HP,
    maxHp: heroData.HP,
    currentStr: heroData.STR,
    currentDex: heroData.DEX,
    immobilized: false,
    isAlive: true,
    equipment: { weapon: null, armor: null, special: null },
    pet: null,
    buffs: [],
    hand: [],
  };
}

/**
 * 创建怪物实例
 */
function createMonsterInstance(monsterId: number, instanceId: string): MonsterInstance {
  const monsterData = monsters.find(m => m.ID === monsterId);
  if (!monsterData) {
    throw new Error(`Monster not found: ${monsterId}`);
  }
  return {
    instanceId,
    staticId: monsterId,
    currentStr: monsterData.STR,
    currentAgl: monsterData.AGL,
    buffs: [],
  };
}

/**
 * boardgame.io setup 函数
 */
export function setup({ ctx }: { ctx: any }): GameState {
  const { random } = ctx;
  const numPlayers = ctx.numPlayers;
  const playerIds: string[] = ctx.playOrder;

  // ========== 洗牌手牌堆 ==========
  const tuxIds = tux.map(t => t.ID);
  const shuffledTux: number[] = random.Shuffle(tuxIds);

  // ========== 洗牌怪物堆 ==========
  const monsterIds = monsters.map(m => m.ID);
  const npcIds = npcs.map(n => n.ID);
  const shuffledNpcIds: number[] = random.Shuffle(npcIds);
  const selectedNpcIds = shuffledNpcIds.slice(0, 10);
  const monsterPileIds = [...monsterIds, ...selectedNpcIds];
  const shuffledMonsterPile: number[] = random.Shuffle(monsterPileIds);

  // ========== 创建实例映射 ==========
  const heroInstances: Record<string, HeroInstance> = {};
  const cardInstances: Record<string, CardInstance> = {};
  const monsterInstances: Record<string, MonsterInstance> = {};

  // ========== 随机发角色牌（模拟选将） ==========
  const selectableHeroes = heroes.filter(h => h.VALID === '1' && !h.ISO);
  const shuffledHeroes = random.Shuffle(selectableHeroes);

  const players: Record<string, PlayerState> = {};

  for (let i = 0; i < numPlayers; i++) {
    const playerId: string = playerIds[i]!;
    const team = i % 2 === 0 ? Team.A : Team.B;
    const seatNumber = i;

    const heroData = shuffledHeroes[i % shuffledHeroes.length];
    const heroInstanceId = `hero_${playerId}_${i}`;
    const heroInst = createHeroInstance(heroData.ID, heroInstanceId);
    heroInstances[heroInstanceId] = heroInst;

    // 发初始3张手牌
    const handCardIds: string[] = [];
    const startIdx = i * 3;
    for (let j = 0; j < 3; j++) {
      const tuxId = shuffledTux[startIdx + j];
      if (tuxId !== undefined) {
        const cardInstanceId = `card_${playerId}_${j}`;
        const cardInst = createCardInstance(tuxId, cardInstanceId, playerId);
        cardInstances[cardInstanceId] = cardInst;
        handCardIds.push(cardInstanceId);
      }
    }

    players[playerId] = {
      id: playerId,
      name: `Player ${playerId}`,
      team,
      seatNumber,
      heroInstanceId,
      hand: handCardIds,
      handLimit: 3,
      hasActed: false,
      skippedCombat: false,
      immobilized: false,
      isAlive: true,
      loved: false,
      ram: {},
      rfm: {},
    };
  }

  // ========== 创建怪物堆实例 ==========
  const monsterPile: string[] = [];
  for (let idx = 0; idx < shuffledMonsterPile.length; idx++) {
    const mId: number = shuffledMonsterPile[idx]!;
    const monsterData = monsters.find(m => m.ID === mId);
    if (monsterData) {
      const instanceId = `monster_${mId}_${idx}`;
      monsterInstances[instanceId] = createMonsterInstance(mId, instanceId);
      monsterPile.push(instanceId);
    }
  }

  // ========== 构建手牌堆（剩余的手牌实例 ID） ==========
  const handPile: string[] = [];
  const startHandCards = numPlayers * 3;
  for (let i = startHandCards; i < shuffledTux.length; i++) {
    const tuxId: number = shuffledTux[i]!;
    const instanceId = `tux_${tuxId}_${i}`;
    const cardInst = createCardInstance(tuxId, instanceId, '');
    cardInstances[instanceId] = cardInst;
    handPile.push(instanceId);
  }

  // ========== 返回初始 GameState ==========
  return {
    currentPhase: 'TURN_START' as any,
    currentPlayerId: playerIds[0]!,
    turnCount: 1,
    isGameOver: false,
    winnerTeam: null,
    piles: {
      handPile,
      eventPile: [],
      monsterPile,
      discardPile: [],
      topIndex: {},
    },
    players,
    heroInstances,
    cardInstances,
    monsterInstances,
    eventInstances: {},
    npcInstances: {},
    skillInstances: {},
    combat: null,
    event: {
      currentEventInstanceId: null,
      processed: false,
    },
    pendingInterrupts: [],
    pendingChoices: [],
  };
}
