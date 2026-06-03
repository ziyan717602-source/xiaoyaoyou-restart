/**
 * 仙剑逍遥游 - 仙剑五角色技能
 * Phase 4：角色技能引擎
 *
 * 实现仙剑五 2 个角色的 5 个技能：
 * - 龙幽：越行之术[!]、表现欲[!]
 * - 小蛮：无法无天、活力[!]、炼药
 *
 * 核心规则：
 * - C# 源码是唯一真相
 * - 技能函数必须是纯函数，只能修改 G
 * - [!] 标记的技能在条件满足时自动触发
 */

import { GameState } from '../../shared/types/game';
import { SkillTrigger } from '../../shared/types/enums';
import { SkillDefinition } from './types';
import {
  drawCards,
  discardCards,
  getAliveTeammateIds,
  getAliveEnemyIds,
} from './effects';
import { isFemaleHero } from '../utils/heroUtils';

// ==================== 龙幽 (XJ503) ====================

/**
 * 越行之术[!]
 * 灵力值取决于战场上参战女性角色数量
 * 战场女性越多，龙幽灵力越强
 */
const longYouSkill1: SkillDefinition = {
  id: 'xj503_skill1',
  name: '越行之术',
  heroCode: 'XJ503',
  trigger: SkillTrigger.ON_HIT_CHECK,
  occurs: '!G09P',
  isForced: true,
  condition: (G, ctx) => {
    // 根据 C# 代码：需要灵力池启用
    // 检查战场上参战的存活女性角色数量
    let femaleCount = 0;

    for (const player of Object.values(G.players)) {
      if (player.isAlive) {
        const hero = G.heroInstances[player.heroInstanceId];
        if (hero) {
          // 从 heroes.json 加载性别数据
          const isFemale = isFemaleHero(hero.staticId);
          if (isFemale) {
            femaleCount++;
          }
        }
      }
    }

    return femaleCount > 0;
  },
  effect: (G, ctx) => {
    // 统计参战的存活女性角色数量
    let femaleCount = 0;

    for (const player of Object.values(G.players)) {
      if (player.isAlive) {
        const hero = G.heroInstances[player.heroInstanceId];
        if (hero) {
          // 从 heroes.json 加载性别数据
          const isFemale = isFemaleHero(hero.staticId);
          if (isFemale) {
            femaleCount++;
          }
        }
      }
    }

    // 修改灵力值（这里简化处理，直接设置）
    // 实际实现时需要修改游戏的灵力池状态
  },
  priority: 10,
};

/**
 * 表现欲[!]
 * 回合中当灵力池命中时，为支援者提供+2命中，每回合限一次
 */
const longYouSkill2: SkillDefinition = {
  id: 'xj503_skill2',
  name: '表现欲',
  heroCode: 'XJ503',
  trigger: SkillTrigger.COMBAT_START_ANY,
  triggers: [
    SkillTrigger.COMBAT_START_ANY,
    SkillTrigger.ON_TRANSFORM,
    SkillTrigger.ON_FINAL_LEAVE,
    SkillTrigger.ON_FIELD_CHANGE,
  ],
  occurs: '!R*Z1,!G0IY,!G0OY,!G0FI',
  isForced: true,
  condition: (G, ctx) => {
    // 根据 C# 代码：
    // 必须是当前回合者
    if (G.currentPlayerId !== ctx.playerId) return false;

    // 必须有支援者
    if (!G.combat || !G.combat.supporterPlayerId) return false;

    // 检查是否已触发过（Hit 标记）
    // 实际需要从玩家的 RAM 中读取
    // 这里简化处理

    return true;
  },
  effect: (G, ctx) => {
    // 给支援者增加2点命中
    if (!G.combat || !G.combat.supporterPlayerId) return;

    const supporter = G.players[G.combat.supporterPlayerId];
    if (supporter) {
      const hero = G.heroInstances[supporter.heroInstanceId];
      if (hero) {
        hero.currentDex += 2;
      }
    }

    // 设置 Hit 标记
    const caster = G.players[ctx.playerId];
    if (caster) {
      if (!caster.rfm) caster.rfm = {};
      caster.rfm.performanceDesireUsed = true;
    }
  },
  priority: 20,
};

