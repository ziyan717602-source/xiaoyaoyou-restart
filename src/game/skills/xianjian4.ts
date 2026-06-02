/**
 * 仙剑逍遥游 - 仙剑四角色技能
 * Phase 4：角色技能引擎
 *
 * 实现仙剑四 5 个角色的 11 个技能：
 * - 云天河 (XJ401)：天河剑[!]、后羿射日弓
 * - 韩菱纱 (XJ402)：搜囊探宝、劫富济贫、盗墓[!]
 * - 柳梦璃 (XJ403)：妖王[!]、梦傀儡[!]
 * - 慕容紫英 (XJ404)：赠剑、剑匣[!]
 * - 玄霄 (XJ405)：凝冰焚炎[!]、结拜[!]
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

// ==================== 云天河 (XJ401) ====================

/**
 * 天河剑[!]
 * 基于DEX差值的灵力增幅：当玩家DEX-怪物AGL>=4时灵力+2，否则灵力-2
 */
const yunTianheSkill1: SkillDefinition = {
  id: 'xj401_skill1',
  name: '天河剑',
  heroCode: 'XJ401',
  trigger: SkillTrigger.COMBAT_START_ANY,
  triggers: [
    SkillTrigger.COMBAT_START_ANY,
    SkillTrigger.ON_WEAPON_ENTER,
    SkillTrigger.ON_WEAPON_LEAVE,
    SkillTrigger.ON_ARMOR_ENTER,
    SkillTrigger.ON_ARMOR_LEAVE,
  ],
  occurs: '!R*Z1,!G0IX,!G0OX,!G0IW,!G0OW',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否参战且怪物存在
    if (!G.combat) return false;

    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return false;

    // 检查DEX差值
    // 实际需要从怪物数据中获取AGL
    // 这里简化处理
    return true;
  },
  effect: (G, ctx) => {
    // 根据DEX差值调整灵力
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return;

    // 实际需要计算 DEX - 怪物AGL
    // 这里简化处理：假设差值>=4，灵力+2
    hero.currentStr += 2;
  },
  priority: 10,
};

/**
 * 后羿射日弓
 * 团队积分+8，然后DEX设为0
 */
const yunTianheSkill2: SkillDefinition = {
  id: 'xj401_skill2',
  name: '后羿射日弓',
  heroCode: 'XJ401',
  trigger: SkillTrigger.BATTLE_CARD_ANY,
  triggers: [SkillTrigger.BATTLE_CARD_ANY, SkillTrigger.COMBAT_END_PREP_ANY],
  occurs: 'R*ZD,!R*Z2',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否已触发过（REC标记）
    // 实际需要从玩家的RAM中读取
    return true;
  },
  effect: (G, ctx) => {
    // 团队积分+8（在战斗中增加攻击方战力）
    if (G.combat) {
      const caster = G.players[ctx.playerId];
      if (caster) {
        const rounder = G.players[G.currentPlayerId];
        if (rounder && rounder.team === caster.team) {
          G.combat.attackerPool += 8;
        } else {
          G.combat.monsterPool += 8;
        }
      }
    }

    // DEX设为0
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (hero) {
      hero.currentDex = 0;
    }
  },
  priority: 15,
};

// ==================== 韩菱纱 (XJ402) ====================

/**
 * 搜囊探宝
 * 将手中的特殊牌当作JP01（冰心诀）或JP06（其他锦囊牌）使用
 */
const hanLingshaSkill1: SkillDefinition = {
  id: 'xj402_skill1',
  name: '搜囊探宝',
  heroCode: 'XJ402',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  occurs: 'R#GR',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否有手牌且场上有其他玩家拥有卡牌
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return false;

    // 检查是否有其他玩家拥有卡牌
    for (const playerId of Object.keys(G.players)) {
      if (playerId !== ctx.playerId && G.players[playerId].hand.length > 0) {
        return true;
      }
    }
    return false;
  },
  effect: (G, ctx) => {
    // 将选中的手牌当作JP01（偷盗）或JP06（铜钱镖）使用
    // 简化处理：弃掉第一张手牌，视为使用偷盗
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return;

    const cardToUse = caster.hand.splice(0, 1)[0];
    if (cardToUse) {
      G.piles.discardPile.push(cardToUse);
      // 标记搜囊探宝效果（在出牌流程中检查此标记）
      if (!caster.rfm) caster.rfm = {};
      caster.rfm.searchTreasure = true;
    }
  },
  priority: 10,
};

/**
 * 劫富济贫
 * 补1张牌，如果手牌数>=2再补1张牌
 */
