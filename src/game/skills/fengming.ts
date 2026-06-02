/**
 * 仙剑逍遥游 - 凤鸣玉誓扩展角色技能
 * Phase 4：角色技能引擎
 *
 * 实现凤鸣玉誓扩展 6 个角色的技能：
 * - 姜云凡 (HL001)：狂龙迅影斩、山贼
 * - 唐雨柔 (HL002)：咏圣调、逆天阵
 * - 姜世离 (HL003)：魔君[!]、牺牲
 * - 魔翳 (HL004)：锁魂[!]、底牌[!]
 * - 湮世穹兵 (HL005)：侵略如火[!]、毁天灭地
 * - 欧阳慧 (HL014)：雷灵、雷屏[!]、雳天击
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
  modifyDexterity,
  getAliveTeammateIds,
  getAliveEnemyIds,
} from './effects';

// ==================== 姜云凡 (HL001) ====================

/**
 * 狂龙迅影斩
 * 弃置所有手牌，增加等量的TokenCount（上限8）
 */
const jiangYunfanSkill1: SkillDefinition = {
  id: 'hl001_skill1',
  name: '狂龙迅影斩',
  heroCode: 'XJ501',
  trigger: SkillTrigger.BATTLE_CARD_ANY,
  occurs: 'R*ZD',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否参战且手牌数>0
    const caster = G.players[ctx.playerId];
    return G.combat !== null && caster && caster.hand.length > 0;
  },
  effect: (G, ctx) => {
    // 弃置所有手牌，增加等量的TokenCount（上限8）
    const caster = G.players[ctx.playerId];
    if (!caster) return;

    const cardCount = Math.min(caster.hand.length, 8);
    const cardsToDiscard = caster.hand.splice(0, cardCount);
    discardCards(G, ctx.playerId, cardsToDiscard);

    // 实际需要修改游戏的TokenCount状态
  },
  priority: 10,
};

/**
 * 山贼
 * 翻牌，消耗所有TokenCount，团队获得积分
 */
const jiangYunfanSkill2: SkillDefinition = {
  id: 'hl001_skill2',
  name: '山贼',
  heroCode: 'XJ501',
  trigger: SkillTrigger.GLOBAL_DRAW,
  occurs: 'G1DI,!G1DI',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否参战且TokenCount>=2
    // 实际需要从游戏状态中读取TokenCount
    return G.combat !== null;
  },
  effect: (G, ctx) => {
    // 翻牌，消耗所有TokenCount，团队获得积分
    // 实际实现时需要根据翻牌结果计算积分
  },
  priority: 15,
};

// ==================== 唐雨柔 (HL002) ====================

/**
 * 咏圣调
 * 使用防牌JPT5
 */
const tangYurouSkill1: SkillDefinition = {
  id: 'hl002_skill1',
  name: '咏圣调',
  heroCode: 'XJ502',
  trigger: SkillTrigger.ALIAS_SPECIAL_USE,
  triggers: [SkillTrigger.ALIAS_SPECIAL_USE, SkillTrigger.ALIAS_ANY_CARD_USE],
  occurs: '%2,%4',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否存活且有队友
    const caster = G.players[ctx.playerId];
    const teammates = getAliveTeammateIds(G, caster?.team || 'A');
    return teammates.length > 0;
  },
  effect: (G, ctx) => {
    // 使用防牌JPT5（实际实现时需要执行防牌效果）
  },
  priority: 10,
};

/**
 * 逆天阵
 * 从已阵亡怪物中获取召唤兽，可变身
 */
const tangYurouSkill2: SkillDefinition = {
  id: 'hl002_skill2',
  name: '逆天阵',
  heroCode: 'XJ502',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  occurs: 'R#GR',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否存活且场上无其他存活队友
    const caster = G.players[ctx.playerId];
    const teammates = getAliveTeammateIds(G, caster?.team || 'A');
    return teammates.length === 0;
  },
  effect: (G, ctx) => {
    // 从已阵亡怪物中获取召唤兽，可变身
    // 实际实现时需要等待玩家选择
  },
  priority: 10,
};

// ==================== 姜世离 (HL003) ====================

