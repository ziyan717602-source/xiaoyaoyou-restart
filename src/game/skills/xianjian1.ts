/**
 * 仙剑逍遥游 - 仙剑一角色技能
 * Phase 4：角色技能引擎
 *
 * 实现仙剑一 7 个角色的 14 个技能：
 * - 李逍遥：侠骨柔肠[!]、飞龙探云手[!]
 * - 赵灵儿：双剑、梦蛇[!]
 * - 赵灵儿·梦蛇：双剑、女娲[!]、变身[!]
 * - 林月如：林家剑法[!]、嫉恶如仇[!]
 * - 阿奴：鬼灵精、万蛊蚀天[!]
 * - 酒剑仙：御剑术[!]、醉仙望月步
 * - 拜月教主：水魔兽合体[!]、召唤水魔兽
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
  immobilizeTarget,
  getAliveTeammateIds,
  getAliveEnemyIds,
} from './effects';
import { isFemaleHero, isMaleHero } from '../utils/heroUtils';
import { executeTransform } from '../engine/transform';

// ==================== 李逍遥 (XJ101) ====================

/**
 * 侠骨柔肠[!]
 * 当前回合角色是女性且同队 → 给回合角色+1命中
 */
const liXiaoyaoSkill1: SkillDefinition = {
  id: 'xj101_skill1',
  name: '侠骨柔肠',
  heroCode: 'XJ101',
  trigger: SkillTrigger.COMBAT_START_OTHER,
  occurs: '!R$Z1',
  isForced: true,
  condition: (G, ctx) => {
    // 检查当前回合角色是否为女性且同队
    const rounder = G.players[G.currentPlayerId];
    if (!rounder || !rounder.isAlive) return false;

    const rounderHero = G.heroInstances[rounder.heroInstanceId];
    if (!rounderHero) return false;

    // 从 heroes.json 加载性别数据
    const isFemaleRounder = isFemaleHero(rounderHero.staticId);
    const caster = G.players[ctx.playerId];
    const isSameTeam = caster && rounder.team === caster.team;

    return isFemaleRounder && isSameTeam;
  },
  effect: (G, ctx) => {
    // 给当前回合角色+1命中
    const rounderId = G.currentPlayerId;
    const rounder = G.players[rounderId];
    if (rounder) {
      const hero = G.heroInstances[rounder.heroInstanceId];
      if (hero) {
        hero.currentDex += 1;
      }
    }
  },
  priority: 10,
};

/**
 * 飞龙探云手[!]
 * 参战状态，同队，战力者AGL<=2，妨碍者被标记且有手牌 → 偷1张手牌
 */
const liXiaoyaoSkill2: SkillDefinition = {
  id: 'xj101_skill2',
  name: '飞龙探云手',
  heroCode: 'XJ101',
  trigger: SkillTrigger.COMBAT_START_ANY,
  occurs: '!R*Z1',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否参战状态
    if (!G.combat) return false;

    // 检查是否同队
    const rounder = G.players[G.currentPlayerId];
    const caster = G.players[ctx.playerId];
    if (!rounder || !caster || rounder.team !== caster.team) return false;

    // 检查战力者 AGL <= 2（这里简化处理）
    // 实际需要从怪物数据中获取 AGL
    const monster = G.monsterInstances[G.combat.monsterInstanceId];
    if (!monster) return false;

    // 检查妨碍者是否有手牌
    if (G.combat.hindererPlayerId) {
      const hinderer = G.players[G.combat.hindererPlayerId];
      if (hinderer && hinderer.hand.length > 0) {
        return true;
      }
    }

    return false;
  },
  effect: (G, ctx) => {
    // 从妨碍者那里偷1张手牌
    if (!G.combat || !G.combat.hindererPlayerId) return;

    const hinderer = G.players[G.combat.hindererPlayerId];
    const caster = G.players[ctx.playerId];
    if (!hinderer || !caster || hinderer.hand.length === 0) return;

    // 随机选择一张手牌
    const randomIndex = ctx.random.Die(hinderer.hand.length) - 1;
    const stolenCard = hinderer.hand.splice(randomIndex, 1)[0];

    // 添加到施法者手牌
    caster.hand.push(stolenCard);
  },
  priority: 20,
};

