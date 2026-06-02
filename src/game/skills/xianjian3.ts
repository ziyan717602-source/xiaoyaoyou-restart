/**
 * 仙剑逍遥游 - 仙剑三+外传角色技能
 * Phase 4：角色技能引擎
 *
 * 实现仙剑三+外传 9 个角色的 23 个技能：
 * - 唐雪见 (XJ302)：追打、连击、好胜
 * - 龙葵(蓝) (XJ303)：朱砂变·红、熔铸、剑灵
 * - 龙葵鬼(红) (XJ304)：朱砂变·蓝、控剑、剑魂
 * - 紫萱 (XJ305)：关爱[!]、神圣[!]
 * - 重楼 (XJ306)：决斗、手下留情[!]、降临[!]
 * - 南宫煌 (X3W01)：占卜、摄灵法阵
 * - 温慧 (X3W02)：阵法[!]、蛮横
 * - 星璇 (X3W03)：烹饪、兄弟
 * - 王蓬絮 (X3W04)：饕餮、合成饰品[!]、敏感
 *
 * 核心规则：
 * - C# 源码是唯一真相
 * - 技能函数必须是纯函数，只能修改 G
 * - [!] 标记的技能在条件满足时自动触发
 */

import { GameState } from '../../shared/types/game';
import { SkillTrigger, Element } from '../../shared/types/enums';
import { SkillDefinition } from './types';
import {
  dealDamage,
  healTarget,
  drawCards,
  discardCards,
  modifyStrength,
  getAliveTeammateIds,
  getAliveEnemyIds,
} from './effects';

// ==================== 唐雪见 (XJ302) ====================

/**
 * 追打
 * 当有角色受到伤害时，弃置1张手牌，对所有受伤角色各造成1点伤害
 */
const tangXuejianSkill1: SkillDefinition = {
  id: 'xj302_skill1',
  name: '追打',
  heroCode: 'XJ302',
  trigger: SkillTrigger.GLOBAL_HP_DECREASE,
  isForced: false,
  occurs: 'G1TH',
  condition: (G, ctx) => {
    // 检查是否有手牌
    const caster = G.players[ctx.playerId];
    return caster && caster.hand.length > 0;
  },
  effect: (G, ctx) => {
    // 弃置1张手牌，对所有受伤角色各造成1点伤害
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return;

    // 弃置第一张手牌（实际实现时需要等待玩家选择）
    const cardToDiscard = caster.hand.splice(0, 1)[0];
    discardCards(G, ctx.playerId, [cardToDiscard]);

    // 对所有受伤角色各造成1点伤害
    // 实际需要根据fuse中的受伤角色列表
  },
  priority: 15,
};

/**
 * 连击
 * 弃置1张手牌，灵力+2
 */
const tangXuejianSkill2: SkillDefinition = {
  id: 'xj302_skill2',
  name: '连击',
  heroCode: 'XJ302',
  trigger: SkillTrigger.BATTLE_CARD_ANY,
  isForced: false,
  occurs: 'R*ZD',
  condition: (G, ctx) => {
    // 检查是否有手牌
    const caster = G.players[ctx.playerId];
    return caster && caster.hand.length > 0;
  },
  effect: (G, ctx) => {
    // 弃置1张手牌，灵力+2
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return;

    // 弃置第一张手牌（实际实现时需要等待玩家选择）
    const cardToDiscard = caster.hand.splice(0, 1)[0];
    discardCards(G, ctx.playerId, [cardToDiscard]);

    // 灵力+2
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (hero) {
      hero.currentStr += 2;
    }
  },
  priority: 10,
};

/**
 * 好胜
 * HP >= 2且参战时，对自身造成2点伤害，若存活则补2张牌
 */
const tangXuejianSkill3: SkillDefinition = {
  id: 'xj302_skill3',
  name: '好胜',
  heroCode: 'XJ302',
  trigger: SkillTrigger.BATTLE_CARD_ANY,
  isForced: false,
  occurs: 'R*ZD',
  condition: (G, ctx) => {
    // 检查HP >= 2
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero || hero.currentHp < 2) return false;

    // 检查是否参战
    return G.combat !== null;
  },
  effect: (G, ctx) => {
    // 对自身造成2点伤害
    dealDamage(G, ctx.playerId, 2);

    // 若存活则补2张牌
    const caster = G.players[ctx.playerId];
    if (caster && caster.isAlive) {
      drawCards(G, ctx.playerId, 2, ctx.random);
    }
  },
  priority: 20,
};