/**
 * 魔君[!]
 * 受到伤害时，选择一名其他玩家转移伤害
 */
const jiangShiliSkill1: SkillDefinition = {
  id: 'hl003_skill1',
  name: '魔君',
  heroCode: 'XJ505',
  trigger: SkillTrigger.COMBAT_START_OTHER,
  triggers: [
    SkillTrigger.COMBAT_START_OTHER,
    SkillTrigger.GLOBAL_SUPPORT_HIT,
    SkillTrigger.GLOBAL_HP_DECREASE,
    SkillTrigger.HERO_LEAVE,
    SkillTrigger.HERO_ENTER,
    SkillTrigger.ON_FIELD_CHANGE,
  ],
  occurs: '!R$PD,!G1CH,!G1TH,!G0OS,!G0IS,!G0FI',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否受到伤害且伤害值<=手牌数
    // 实际需要根据伤害事件判断
    return true;
  },
  effect: (G, ctx) => {
    // 选择一名其他玩家转移伤害（实际实现时需要等待玩家选择）
  },
  priority: 20,
};

/**
 * 牺牲
 * 掷骰子，若非6则选择一名其他玩家：受2点伤害或弃置所有手牌
 */
const jiangShiliSkill2: SkillDefinition = {
  id: 'hl003_skill2',
  name: '牺牲',
  heroCode: 'XJ505',
  trigger: SkillTrigger.BATTLE_CARD_ANY,
  triggers: [SkillTrigger.BATTLE_CARD_ANY, SkillTrigger.COMBAT_END_PREP_ANY],
  occurs: 'R*ZD,!R*Z2',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否被选为目标
    // 实际需要根据游戏状态判断
    return true;
  },
  effect: (G, ctx) => {
    // 掷骰子，若非6则选择一名其他玩家
    const diceValue = ctx.random.Die(6);
    if (diceValue !== 6) {
      // 选择一名其他玩家（实际实现时需要等待玩家选择）
    }
  },
  priority: 15,
};

// ==================== 魔翳 (HL004) ====================

/**
 * 锁魂[!]
 * 弃置2张手牌，降低Monster1攻击力2点
 */
const moYiSkill1: SkillDefinition = {
  id: 'hl004_skill1',
  name: '锁魂',
  heroCode: 'XJ506',
  trigger: SkillTrigger.ON_DEATH,
  triggers: [
    SkillTrigger.ON_DEATH,
    SkillTrigger.COMBAT_START_ANY,
    SkillTrigger.ON_OBJECT_JOIN,
  ],
  occurs: '!G0ZW,!R*PD,!G0OJ',
  isForced: true,
  condition: (G, ctx) => {
    // 检查手牌>=2且属于当前回合方团队
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length < 2) return false;

    const rounder = G.players[G.currentPlayerId];
    return rounder && rounder.team === caster.team;
  },
  effect: (G, ctx) => {
    // 弃置2张手牌，降低Monster1攻击力2点
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length < 2) return;

    const cardsToDiscard = caster.hand.splice(0, 2);
    discardCards(G, ctx.playerId, cardsToDiscard);

    // 降低Monster1攻击力2点（实际需要修改怪物状态）
    if (G.combat) {
      const monster = G.monsterInstances[G.combat.monsterInstanceId];
      if (monster) {
        monster.currentStr = Math.max(0, monster.currentStr - 2);
      }
    }
  },
  priority: 25,
};

/**
 * 底牌[!]
 * 激活TokenAwake，标记+1tux，禁用战牌
 */
const moYiSkill2: SkillDefinition = {
  id: 'hl004_skill2',
  name: '底牌',
  heroCode: 'XJ506',
  trigger: SkillTrigger.ON_DEATH,
  occurs: '!G0ZW',
  isForced: true,
  condition: (G, ctx) => {
    // 始终可以发动
    return true;
  },
  effect: (G, ctx) => {
    // 激活TokenAwake，标记+1tux，禁用战牌
    // 实际需要修改游戏的Token状态
  },
  priority: 10,
};

// ==================== 湮世穹兵 (HL005) ====================

/**
 * 侵略如火[!]
 * 有队友持有装备或宠物时，弃置队友的宠物或装备以激活TokenAwake
 */