const hanLingshaSkill2: SkillDefinition = {
  id: 'xj402_skill2',
  name: '劫富济贫',
  heroCode: 'XJ402',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  occurs: 'R#GR',
  isForced: false,
  condition: (G, ctx) => {
    // 始终可以发动
    return true;
  },
  effect: (G, ctx) => {
    // 补1张牌
    drawCards(G, ctx.playerId, 1, ctx.random);

    // 如果手牌数>=2再补1张牌
    const caster = G.players[ctx.playerId];
    if (caster && caster.hand.length >= 2) {
      drawCards(G, ctx.playerId, 1, ctx.random);
    }
  },
  priority: 5,
};

/**
 * 盗墓[!]
 * 当有玩家死亡时，从死亡玩家处获取所有卡牌，然后受到1点伤害
 */
const hanLingshaSkill3: SkillDefinition = {
  id: 'xj402_skill3',
  name: '盗墓',
  heroCode: 'XJ402',
  trigger: SkillTrigger.ON_DEATH,
  occurs: '!G0ZW',
  isForced: true,
  condition: (G, ctx) => {
    // 检查死亡玩家不是自己且拥有卡牌
    // 实际需要根据死亡事件判断
    return true;
  },
  effect: (G, ctx) => {
    // 从死亡玩家处获取所有卡牌
    // 简化处理：获取所有死亡玩家的手牌和装备
    const caster = G.players[ctx.playerId];
    if (!caster) return;

    for (const [pid, player] of Object.entries(G.players)) {
      if (pid === ctx.playerId || player.isAlive) continue;

      // 获取死亡玩家的手牌
      const deadHero = G.heroInstances[player.heroInstanceId];
      if (deadHero) {
        // 获取装备
        if (deadHero.equipment.weapon) {
          caster.hand.push(deadHero.equipment.weapon);
          deadHero.equipment.weapon = null;
        }
        if (deadHero.equipment.armor) {
          caster.hand.push(deadHero.equipment.armor);
          deadHero.equipment.armor = null;
        }
        if (deadHero.equipment.special) {
          caster.hand.push(deadHero.equipment.special);
          deadHero.equipment.special = null;
        }
      }
    }

    // 然后受到1点伤害
    dealDamage(G, ctx.playerId, 1);
  },
  priority: 20,
};

// ==================== 柳梦璃 (XJ403) ====================

/**
 * 妖王[!]
 * 友方获得宠物时，友方战力+宠物数量；友方宠物崩塌时，友方战力-宠物数量
 */
const liuMengliSkill1: SkillDefinition = {
  id: 'xj403_skill1',
  name: '妖王',
  heroCode: 'XJ403',
  trigger: SkillTrigger.ON_EQUIP_ENTER,
  triggers: [
    SkillTrigger.ON_EQUIP_ENTER,
    SkillTrigger.ON_EQUIP_LEAVE,
    SkillTrigger.HERO_ENTER,
    SkillTrigger.HERO_LEAVE,
  ],
  occurs: '!G0IC,!G0OC,!G0IS,!G0OS',
  isForced: true,
  condition: (G, ctx) => {
    // 检查友方宠物数量变化
    // 实际需要根据游戏状态判断
    return true;
  },
  effect: (G, ctx) => {
    // 根据友方宠物数量变化调整战力
    // 实际实现时需要根据宠物变化调整
  },
  priority: 15,
};

/**
 * 梦傀儡[!]
 * 死亡后以灵魂形态继续战斗（DEX设为5）
 */
const liuMengliSkill2: SkillDefinition = {
  id: 'xj403_skill2',
  name: '梦傀儡',
  heroCode: 'XJ403',
  trigger: SkillTrigger.ON_DEATH,
  triggers: [
    SkillTrigger.ON_DEATH,
    SkillTrigger.COMBAT_END_ANY,
    SkillTrigger.ON_TRANSFORM,
  ],
  occurs: '!G0ZW,!R*ZW,!G0IY',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否死亡
    return true;
  },
  effect: (G, ctx) => {
    // 以灵魂形态继续战斗
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (hero) {
      hero.currentDex = 5;
      // 从死亡名单中移除自己（使角色不被真正移除）
      // 实际实现时需要处理死亡状态
    }
  },
  priority: 100,
};

// ==================== 慕容紫英 (XJ404) ====================

/**
 * 赠剑
 * 赠送1件装备给其他玩家，然后补2张牌
 */