// ==================== 龙葵(蓝) (XJ303) ====================

/**
 * 变身 - 蓝转红
 * 切换形态，移除蓝葵技能，获得红葵技能
 */
const longKuiBlueSkill1: SkillDefinition = {
  id: 'xj303_skill1',
  name: '朱砂变·红',
  heroCode: 'XJ303',
  trigger: SkillTrigger.ROUND_START_SELF,
  isForced: false,
  occurs: 'R#ST',
  condition: (G, ctx) => {
    // 始终可以发动
    return true;
  },
  effect: (G, ctx) => {
    // 切换形态
    // 这里需要调用变身系统
  },
  priority: 50,
};

/**
 * 熔铸（天魔附体）
 * 受到1点伤害，然后使用锦帕牌替代当前锦帕效果
 */
const longKuiBlueSkill2: SkillDefinition = {
  id: 'xj303_skill2',
  name: '熔铸',
  heroCode: 'XJ303',
  trigger: SkillTrigger.ALIAS_TECH_POST,
  triggers: [SkillTrigger.ALIAS_TECH_POST, SkillTrigger.ON_TECH_USED],
  isForced: false,
  occurs: '%5,!G0CC',
  condition: (G, ctx) => {
    // 检查是否未处于"Melt"状态
    // 检查手中是否有锦帕牌
    const caster = G.players[ctx.playerId];
    return caster && caster.hand.length > 0;
  },
  effect: (G, ctx) => {
    // 受到1点伤害，然后使用锦帕牌替代当前锦帕效果
    dealDamage(G, ctx.playerId, 1);
  },
  priority: 15,
};

/**
 * 剑灵（飞鸟裂天）
 * 弃置1件装备，灵力+3
 */
const longKuiBlueSkill3: SkillDefinition = {
  id: 'xj303_skill3',
  name: '剑灵',
  heroCode: 'XJ303',
  trigger: SkillTrigger.BATTLE_CARD_ANY,
  isForced: false,
  occurs: 'R*ZD',
  condition: (G, ctx) => {
    // 检查是否有装备
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return false;

    return (
      hero.equipment.weapon !== null ||
      hero.equipment.armor !== null ||
      hero.equipment.special !== null
    );
  },
  effect: (G, ctx) => {
    // 弃置1件装备，灵力+3
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return;

    // 弃置武器（实际实现时需要等待玩家选择）
    if (hero.equipment.weapon) {
      const cardToDiscard = hero.equipment.weapon;
      hero.equipment.weapon = null;
      G.piles.discardPile.push(cardToDiscard);
    }

    // 灵力+3
    hero.currentStr += 3;
  },
  priority: 10,
};

// ==================== 龙葵鬼/红葵 (XJ304) ====================

/**
 * 变身 - 红转蓝
 * 切换形态，移除红葵技能，获得蓝葵技能
 */
const longKuiRedSkill1: SkillDefinition = {
  id: 'xj304_skill1',
  name: '朱砂变·蓝',
  heroCode: 'XJ304',
  trigger: SkillTrigger.ROUND_START_SELF,
  isForced: false,
  occurs: 'R#ST',
  condition: (G, ctx) => {
    // 始终可以发动
    return true;
  },
  effect: (G, ctx) => {
    // 切换形态
    // 这里需要调用变身系统
  },
  priority: 50,
};

/**
 * 控剑（鬼狱还神）
 * 从队友处获取1张装备牌
 */
const longKuiRedSkill2: SkillDefinition = {
  id: 'xj304_skill2',
  name: '控剑',
  heroCode: 'XJ304',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  isForced: false,
  occurs: 'R#GR',
  condition: (G, ctx) => {
    // 检查场上是否有其他存活的队友拥有装备
    const caster = G.players[ctx.playerId];
    const teammates = getAliveTeammateIds(G, caster?.team || 'A');
    return teammates.some(teammateId => {
      const teammate = G.players[teammateId];
      if (!teammate || teammateId === ctx.playerId) return false;

      const hero = G.heroInstances[teammate.heroInstanceId];
      return (
        hero &&
        (hero.equipment.weapon !== null ||
          hero.equipment.armor !== null ||
          hero.equipment.special !== null)
      );
    });
  },
  effect: (G, ctx) => {
    // 从队友处获取1张装备牌
    // 实际实现时需要等待玩家选择队友和装备
  },
  priority: 10,
};