const yanShiQiongBingSkill1: SkillDefinition = {
  id: 'hl005_skill1',
  name: '侵略如火',
  heroCode: 'XJ507',
  trigger: SkillTrigger.COMBAT_START_SELF,
  occurs: '!R#Z1',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否有队友持有装备或宠物
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
          hero.equipment.special !== null ||
          hero.pet !== null)
      );
    });
  },
  effect: (G, ctx) => {
    // 弃置队友的宠物或装备以激活TokenAwake（实际实现时需要等待玩家选择）
  },
  priority: 15,
};

/**
 * 毁天灭地
 * 翻牌，标记目标并沉默之
 */
const yanShiQiongBingSkill2: SkillDefinition = {
  id: 'hl005_skill2',
  name: '毁天灭地',
  heroCode: 'XJ507',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  occurs: 'R#GR',
  isForced: false,
  condition: (G, ctx) => {
    // 检查手牌>0且存在可选目标
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return false;

    const enemies = getAliveEnemyIds(G, caster.team);
    return enemies.length > 0;
  },
  effect: (G, ctx) => {
    // 翻牌，标记目标并沉默之（实际实现时需要等待玩家选择）
  },
  priority: 10,
};

// ==================== 欧阳慧 (HL014) ====================

/**
 * 雷灵
 * 为所有战牌(ZP)添加价格限制（=1）
 */
const ouYangHuiSkill1: SkillDefinition = {
  id: 'hl014_skill1',
  name: '雷灵',
  heroCode: 'XJ508',
  trigger: SkillTrigger.COMBAT_END_PREP_ANY,
  triggers: [SkillTrigger.COMBAT_END_PREP_ANY, SkillTrigger.ON_OBJECT_JOIN],
  occurs: '?R*Z2,!G0OJ',
  isForced: false,
  condition: (G, ctx) => {
    // 始终可以发动
    return true;
  },
  effect: (G, ctx) => {
    // 为所有战牌(ZP)添加价格限制（=1）
    // 实际需要修改战牌的状态
  },
  priority: 10,
};

/**
 * 雷屏[!]
 * 将获得的宠物交给HP更高的队友，同时自身受到1点伤害
 */
const ouYangHuiSkill2: SkillDefinition = {
  id: 'hl014_skill2',
  name: '雷屏',
  heroCode: 'XJ508',
  trigger: SkillTrigger.ON_HP_DAMAGE,
  occurs: 'G0OH',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否为回合方且是收获宠物的执行者
    // 实际需要根据游戏状态判断
    return G.currentPlayerId === ctx.playerId;
  },
  effect: (G, ctx) => {
    // 将获得的宠物交给HP更高的队友，同时自身受到1点伤害
    // 实际实现时需要等待玩家选择
    dealDamage(G, ctx.playerId, 1);
  },
  priority: 15,
};

/**
 * 雳天击
 * 己方宠物总分>=30时激活TokenAwake，触发全局胜利判定
 */
const ouYangHuiSkill3: SkillDefinition = {
  id: 'hl014_skill3',
  name: '雳天击',
  heroCode: 'XJ508',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  occurs: 'R#GR',
  isForced: false,
  condition: (G, ctx) => {
    // 检查己方宠物总分是否>=30
    // 实际需要计算宠物总分
    return true;
  },
  effect: (G, ctx) => {
    // 激活TokenAwake，触发全局胜利判定
    // 实际需要修改游戏的Token状态和胜利条件
  },
  priority: 20,
};

// ==================== 导出所有凤鸣玉誓技能 ====================

export const fengmingSkills: SkillDefinition[] = [
  // 姜云凡
  jiangYunfanSkill1,
  jiangYunfanSkill2,
  // 唐雨柔
  tangYurouSkill1,
  tangYurouSkill2,
  // 姜世离
  jiangShiliSkill1,
  jiangShiliSkill2,
  // 魔翳
  moYiSkill1,
  moYiSkill2,
  // 湮世穹兵
  yanShiQiongBingSkill1,
  yanShiQiongBingSkill2,
  // 欧阳慧
  ouYangHuiSkill1,
  ouYangHuiSkill2,
  ouYangHuiSkill3,
];