// ==================== 赵灵儿 (XJ102) ====================

/**
 * 双剑
 * 装备/卸下武器时修改武器装备槽
 */
const zhaoLingerSkill1: SkillDefinition = {
  id: 'xj102_skill1',
  name: '双剑',
  heroCode: 'XJ102',
  trigger: SkillTrigger.HERO_ENTER,
  triggers: [SkillTrigger.HERO_ENTER, SkillTrigger.HERO_LEAVE],
  occurs: '!G0IS,!G0OS',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否装备了武器
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return false;

    // 检查装备的卡牌是否为武器类型
    // 实际需要从卡牌数据中判断
    return true;
  },
  effect: (G, ctx) => {
    // 双剑效果：允许装备两件武器，效果叠加
    // 实际实现需要修改装备系统，当前简化处理
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return;

    // 标记双剑效果（在装备系统中检查此标记）
    if (!hero.buffs) hero.buffs = [];
    hero.buffs.push({
      id: 'xj102_dual_sword',
      name: '双剑',
      duration: -1, // 永久
      params: { dualWeapon: true },
    });
  },
  priority: 5,
};

/**
 * 梦蛇[!]
 * 对手宠物总数>=3时变身
 */
const zhaoLingerSkill2: SkillDefinition = {
  id: 'xj102_skill2',
  name: '梦蛇',
  heroCode: 'XJ102',
  trigger: SkillTrigger.PET_GAINED,
  triggers: [SkillTrigger.PET_GAINED, SkillTrigger.HERO_ENTER],
  occurs: '!G0HD,!G0IS',
  isForced: true,
  condition: (G, ctx) => {
    // 检查对手宠物总数
    const caster = G.players[ctx.playerId];
    const enemyTeam = caster?.team === 'A' ? 'B' : 'A';
    let enemyPetCount = 0;

    for (const player of Object.values(G.players)) {
      if (player.isAlive && player.team === enemyTeam) {
        const hero = G.heroInstances[player.heroInstanceId];
        if (hero && hero.pet) {
          enemyPetCount++;
        }
      }
    }

    return enemyPetCount >= 3;
  },
  effect: (G, ctx) => {
    // 变身为赵灵儿·梦蛇
    // 调用变身系统
    executeTransform(G, ctx.playerId, 10103); // 10103 = 赵灵儿·梦蛇的 staticId
  },
  priority: 100,
};

// ==================== 赵灵儿·梦蛇 (XJ103) ====================

/**
 * 变身[!]
 * 对手宠物总数<3时变回
 */
const mengsheSkill1: SkillDefinition = {
  id: 'xj103_skill1',
  name: '变身',
  heroCode: 'XJ103',
  trigger: SkillTrigger.PET_LOST,
  triggers: [SkillTrigger.PET_LOST, SkillTrigger.HERO_ENTER],
  occurs: '!G0HL,!G0IS',
  isForced: true,
  condition: (G, ctx) => {
    // 检查对手宠物总数
    const caster = G.players[ctx.playerId];
    const enemyTeam = caster?.team === 'A' ? 'B' : 'A';
    let enemyPetCount = 0;

    for (const player of Object.values(G.players)) {
      if (player.isAlive && player.team === enemyTeam) {
        const hero = G.heroInstances[player.heroInstanceId];
        if (hero && hero.pet) {
          enemyPetCount++;
        }
      }
    }

    return enemyPetCount < 3;
  },
  effect: (G, ctx) => {
    // 变回赵灵儿
    // 这里需要调用变身系统
  },
  priority: 100,
};

/**
 * 女娲[!]
 * 修改队伍灵力池
 */