/**
 * 剑魂（鬼降）
 * 弃置1件装备，对指定目标造成3点伤害
 */
const longKuiRedSkill3: SkillDefinition = {
  id: 'xj304_skill3',
  name: '剑魂',
  heroCode: 'XJ304',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  isForced: false,
  occurs: 'R#GR',
  condition: (G, ctx) => {
    // 检查是否有装备
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return false;

    return (
      hero.equipment.weapon !== null ||
      hero.equipment.armor !== null ||
      hero.equipment.special !== null
    );
  },
  effect: (G, ctx) => {
    // 弃置1件装备，对指定目标造成3点伤害
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return;

    // 弃置武器（实际实现时需要等待玩家选择）
    if (hero.equipment.weapon) {
      const cardToDiscard = hero.equipment.weapon;
      hero.equipment.weapon = null;
      G.piles.discardPile.push(cardToDiscard);
    }

    // 对指定目标造成3点伤害（实际实现时需要等待玩家选择目标）
  },
  priority: 10,
};

// ==================== 紫萱 (XJ305) ====================

/**
 * 关爱[!]
 * 队友获得宠物时，让1名队友获得2张补牌
 */
const ziXuanSkill1: SkillDefinition = {
  id: 'xj305_skill1',
  name: '关爱',
  heroCode: 'XJ305',
  trigger: SkillTrigger.PET_GAINED,
  isForced: true,
  occurs: '!G0HD',
  condition: (G, ctx) => {
    // 检查是否有队友获得宠物
    // 实际需要根据游戏状态判断
    return true;
  },
  effect: (G, ctx) => {
    // 让1名队友获得2张补牌
    const caster = G.players[ctx.playerId];
    const teammates = getAliveTeammateIds(G, caster?.team || 'A');
    if (teammates.length > 0) {
      // 选择第一个队友（实际实现时需要等待玩家选择）
      const targetId = teammates[0];
      drawCards(G, targetId, 2, ctx.random);
    }
  },
  priority: 15,
};

/**
 * 神圣[!]
 * 每只宠物使紫萱灵力+3
 */
const ziXuanSkill2: SkillDefinition = {
  id: 'xj305_skill2',
  name: '神圣',
  heroCode: 'XJ305',
  trigger: SkillTrigger.ON_PET_POWER,
  isForced: true,
  occurs: '!G0WB',
  condition: (G, ctx) => {
    // 检查是否拥有宠物
    const hero = G.heroInstances[ctx.heroInstanceId];
    return hero && hero.pet !== null;
  },
  effect: (G, ctx) => {
    // 每只宠物使紫萱灵力+3
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (hero && hero.pet) {
      hero.currentStr += 3;
    }
  },
  priority: 10,
};

// ==================== 重楼 (XJ306) ====================

/**
 * 决斗
 * 弃置N张手牌（N=决斗次数+1），选择1-2名目标进行决斗
 */
const chongLouSkill1: SkillDefinition = {
  id: 'xj306_skill1',
  name: '决斗',
  heroCode: 'XJ306',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  isForced: false,
  occurs: 'R#GR',
  condition: (G, ctx) => {
    // 检查场上是否有其他可选目标
    const caster = G.players[ctx.playerId];
    if (!caster) return false;
    const enemies = getAliveEnemyIds(G, caster.team);
    if (enemies.length === 0) return false;

    // 检查手牌数是否足够（实际需要根据决斗次数判断）
    return caster.hand.length >= 1;
  },
  effect: (G, ctx) => {
    // 弃置N张手牌，选择1-2名目标进行决斗
    const caster = G.players[ctx.playerId];
    if (!caster) return;

    // 弃置1张手牌（实际实现时需要根据决斗次数）
    const cardToDiscard = caster.hand.splice(0, 1)[0];
    discardCards(G, ctx.playerId, [cardToDiscard]);

    // 双方各掷骰子，点数大者对小者造成3点伤害
    const casterDice = ctx.random.Die(6);

    // 对敌方第一个角色造成伤害（简化处理）
    const enemies = getAliveEnemyIds(G, caster.team);
    if (enemies.length > 0) {
      const targetId = enemies[0];
      const target = G.players[targetId];
      if (target) {
        const targetDice = ctx.random.Die(6);
        if (casterDice >= targetDice) {
          // 重楼胜利，对目标造成3点伤害
          dealDamage(G, targetId, 3);
        } else {
          // 目标胜利，对重楼造成3点伤害
          dealDamage(G, ctx.playerId, 3);
        }
      }
    }
  },
  priority: 20,
};

