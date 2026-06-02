/**
 * 事件牌效果测试
 *
 * 测试14张基础事件牌的效果实现
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dispatchEvent } from '../../../game/events/index';
import { executeEventCard } from '../../../game/moves/playEventCard';
import type { GameState } from '../../../shared/types/game';
import { Team } from '../../../shared/types/enums';

// ==================== 测试工具 ====================

/**
 * 创建测试用的 GameState
 */
function createTestGameState(): GameState {
  return {
    currentPhase: 'EVENT' as any,
    currentPlayerId: 'player1',
    turnCount: 1,
    isGameOver: false,
    winnerTeam: null,
    piles: {
      handPile: ['card1', 'card2', 'card3', 'card4', 'card5'],
      eventPile: [],
      monsterPile: ['monster1', 'monster2'],
      discardPile: [],
      topIndex: {},
    },
    players: {
      player1: {
        id: 'player1',
        name: '玩家1',
        team: Team.A,
        seatNumber: 0,
        heroInstanceId: 'hero1',
        hand: ['card1', 'card2', 'card3'],
        handLimit: 5,
        hasActed: false,
        skippedCombat: false,
        immobilized: false,
        isAlive: true,
        loved: false,
        ram: {},
        rfm: {},
      },
      player2: {
        id: 'player2',
        name: '玩家2',
        team: Team.B,
        seatNumber: 1,
        heroInstanceId: 'hero2',
        hand: ['card4', 'card5'],
        handLimit: 5,
        hasActed: false,
        skippedCombat: false,
        immobilized: false,
        isAlive: true,
        loved: false,
        ram: {},
        rfm: {},
      },
    },
    heroInstances: {
      hero1: {
        instanceId: 'hero1',
        staticId: 1,
        currentHp: 5,
        maxHp: 8,
        isAlive: true,
        equipment: {
          weapon: null,
          armor: null,
          special: null,
        },
        pet: null,
        buffs: [],
      },
      hero2: {
        instanceId: 'hero2',
        staticId: 2,
        currentHp: 3,
        maxHp: 6,
        isAlive: true,
        equipment: {
          weapon: null,
          armor: null,
          special: null,
        },
        pet: null,
        buffs: [],
      },
    },
    cardInstances: {},
    monsterInstances: {},
    eventInstances: {
      event1: {
        instanceId: 'event1',
        staticId: 1, // SJ101 仙灵岛的邂逅
      },
      event2: {
        instanceId: 'event2',
        staticId: 2, // SJ102 深入将军冢
      },
      event3: {
        instanceId: 'event3',
        staticId: 3, // SJ103 走出圣姑小屋
      },
      event5: {
        instanceId: 'event5',
        staticId: 5, // SJ201 寻找天使绘卷
      },
      event7: {
        instanceId: 'event7',
        staticId: 7, // SJ301 三世轮回
      },
      event8: {
        instanceId: 'event8',
        staticId: 8, // SJ302 神树与夕瑶
      },
      event12: {
        instanceId: 'event12',
        staticId: 12, // SJ401 拜访石沉溪洞
      },
      event13: {
        instanceId: 'event13',
        staticId: 13, // SJ402 束缚幻瞑界
      },
      event14: {
        instanceId: 'event14',
        staticId: 14, // SJ501 误闯神魔之隙
      },
    },
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

// ==================== 测试用例 ====================

describe('事件牌效果', () => {
  let G: GameState;

  beforeEach(() => {
    G = createTestGameState();
  });

  describe('SJ102 深入将军冢', () => {
    it('无宠物的角色各补1张', () => {
      const result = dispatchEvent(G, 'player1', 'event2');

      expect(result.success).toBe(true);
      expect(result.logs).toContain('玩家 player1 无宠物，补1张牌');
      expect(result.logs).toContain('玩家 player2 无宠物，补1张牌');
    });
  });

  describe('SJ201 寻找天使绘卷', () => {
    it('HP<=3的角色各补1张', () => {
      // player2 HP=3，应该补牌
      const result = dispatchEvent(G, 'player1', 'event5');

      expect(result.success).toBe(true);
      expect(result.logs).toContain('玩家 player2 HP=3<=3，补1张牌');
    });
  });

  describe('SJ301 三世轮回', () => {
    it('手牌少于3张的补牌', () => {
      // player2 手牌2张，应该补1张
      const result = dispatchEvent(G, 'player1', 'event7');

      expect(result.success).toBe(true);
      expect(result.logs).toContain('玩家 player2 手牌2张，补1张');
    });

    it('手牌多于3张的弃牌', () => {
      // player1 手牌3张，无需调整
      const result = dispatchEvent(G, 'player1', 'event7');

      expect(result.success).toBe(true);
      expect(result.logs).toContain('玩家 player1 手牌刚好3张，无需调整');
    });
  });

  describe('SJ302 神树与夕瑶', () => {
    it('HP最少的角色恢复2HP', () => {
      // player2 HP=3最少，应该恢复2HP
      const result = dispatchEvent(G, 'player1', 'event8');

      expect(result.success).toBe(true);
      expect(result.logs).toContain('玩家 player2 HP=3最少，恢复2HP');
    });
  });

  describe('SJ401 拜访石沉溪洞', () => {
    it('弃掉所有手牌，补2张', () => {
      const initialHandSize = G.players.player1!.hand.length;
      const result = dispatchEvent(G, 'player1', 'event12');

      expect(result.success).toBe(true);
      expect(result.logs).toContain(`弃掉${initialHandSize}张手牌`);
      expect(result.logs).toContain('补2张牌');
    });
  });

  describe('SJ402 束缚幻瞑界', () => {
    it('有宠物的角色扣除HP', () => {
      // 给player1添加宠物
      G.heroInstances.hero1!.pet = 'pet1';

      const result = dispatchEvent(G, 'player1', 'event13');

      expect(result.success).toBe(true);
      expect(result.logs).toContain('玩家 player1 扣除1HP（宠物数）');
    });
  });

  describe('SJ501 误闯神魔之隙', () => {
    it('手牌最多的角色被横置', () => {
      // player1 手牌3张最多
      const result = dispatchEvent(G, 'player1', 'event14');

      expect(result.success).toBe(true);
      expect(result.logs).toContain('玩家 player1 手牌最多（3张），被横置');
      expect(G.players.player1!.immobilized).toBe(true);
    });

    it('多人并列则无效', () => {
      // 两人手牌相同
      G.players.player1!.hand = ['card1', 'card2'];
      G.players.player2!.hand = ['card3', 'card4'];

      const result = dispatchEvent(G, 'player1', 'event14');

      expect(result.success).toBe(true);
      expect(result.logs).toContain('手牌最多玩家并列（2人），事件无效');
    });
  });
});

describe('executeEventCard', () => {
  let G: GameState;

  beforeEach(() => {
    G = createTestGameState();
  });

  it('从牌堆翻取并执行事件', () => {
    // 将事件加入牌堆
    G.piles.eventPile = ['event2'];

    const result = executeEventCard(G, { currentPlayerId: 'player1' });

    expect(result.success).toBe(true);
    expect(G.event.processed).toBe(true);
    expect(G.piles.discardPile).toContain('event2');
  });

  it('牌堆为空时返回失败', () => {
    const result = executeEventCard(G, { currentPlayerId: 'player1' });

    expect(result.success).toBe(false);
    expect(result.logs).toContain('事件牌堆为空');
  });
});