const mengsheSkill2: SkillDefinition = {
  id: 'xj103_skill2',
  name: '女娲',
  heroCode: 'XJ103',
  trigger: SkillTrigger.COMBAT_START_ANY,
  triggers: [SkillTrigger.COMBAT_START_ANY, SkillTrigger.HERO_ENTER, SkillTrigger.HERO_LEAVE],
  occurs: '!R*PD,!G0IS,!G0OS',
  isForced: true,
  condition: (G, ctx) => {
    // 检查灵力池是否启用
    // 实际需要从游戏配置中获取
    return true;
  },
  effect: (G, ctx) => {
    // 修改队伍灵力池
    // 根据 C# 代码：type 0/1 添加 2 点，type 2 移除所有
    // 这里简化处理，添加 2 点
  },
  priority: 10,
};

// ==================== 林月如 (XJ104) ====================

/**
 * 林家剑法[!]
 * 装备/卸下武器时修改战力
 */
const linYueruSkill1: SkillDefinition = {
  id: 'xj104_skill1',
  name: '林家剑法',
  heroCode: 'XJ104',
  trigger: SkillTrigger.GLOBAL_WEAPON_EQUIP,
  triggers: [SkillTrigger.GLOBAL_WEAPON_EQUIP, SkillTrigger.GLOBAL_WEAPON_REMOVE],
  occurs: '!G1IZ,!G1OZ',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否装备了武器
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return false;

    // 检查装备的卡牌是否为武器类型
    // 实际需要从卡牌数据中判断
    return true;
  },
  effect: (G, ctx) => {
    // 装备武器时：+N 战力
    // 卸下武器时：-N 战力
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return;

    // 根据 C# 代码：n = 装备的武器数量
    // 这里简化处理，假设每次装备/卸下1把武器
    const delta = ctx.params.equipped ? 1 : -1;
    hero.currentStr += delta;
  },
  priority: 15,
};

/**
 * 嫉恶如仇[!]
 * 参战且处于劣势时对所有参战对手造成1伤害
 */
const linYueruSkill2: SkillDefinition = {
  id: 'xj104_skill2',
  name: '嫉恶如仇',
  heroCode: 'XJ104',
  trigger: SkillTrigger.COMBAT_FAIL_ANY,
  occurs: '!R*VS',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否参战状态
    if (!G.combat) return false;

    // 检查是否处于劣势
    // 根据 C# 代码：meLose = (player.Team == Rounder.Team && !IsBattleWin) || (player.Team == OppTeam && IsBattleWin)
    const rounder = G.players[G.currentPlayerId];
    if (!rounder) return false;

    const caster = G.players[ctx.playerId];
    if (!caster) return false;
    const isMyTeamRounder = rounder.team === caster.team;
    const isLosing = isMyTeamRounder
      ? G.combat.result !== 'WIN'
      : G.combat.result === 'WIN';

    if (!isLosing) return false;

    // 检查是否有参战的对手
    const enemies = getAliveEnemyIds(G, caster.team);
    return enemies.some(enemyId => {
      const enemy = G.players[enemyId];
      return enemy && G.combat?.participants.some(p => p.playerId === enemyId);
    });
  },
  effect: (G, ctx) => {
    // 对所有参战对手造成1伤害
    if (!G.combat) return;

    const caster = G.players[ctx.playerId];
    const enemies = getAliveEnemyIds(G, caster?.team || 'A');
    for (const enemyId of enemies) {
      if (G.combat.participants.some(p => p.playerId === enemyId)) {
        dealDamage(G, enemyId, 1);
      }
    }
  },
  priority: 25,
};

// ==================== 阿奴 (XJ105) ====================

/**
 * 鬼灵精
 * 有手牌且有被标记的队友 → 转移手牌
 */