/**
 * 手下留情[!]
 * 决斗伤害导致角色HP从>=2降到<1时，免疫死亡
 */
const chongLouSkill2: SkillDefinition = {
  id: 'xj306_skill2',
  name: '手下留情',
  heroCode: 'XJ306',
  trigger: SkillTrigger.ON_HP_DAMAGE,
  isForced: true,
  occurs: '!G0OH',
  condition: (G, ctx) => {
    // 检查是否因决斗死亡
    // 实际需要检查死亡原因是否为决斗
    return true;
  },
  effect: (G, ctx) => {
    // 免疫死亡效果
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (hero) {
      hero.currentHp = 1;
      hero.isAlive = true;
      const player = G.players[ctx.playerId];
      if (player) {
        player.isAlive = true;
      }
    }
  },
  priority: 100,
};

/**
 * 降临[!]
 * 对手回合开始时，灵力+2
 */
const chongLouSkill3: SkillDefinition = {
  id: 'xj306_skill3',
  name: '降临',
  heroCode: 'XJ306',
  trigger: SkillTrigger.COMBAT_START_OTHER,
  isForced: true,
  occurs: '!R$Z1',
  condition: (G, ctx) => {
    // 检查是否为对手回合
    const caster = G.players[ctx.playerId];
    const rounder = G.players[G.currentPlayerId];
    if (!caster || !rounder) return false;

    return rounder.team !== caster.team;
  },
  effect: (G, ctx) => {
    // 灵力+2
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (hero) {
      hero.currentStr += 2;
    }
  },
  priority: 10,
};

// ==================== 南宫煌 (X3W01) ====================

/**
 * 占卜
 * 弃置1张手牌，翻看怪物牌
 */
const nanGongHuangSkill1: SkillDefinition = {
  id: 'x3w01_skill1',
  name: '占卜',
  heroCode: 'X3W01',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  isForced: false,
  occurs: 'R#GR',
  condition: (G, ctx) => {
    // 检查是否有手牌且怪物牌堆>=3张
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return false;

    return G.piles.monsterPile.length >= 3;
  },
  effect: (G, ctx) => {
    // 弃置1张手牌，翻看怪物牌
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return;

    // 弃置第一张手牌（实际实现时需要等待玩家选择）
    const cardToDiscard = caster.hand.splice(0, 1)[0];
    discardCards(G, ctx.playerId, [cardToDiscard]);

    // 翻看怪物牌堆顶3张（存储在RAM中供后续查看）
    if (!caster.rfm) caster.rfm = {};
    caster.rfm.monsterPeek = G.piles.monsterPile.slice(0, 3);
  },
  priority: 10,
};

/**
 * 摄灵法阵
 * 获得奖赏宠物时，若敌方有同五行宠物，可选择弃置敌方宠物
 */
const nanGongHuangSkill2: SkillDefinition = {
  id: 'x3w01_skill2',
  name: '摄灵法阵',
  heroCode: 'X3W01',
  trigger: SkillTrigger.PET_GAINED,
  isForced: true,
  occurs: '!G0HD',
  condition: (G, ctx) => {
    // 检查是否获得奖赏宠物
    // 实际需要根据游戏状态判断
    return true;
  },
  effect: (G, ctx) => {
    // 若敌方有同五行宠物，可选择弃置敌方宠物
    // 实际实现时需要等待玩家选择
  },
  priority: 15,
};

// ==================== 温慧 (X3W02) ====================

/**
 * 阵法[!]
 * 支援成功时，灵力+3
 */