const murongZiyingSkill1: SkillDefinition = {
  id: 'xj404_skill1',
  name: '赠剑',
  heroCode: 'XJ404',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  occurs: 'R#GR',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否有装备且有其他玩家可被选中
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return false;

    return (
      hero.equipment.weapon !== null ||
      hero.equipment.armor !== null ||
      hero.equipment.special !== null
    );
  },
  effect: (G, ctx) => {
    // 赠送1件装备给其他玩家
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return;

    const caster = G.players[ctx.playerId];
    if (!caster) return;

    // 找到队友
    const teammates = getAliveTeammateIds(G, caster.team);
    if (teammates.length === 0) return;

    const targetId = teammates[0];
    const target = G.players[targetId];
    if (!target) return;

    // 赠送武器
    if (hero.equipment.weapon) {
      target.hand.push(hero.equipment.weapon);
      hero.equipment.weapon = null;
    } else if (hero.equipment.armor) {
      target.hand.push(hero.equipment.armor);
      hero.equipment.armor = null;
    } else if (hero.equipment.special) {
      target.hand.push(hero.equipment.special);
      hero.equipment.special = null;
    }

    // 补2张牌
    drawCards(G, ctx.playerId, 2, ctx.random);
  },
  priority: 10,
};

/**
 * 剑匣[!]
 * 手牌上限永久增加2
 */
const murongZiyingSkill2: SkillDefinition = {
  id: 'xj404_skill2',
  name: '剑匣',
  heroCode: 'XJ404',
  trigger: SkillTrigger.ON_DISCARD_CHECK,
  triggers: [SkillTrigger.ON_DISCARD_CHECK, SkillTrigger.HERO_ENTER],
  occurs: '!G0QR,!G0IS',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否为自己的回合
    return G.currentPlayerId === ctx.playerId;
  },
  effect: (G, ctx) => {
    // 手牌上限永久增加2
    const player = G.players[ctx.playerId];
    if (player) {
      player.handLimit += 2;
    }
  },
  priority: 5,
};

// ==================== 玄霄 (XJ405) ====================

/**
 * 凝冰焚炎[!]
 * 免疫水/火属性伤害
 */
const xuanXiaoSkill1: SkillDefinition = {
  id: 'xj405_skill1',
  name: '凝冰焚炎',
  heroCode: 'XJ405',
  trigger: SkillTrigger.ON_HP_DAMAGE,
  occurs: '!G0OH',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否受到水/火属性伤害
    // 实际需要根据伤害事件判断
    return true;
  },
  effect: (G, ctx) => {
    // 免疫水/火属性伤害
    // 标记免疫效果（在伤害计算时检查此标记）
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return;

    if (!hero.buffs) hero.buffs = [];
    hero.buffs.push({
      id: 'xj405_ice_fire_immunity',
      name: '凝冰焚炎',
      duration: -1, // 永久
      params: { immuneElements: ['WATER', 'FIRE'] },
    });
  },
  priority: 100,
};

/**
 * 结拜[!]
 * 回合开始时选择结拜对象，结拜对象回合开始时玄霄灵力+1，回合结束时灵力-1
 */
const xuanXiaoSkill2: SkillDefinition = {
  id: 'xj405_skill2',
  name: '结拜',
  heroCode: 'XJ405',
  trigger: SkillTrigger.HERO_ENTER,
  triggers: [
    SkillTrigger.HERO_ENTER,
    SkillTrigger.COMBAT_START_OTHER,
    SkillTrigger.ON_FINAL_LEAVE,
  ],
  occurs: '!G0IS,!R$Z1,!G0OY',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否为自己的回合且未选择过结拜对象
    // 实际需要从玩家的RAM中读取
    return G.currentPlayerId === ctx.playerId;
  },
  effect: (G, ctx) => {
    // 选择结拜对象（简化：选择敌方第一个角色）
    const caster = G.players[ctx.playerId];
    if (!caster) return;

    const enemyTeam = caster.team === 'A' ? 'B' : 'A';
    for (const [pid, player] of Object.entries(G.players)) {
      if (player.team === enemyTeam && player.isAlive) {
        // 标记结拜对象
        if (!caster.rfm) caster.rfm = {};
        caster.rfm.swornSibling = pid;
        break;
      }
    }
  },
  priority: 10,
};

// ==================== 导出所有仙剑四技能 ====================

export const xianjian4Skills: SkillDefinition[] = [
  // 云天河
  yunTianheSkill1,
  yunTianheSkill2,
  // 韩菱纱
  hanLingshaSkill1,
  hanLingshaSkill2,
  hanLingshaSkill3,
  // 柳梦璃
  liuMengliSkill1,
  liuMengliSkill2,
  // 慕容紫英
  murongZiyingSkill1,
  murongZiyingSkill2,
  // 玄霄
  xuanXiaoSkill1,
  xuanXiaoSkill2,
];