const aNuSkill1: SkillDefinition = {
  id: 'xj105_skill1',
  name: '鬼灵精',
  heroCode: 'XJ105',
  trigger: SkillTrigger.SKILL_PHASE_SELF,
  occurs: 'R#GR',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否有手牌
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return false;

    // 检查是否有被标记的队友
    const teammates = getAliveTeammateIds(G, caster.team);
    return teammates.some(teammateId => {
      const teammate = G.players[teammateId];
      // 检查是否被标记（这里简化处理）
      return teammate && teammateId !== ctx.playerId;
    });
  },
  effect: (G, ctx) => {
    // 转移手牌给队友
    // 简化处理：将第一张手牌转移给第一个队友
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length === 0) return;

    const teammates = getAliveTeammateIds(G, caster.team);
    if (teammates.length === 0) return;

    // 转移第一张手牌
    const cardToTransfer = caster.hand.splice(0, 1)[0];
    if (cardToTransfer) {
      const targetPlayer = G.players[teammates[0]];
      if (targetPlayer) {
        targetPlayer.hand.push(cardToTransfer);
        // 更新卡牌所有者
        const card = G.cardInstances[cardToTransfer];
        if (card) {
          card.ownerId = teammates[0];
        }
      }
    }
  },
  priority: 5,
};

/**
 * 万蛊蚀天[!]
 * 手牌为0时，所有队友抽1牌，对所有其他存活玩家造成1伤害
 */
const aNuSkill2: SkillDefinition = {
  id: 'xj105_skill2',
  name: '万蛊蚀天',
  heroCode: 'XJ105',
  trigger: SkillTrigger.DRAW_PHASE_SELF,
  occurs: '!R#BC',
  isForced: true,
  condition: (G, ctx) => {
    // 检查手牌是否为0
    const caster = G.players[ctx.playerId];
    return caster && caster.hand.length === 0;
  },
  effect: (G, ctx) => {
    // 所有队友抽1牌
    const caster = G.players[ctx.playerId];
    const teammates = getAliveTeammateIds(G, caster?.team || 'A');
    for (const teammateId of teammates) {
      drawCards(G, teammateId, 1, ctx.random);
    }

    // 对所有其他存活玩家造成1伤害（包括队友）
    for (const playerId of Object.keys(G.players)) {
      if (playerId !== ctx.playerId && G.players[playerId].isAlive) {
        dealDamage(G, playerId, 1);
      }
    }
  },
  priority: 30,
};

// ==================== 酒剑仙 (XJ106) ====================

/**
 * 御剑术[!]
 * 装备/卸下武器时修改命中
 */
const jiuJianXianSkill1: SkillDefinition = {
  id: 'xj106_skill1',
  name: '御剑术',
  heroCode: 'XJ106',
  trigger: SkillTrigger.GLOBAL_WEAPON_EQUIP,
  triggers: [SkillTrigger.GLOBAL_WEAPON_EQUIP, SkillTrigger.GLOBAL_WEAPON_REMOVE],
  occurs: '!G1IZ,!G1OZ',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否装备了武器
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return false;

    // 检查装备的卡牌是否为武器类型
    // 实际需要从卡牌数据中判断
    return true;
  },
  effect: (G, ctx) => {
    // 装备武器时：+N 命中
    // 卸下武器时：-N 命中
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (!hero) return;

    const delta = ctx.params.equipped ? 1 : -1;
    hero.currentDex += delta;
  },
  priority: 15,
};

/**
 * 醉仙望月步
 * 复杂的多阶段技能（第二次战斗机会）
 */