const wenHuiSkill1: SkillDefinition = {
  id: 'x3w02_skill1',
  name: '阵法',
  heroCode: 'X3W02',
  trigger: SkillTrigger.BATTLE_CARD_CONFIRM_SELF,
  triggers: [SkillTrigger.BATTLE_CARD_CONFIRM_SELF, SkillTrigger.ON_HIT_CHECK],
  isForced: true,
  occurs: '!R#ZC,!G09P',
  condition: (G, ctx) => {
    // 检查是否支援成功
    // 实际需要根据游戏状态判断
    return G.combat !== null;
  },
  effect: (G, ctx) => {
    // 灵力+3
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (hero) {
      hero.currentStr += 3;
    }
  },
  priority: 20,
};

/**
 * 蛮横
 * 战斗失败时，对指定目标造成2点伤害
 */
const wenHuiSkill2: SkillDefinition = {
  id: 'x3w02_skill2',
  name: '蛮横',
  heroCode: 'X3W02',
  trigger: SkillTrigger.COMBAT_FAIL_SELF,
  isForced: false,
  occurs: 'R#VS',
  condition: (G, ctx) => {
    // 检查战斗是否失败
    if (!G.combat || G.combat.result !== 'LOSE') return false;

    // 检查场上是否有其他可选目标
    const caster = G.players[ctx.playerId];
    const enemies = getAliveEnemyIds(G, caster?.team || 'A');
    return enemies.length > 0;
  },
  effect: (G, ctx) => {
    // 对指定目标造成2点伤害
    // 实际实现时需要等待玩家选择目标
  },
  priority: 25,
};

// ==================== 星璇 (X3W03) ====================

/**
 * 烹饪
 * 弃置2张手牌，当作TP02使用
 */
const xingXuanSkill1: SkillDefinition = {
  id: 'x3w03_skill1',
  name: '烹饪',
  heroCode: 'X3W03',
  trigger: SkillTrigger.CARD_LINGHU,
  isForced: false,
  occurs: '&TP02&0,&TP02&1',
  condition: (G, ctx) => {
    // 检查是否有至少2张手牌
    const caster = G.players[ctx.playerId];
    return caster && caster.hand.length >= 2;
  },
  effect: (G, ctx) => {
    // 弃置2张手牌，当作TP02使用（灵葫仙丹：自己HP+2）
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length < 2) return;

    // 弃置前2张手牌（实际实现时需要等待玩家选择）
    const cardsToDiscard = caster.hand.splice(0, 2);
    discardCards(G, ctx.playerId, cardsToDiscard);

    // 执行灵葫仙丹效果：自己HP+2
    healTarget(G, ctx.playerId, 2);
  },
  priority: 10,
};

/**
 * 兄弟
 * 获取所有同队有牌队友的手牌，然后分发给队友
 */
const xingXuanSkill2: SkillDefinition = {
  id: 'x3w03_skill2',
  name: '兄弟',
  heroCode: 'X3W03',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  isForced: false,
  occurs: 'R#GR',
  condition: (G, ctx) => {
    // 检查是否有同队存活且手中有牌的其他玩家
    const caster = G.players[ctx.playerId];
    const teammates = getAliveTeammateIds(G, caster?.team || 'A');
    return teammates.some(teammateId => {
      const teammate = G.players[teammateId];
      return teammate && teammateId !== ctx.playerId && teammate.hand.length > 0;
    });
  },
  effect: (G, ctx) => {
    // 获取所有同队有牌队友的手牌，然后分发给队友
    const caster = G.players[ctx.playerId];
    if (!caster) return;

    const teammates = getAliveTeammateIds(G, caster.team);
    const allCards: string[] = [];

    // 收集所有队友的手牌
    for (const teammateId of teammates) {
      if (teammateId === ctx.playerId) continue;
      const teammate = G.players[teammateId];
      if (teammate && teammate.hand.length > 0) {
        allCards.push(...teammate.hand);
        teammate.hand = [];
      }
    }

    // 将收集的手牌平均分发给队友（包括自己）
    if (allCards.length > 0) {
      const allMembers = [ctx.playerId, ...teammates.filter(id => id !== ctx.playerId)];
      const cardsPerMember = Math.floor(allCards.length / allMembers.length);
      let cardIndex = 0;

      for (const memberId of allMembers) {
        const member = G.players[memberId];
        if (member) {
          const cardsToAdd = allCards.slice(cardIndex, cardIndex + cardsPerMember);
          member.hand.push(...cardsToAdd);
          cardIndex += cardsPerMember;
        }
      }
    }
  },
  priority: 10,
};