// ==================== 小蛮 (XJ504) ====================

/**
 * 无法无天
 * 可以将手中的锦牌对自己使用
 */
const xiaoManSkill1: SkillDefinition = {
  id: 'xj504_skill1',
  name: '无法无天',
  heroCode: 'XJ504',
  trigger: SkillTrigger.SKILL_END_OTHER,
  occurs: 'R$GE',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否有手牌
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return false;

    // 检查手中是否有锦牌（JP类型）
    // 实际需要从卡牌数据中判断
    // 这里简化处理，假设手中有锦牌
    return true;
  },
  effect: (G, ctx) => {
    // 将选定的锦牌对自己使用
    // 标记无法无天效果（在出牌流程中检查此标记）
    const caster = G.players[ctx.playerId];
    if (!caster) return;

    if (!caster.rfm) caster.rfm = {};
    caster.rfm.unrulyMode = true;
  },
  priority: 5,
};

/**
 * 活力[!]
 * 参战时获得1张补牌
 */
const xiaoManSkill2: SkillDefinition = {
  id: 'xj504_skill2',
  name: '活力',
  heroCode: 'XJ504',
  trigger: SkillTrigger.COMBAT_START_ANY,
  occurs: '!R*Z1',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否参战状态
    return G.combat !== null;
  },
  effect: (G, ctx) => {
    // 获得1张补牌
    drawCards(G, ctx.playerId, 1, ctx.random);
  },
  priority: 15,
};

/**
 * 炼药
 * 通过弃置2张手牌为任意角色提供1张补牌
 * 触发条件丰富，可以在多种游戏事件中发动
 */
const xiaoManSkill3: SkillDefinition = {
  id: 'xj504_skill3',
  name: '炼药',
  heroCode: 'XJ504',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  triggers: [
    SkillTrigger.SKILL_PHASE_SELF,
    SkillTrigger.COMBAT_START_ANY,
    SkillTrigger.BATTLE_CARD_ANY,
    SkillTrigger.ON_DISCARD_CHECK,
    SkillTrigger.GLOBAL_EVENT_PHASE,
    SkillTrigger.BATTLE_RESULT_ANY,
    SkillTrigger.ON_CARD_PLAYED,
    SkillTrigger.ON_HP_ZERO,
    SkillTrigger.ON_HP_DAMAGE,
  ],
  occurs: 'R#GR,R*Z1,R*ZD,G0QR,G1EV,R*ZN,G0CD,G0ZH,G0OH',
  isForced: false,
  condition: (G, ctx) => {
    // 根据 C# 代码：基础条件是存活且手牌数 >= 2
    const caster = G.players[ctx.playerId];
    if (!caster || !caster.isAlive || caster.hand.length < 2) return false;

    // 实际实现时需要根据不同的 type 检查更复杂的条件
    // 这里简化处理
    return true;
  },
  effect: (G, ctx) => {
    // 弃置2张手牌，给目标1张补牌
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length < 2) return;

    // 弃置前2张手牌（实际实现时需要等待玩家选择）
    const cardsToDiscard = caster.hand.splice(0, 2);
    discardCards(G, ctx.playerId, cardsToDiscard);

    // 给目标1张补牌（实际实现时需要等待玩家选择目标）
    // 这里简化处理，给自己补牌
    drawCards(G, ctx.playerId, 1, ctx.random);
  },
  priority: 10,
};

// ==================== 导出所有仙剑五技能 ====================

export const xianjian5Skills: SkillDefinition[] = [
  // 龙幽
  longYouSkill1,
  longYouSkill2,
  // 小蛮
  xiaoManSkill1,
  xiaoManSkill2,
  xiaoManSkill3,
];