const jiuJianXianSkill2: SkillDefinition = {
  id: 'xj106_skill2',
  name: '醉仙望月步',
  heroCode: 'XJ106',
  trigger: SkillTrigger.COMBAT_CLEANUP_SELF,
  triggers: [SkillTrigger.COMBAT_CLEANUP_SELF, SkillTrigger.ON_DRAW_CARDS, SkillTrigger.COMBAT_END_SELF],
  occurs: '!R#ZF,!G0HT,!R#ZW',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否有战斗者
    if (!G.combat) return false;

    // 检查是否已经使用过（RFM.DuoFight）
    const player = G.players[ctx.playerId];
    if (!player) return false;

    // 检查怪物牌堆是否为空
    if (G.piles.monsterPile.length === 0) return false;

    // 根据 C# 代码，需要检查 DuoFight 标记
    // 这里简化处理
    return true;
  },
  effect: (G, ctx) => {
    // 第二次战斗机会
    // 标记允许再次战斗
    const player = G.players[ctx.playerId];
    if (!player) return;

    // 设置 DuoFight 标记，允许在回合结束前再次触发战斗
    if (!player.rfm) player.rfm = {};
    player.rfm.duoFight = true;

    // 补1张牌
    drawCards(G, ctx.playerId, 1, ctx.random);
  },
  priority: 40,
};

// ==================== 拜月教主 (XJ107) ====================

/**
 * 水魔兽合体[!]
 * 参战且怪物是水/火属性 → +2战力
 */
const baiYueSkill1: SkillDefinition = {
  id: 'xj107_skill1',
  name: '水魔兽合体',
  heroCode: 'XJ107',
  trigger: SkillTrigger.COMBAT_START_ANY,
  occurs: '!R*Z1',
  isForced: true,
  condition: (G, ctx) => {
    // 检查是否参战状态
    if (!G.combat) return false;

    // 检查怪物是否为水或火属性
    const monster = G.monsterInstances[G.combat.monsterInstanceId];
    if (!monster) return false;

    // 根据 C# 代码：检查 Element == AQUA || Element == AGNI
    return monster.element === Element.WATER || monster.element === Element.FIRE;
  },
  effect: (G, ctx) => {
    // +2 战力
    const hero = G.heroInstances[ctx.heroInstanceId];
    if (hero) {
      hero.currentStr += 2;
    }
  },
  priority: 20,
};

/**
 * 召唤水魔兽
 * 参战且手牌>=2时，弃置2张手牌，队伍灵力池+5
 */
const baiYueSkill2: SkillDefinition = {
  id: 'xj107_skill2',
  name: '召唤水魔兽',
  heroCode: 'XJ107',
  trigger: SkillTrigger.BATTLE_CARD_ANY,
  occurs: 'R*ZD',
  isForced: false,
  condition: (G, ctx) => {
    // 检查是否参战状态
    if (!G.combat) return false;

    // 检查手牌是否>=2
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length < 2) return false;

    // 检查是否有 RestZP（这里简化处理）
    return true;
  },
  effect: (G, ctx) => {
    // 弃置2张手牌，队伍灵力池+5
    const caster = G.players[ctx.playerId];
    if (!caster || caster.hand.length < 2) return;

    // 弃置前2张手牌（实际实现时需要等待玩家选择）
    const cardsToDiscard = caster.hand.splice(0, 2);
    discardCards(G, ctx.playerId, cardsToDiscard);

    // 队伍灵力池+5（在战斗中增加攻击方战力）
    if (G.combat) {
      const rounder = G.players[G.currentPlayerId];
      if (rounder && rounder.team === caster.team) {
        G.combat.attackerPool += 5;
      } else {
        G.combat.monsterPool += 5;
      }
    }
  },
  priority: 25,
};

// ==================== 导出所有仙剑一技能 ====================

export const xianjian1Skills: SkillDefinition[] = [
  // 李逍遥
  liXiaoyaoSkill1,
  liXiaoyaoSkill2,
  // 赵灵儿
  zhaoLingerSkill1,
  zhaoLingerSkill2,
  // 赵灵儿·梦蛇
  mengsheSkill1,
  mengsheSkill2,
  // 林月如
  linYueruSkill1,
  linYueruSkill2,
  // 阿奴
  aNuSkill1,
  aNuSkill2,
  // 酒剑仙
  jiuJianXianSkill1,
  jiuJianXianSkill2,
  // 拜月教主
  baiYueSkill1,
  baiYueSkill2,
];