// ==================== 王蓬絮 (X3W04) ====================

/**
 * 饕餮
 * 弃置1张卡牌，治愈自己2点HP
 */
const wangPengxuSkill1: SkillDefinition = {
  id: 'x3w04_skill1',
  name: '饕餮',
  heroCode: 'X3W04',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  isForced: false,
  occurs: 'R#GR',
  condition: (G, ctx) => {
    // 检查是否有卡牌
    const caster = G.players[ctx.playerId];
    return caster && caster.hand.length > 0;
  },
  effect: (G, ctx) => {
    // 弃置1张卡牌，治愈自己2点HP
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return;

    // 弃置第一张手牌（实际实现时需要等待玩家选择）
    const cardToDiscard = caster.hand.splice(0, 1)[0];
    discardCards(G, ctx.playerId, [cardToDiscard]);

    // 治愈自己2点HP
    healTarget(G, ctx.playerId, 2);
  },
  priority: 10,
};

/**
 * 合成饰品[!]
 * 将手牌装备为额外卡
 */
const wangPengxuSkill2: SkillDefinition = {
  id: 'x3w04_skill2',
  name: '合成饰品',
  heroCode: 'X3W04',
  trigger: SkillTrigger.ON_ACCESSORY_EQUIP,
  triggers: [SkillTrigger.ON_ACCESSORY_EQUIP, SkillTrigger.ON_ITEM_LEAVE],
  isForced: true,
  occurs: '!G0ZB,!G0OT',
  condition: (G, ctx) => {
    // 检查额外卡槽是否未满5个且手中有牌
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return false;

    // 实际需要检查额外卡槽数量
    return true;
  },
  effect: (G, ctx) => {
    // 将选中的手牌装备为额外卡
    // 实际实现时需要等待玩家选择
  },
  priority: 15,
};

/**
 * 敏感
 * 额外卡装备时灵力+1，额外卡被弃置时灵力-1
 */
const wangPengxuSkill3: SkillDefinition = {
  id: 'x3w04_skill3',
  name: '敏感',
  heroCode: 'X3W04',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  triggers: [
    SkillTrigger.SKILL_PHASE_SELF,
    SkillTrigger.COMBAT_START_ANY,
    SkillTrigger.BATTLE_CARD_ANY,
    SkillTrigger.ON_DISCARD_CHECK,
    SkillTrigger.GLOBAL_EVENT_PHASE,
    SkillTrigger.BATTLE_RESULT_ANY,
    SkillTrigger.ON_CARD_PLAYED,
    SkillTrigger.ON_HP_DAMAGE,
  ],
  isForced: false,
  occurs: 'R#GR,R*Z1,R*ZD,G0QR,G1EV,R*ZN,G0CD,G0OH',
  condition: (G, ctx) => {
    // 检查是否为额外卡装备事件
    // 实际需要根据游戏状态判断
    return true;
  },
  effect: (G, ctx) => {
    // 额外卡装备时灵力+1
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (hero) {
      hero.currentStr += 1;
    }
  },
  priority: 10,
};

// ==================== 导出所有仙剑三+外传技能 ====================

export const xianjian3Skills: SkillDefinition[] = [
  // 唐雪见
  tangXuejianSkill1,
  tangXuejianSkill2,
  tangXuejianSkill3,
  // 龙葵(蓝)
  longKuiBlueSkill1,
  longKuiBlueSkill2,
  longKuiBlueSkill3,
  // 龙葵鬼(红)
  longKuiRedSkill1,
  longKuiRedSkill2,
  longKuiRedSkill3,
  // 紫萱
  ziXuanSkill1,
  ziXuanSkill2,
  // 重楼
  chongLouSkill1,
  chongLouSkill2,
  chongLouSkill3,
  // 南宫煌
  nanGongHuangSkill1,
  nanGongHuangSkill2,
  // 温慧
  wenHuiSkill1,
  wenHuiSkill2,
  // 星璇
  xingXuanSkill1,
  xingXuanSkill2,
  // 王蓬絮
  wangPengxuSkill1,
  wangPengxuSkill2,
  wangPengxuSkill3,
];
