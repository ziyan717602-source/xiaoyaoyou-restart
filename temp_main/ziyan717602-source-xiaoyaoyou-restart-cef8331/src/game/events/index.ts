/**
 * 事件牌效果实现
 *
 * 14 张基础事件牌（GENRE=1）效果实现：
 * 1. SJ101 仙灵岛的邂逅（RANGE 1,2）- 男性：补1牌扣1HP；女性：弃防具，可对男性天雷破
 * 2. SJ102 深入将军冢（RANGE 3,3）- 无宠物的角色各补1张
 * 3. SJ103 走出圣姑小屋（RANGE 4,5）- 己方1人补2，敌方1人补2
 * 4. SJ104 闯荡试炼窟（RANGE 6,7）- 翻4张手牌，双方轮流选
 * 5. SJ201 寻找天使绘卷（RANGE 8,8）- HP<=3的角色各补1张
 * 6. SJ202 破除禁咒空间（RANGE 9,9）- 选1名HP>=2己方降至1HP，己方全体补1
 * 7. SJ301 三世轮回（RANGE 10,11）- 所有玩家手牌调整为3张
 * 8. SJ302 神树与夕瑶（RANGE 12,13）- HP最少的角色各恢复2HP
 * 9. SJ303 封印锁妖塔（RANGE 14,14）- 弃掉等于宠物数的手牌，补1张
 * 10. S3W01 大军围蜀山（RANGE 15,15）- 战力最高弃2张，最低补2张
 * 11. S3W02 绝世美味的诞生（RANGE 16,16）- 己方1人恢复HP=敌方宠物总数
 * 12. SJ401 拜访石沉溪洞（RANGE 17,18）- 弃掉所有手牌，补2张
 * 13. SJ402 束缚幻瞑界（RANGE 19,19）- 所有角色扣除自己宠物数量的HP
 * 14. SJ501 误闯神魔之隙（RANGE 20,20）- 手牌最多的角色横置（多人并列无效）
 *
 * 通过 events.json 的 CODE 字段索引
 * 由 playEventCard Move 调用
 */

import type { GameState } from '../../shared/types/game';
import type { EventContext, EventResult } from '../../shared/types/event';
import { events } from '../../shared/data';
import { hasTiansheStaff } from '../engine/combat';

/**
 * 事件内补牌辅助（绕过 ctx.random 依赖）
 * 事件阶段使用 ctx.random 在 setup 外会报错，改用 Math.random 临时处理
 * TODO: Phase 8 联调时改用 ctx.random
 */
function drawCardsForEvent(G: GameState, playerId: string, count: number): void {
  const player = G.players[playerId];
  if (!player) return;

  for (let i = 0; i < count; i++) {
    if (G.piles.handPile.length === 0) {
      if (G.piles.discardPile.length > 0) {
        // 简单洗牌（临时方案）
        const shuffled = [...G.piles.discardPile];
        for (let j = shuffled.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [shuffled[j], shuffled[k]] = [shuffled[k]!, shuffled[j]!];
        }
        G.piles.handPile = shuffled;
        G.piles.discardPile = [];
      } else {
        break;
      }
    }

    const cardInstanceId = G.piles.handPile.shift();
    if (cardInstanceId) {
      player.hand.push(cardInstanceId);
    }
  }
}

// ==================== 辅助函数 ====================

/**
 * 获取事件的CODE
 */
function getEventCode(G: GameState, eventInstanceId: string): string | null {
  const event = G.eventInstances[eventInstanceId];
  if (!event) return null;
  const eventData = events.find(e => e.ID === event.staticId);
  return eventData?.CODE ?? null;
}

/**
 * 获取玩家的手牌数
 */
function getHandSize(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  return player ? player.hand.length : 0;
}

/**
 * 获取玩家的宠物数量
 */
function getPetCount(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  if (!player) return 0;
  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return 0;
  return hero.pet ? 1 : 0;
}

/**
 * 获取玩家的战力（基础+装备）
 */
function getPlayerStrength(G: GameState, playerId: string): number {
  const player = G.players[playerId];
  if (!player) return 0;
  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return 0;

  // 基础战力从hero数据获取（这里简化处理，实际需要从heroes.json读取）
  // 暂时返回0，后续Phase 6会完善
  return 0;
}

/**
 * 回复HP（含天蛇杖加成）
 */
function applyHeal(G: GameState, targetPlayerId: string, amount: number): void {
  const target = G.players[targetPlayerId];
  if (!target || !target.isAlive) return;

  const hero = G.heroInstances[target.heroInstanceId];
  if (!hero) return;

  let finalHeal = amount;

  // 天蛇杖：HP回复量额外+1（倾慕除外）
  if (hasTiansheStaff(G, hero.instanceId)) {
    finalHeal += 1;
  }

  hero.currentHp = Math.min(hero.maxHp, hero.currentHp + finalHeal);
}

/**
 * 造成HP伤害（不含隐蛊响应窗口）
 */
function applyHpDamage(G: GameState, targetPlayerId: string, amount: number): void {
  const target = G.players[targetPlayerId];
  if (!target || !target.isAlive) return;

  const hero = G.heroInstances[target.heroInstanceId];
  if (!hero) return;

  // 扣HP
  hero.currentHp = Math.max(0, hero.currentHp - amount);

  // 检查死亡
  if (hero.currentHp <= 0 && hero.isAlive) {
    // 标记死亡
    hero.isAlive = false;
    target.isAlive = false;

    // 清理装备（装备进入弃牌堆）
    if (hero.equipment.weapon) {
      G.piles.discardPile.push(hero.equipment.weapon);
      hero.equipment.weapon = null;
    }
    if (hero.equipment.armor) {
      G.piles.discardPile.push(hero.equipment.armor);
      hero.equipment.armor = null;
    }
    if (hero.equipment.special) {
      G.piles.discardPile.push(hero.equipment.special);
      hero.equipment.special = null;
    }

    // 清理宠物
    if (hero.pet) {
      G.piles.discardPile.push(hero.pet);
      hero.pet = null;
    }

    // TODO: 倾慕链式反应
  }
}

// ==================== 事件效果实现 ====================

/**
 * SJ101 仙灵岛的邂逅
 * 效果：男性：补1牌扣1HP；女性：弃防具，可对男性天雷破
 */
export function eventXianLingDaoDeXieHou(ctx: EventContext): EventResult {
  const { G, currentPlayerId } = ctx;
  const logs: string[] = [];

  // 获取当前玩家的性别（需要从hero数据获取）
  // 这里简化处理，实际需要从heroes.json读取
  // 暂时返回占位结果
  logs.push('仙灵岛的邂逅效果待完善（需要hero性别数据）');

  return { success: true, logs };
}

/**
 * SJ102 深入将军冢
 * 效果：无宠物的角色各补1张
 */
export function eventShenRuJiangJunZhong(ctx: EventContext): EventResult {
  const { G } = ctx;
  const logs: string[] = [];

  // 遍历所有存活玩家
  for (const playerId of Object.keys(G.players)) {
    const player = G.players[playerId];
    if (!player || !player.isAlive) continue;

    const hero = G.heroInstances[player.heroInstanceId];
    if (!hero) continue;

    // 无宠物的角色补1张
    if (!hero.pet) {
      drawCardsForEvent(G, playerId, 1);
      logs.push(`玩家 ${playerId} 无宠物，补1张牌`);
    }
  }

  return { success: true, logs };
}

/**
 * SJ103 走出圣姑小屋
 * 效果：己方1人补2，敌方1人补2
 * 注意：需要玩家选择目标，暂时简化处理
 */
export function eventZouChuShengGuXiaoWu(ctx: EventContext): EventResult {
  const { G, currentPlayerId } = ctx;
  const logs: string[] = [];

  // 简化处理：当前玩家补2张，随机敌方补2张
  // 实际实现需要等待Phase 6前端交互
  drawCardsForEvent(G, currentPlayerId, 2);
  logs.push(`玩家 ${currentPlayerId} 补2张牌`);

  // TODO: 需要玩家选择敌方目标
  logs.push('敌方补牌待实现（需要玩家选择目标）');

  return { success: true, logs };
}

/**
 * SJ104 闯荡试炼窟
 * 效果：翻4张手牌，双方轮流选
 */
export function eventChuangDangShiLianKu(ctx: EventContext): EventResult {
  const { G } = ctx;
  const logs: string[] = [];

  // 从手牌堆翻4张牌
  const pile = G.piles.handPile;
  if (pile.length < 4) {
    logs.push('手牌堆不足4张，事件无效');
    return { success: false, logs };
  }

  const revealedCards = pile.splice(0, 4);
  logs.push(`翻开4张牌：${revealedCards.join(', ')}`);

  // TODO: 需要双方轮流选择（Phase 6前端交互）
  logs.push('轮流选牌待实现（需要前端交互）');

  return { success: true, logs };
}

/**
 * SJ201 寻找天使绘卷
 * 效果：HP<=3的角色各补1张
 */
export function eventXunZhaoTianShiHuiJuan(ctx: EventContext): EventResult {
  const { G } = ctx;
  const logs: string[] = [];

  // 遍历所有存活玩家
  for (const playerId of Object.keys(G.players)) {
    const player = G.players[playerId];
    if (!player || !player.isAlive) continue;

    const hero = G.heroInstances[player.heroInstanceId];
    if (!hero) continue;

    // HP<=3的角色补1张
    if (hero.currentHp <= 3) {
      drawCardsForEvent(G, playerId, 1);
      logs.push(`玩家 ${playerId} HP=${hero.currentHp}<=3，补1张牌`);
    }
  }

  return { success: true, logs };
}

/**
 * SJ202 破除禁咒空间
 * 效果：选1名HP>=2己方降至1HP，己方全体补1
 * 注意：需要玩家选择目标，暂时简化处理
 */
export function eventPoChuJinZhouKongJian(ctx: EventContext): EventResult {
  const { G, currentPlayerId } = ctx;
  const logs: string[] = [];

  // 简化处理：当前玩家自己降至1HP，己方全体补1
  // 实际实现需要等待Phase 6前端交互
  const player = G.players[currentPlayerId];
  if (player && player.isAlive) {
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero && hero.currentHp >= 2) {
      hero.currentHp = 1;
      logs.push(`玩家 ${currentPlayerId} HP降至1`);
    }
  }

  // 己方全体补1
  for (const pid of Object.keys(G.players)) {
    const p = G.players[pid];
    if (p && p.isAlive && p.team === player?.team) {
      drawCardsForEvent(G, pid, 1);
      logs.push(`玩家 ${pid} 补1张牌`);
    }
  }

  return { success: true, logs };
}

/**
 * SJ301 三世轮回
 * 效果：所有玩家手牌调整为3张，少则补，多则弃
 */
export function eventSanShiLunHui(ctx: EventContext): EventResult {
  const { G } = ctx;
  const logs: string[] = [];

  // 遍历所有存活玩家
  for (const playerId of Object.keys(G.players)) {
    const player = G.players[playerId];
    if (!player || !player.isAlive) continue;

    const handSize = player.hand.length;

    if (handSize < 3) {
      // 补牌
      const drawCount = 3 - handSize;
      drawCardsForEvent(G, playerId, drawCount);
      logs.push(`玩家 ${playerId} 手牌${handSize}张，补${drawCount}张`);
    } else if (handSize > 3) {
      // 弃牌（需要玩家选择，暂时简化为弃掉最后的牌）
      const discardCount = handSize - 3;
      const discarded = player.hand.splice(-discardCount);
      G.piles.discardPile.push(...discarded);
      logs.push(`玩家 ${playerId} 手牌${handSize}张，弃${discardCount}张`);
    } else {
      logs.push(`玩家 ${playerId} 手牌刚好3张，无需调整`);
    }
  }

  return { success: true, logs };
}

/**
 * SJ302 神树与夕瑶
 * 效果：HP最少的角色各恢复2HP
 */
export function eventShenShuYuXiYao(ctx: EventContext): EventResult {
  const { G } = ctx;
  const logs: string[] = [];

  // 找出HP最少的存活角色
  let minHp = Infinity;
  const minHpPlayers: string[] = [];

  for (const playerId of Object.keys(G.players)) {
    const player = G.players[playerId];
    if (!player || !player.isAlive) continue;

    const hero = G.heroInstances[player.heroInstanceId];
    if (!hero) continue;

    if (hero.currentHp < minHp) {
      minHp = hero.currentHp;
      minHpPlayers.length = 0;
      minHpPlayers.push(playerId);
    } else if (hero.currentHp === minHp) {
      minHpPlayers.push(playerId);
    }
  }

  // HP最少的角色各恢复2HP
  for (const playerId of minHpPlayers) {
    applyHeal(G, playerId, 2);
    logs.push(`玩家 ${playerId} HP=${minHp}最少，恢复2HP`);
  }

  return { success: true, logs };
}

/**
 * SJ303 封印锁妖塔
 * 效果：弃掉等于宠物数的手牌，补1张
 */
export function eventFengYinSuoYaoTa(ctx: EventContext): EventResult {
  const { G, currentPlayerId } = ctx;
  const logs: string[] = [];

  const player = G.players[currentPlayerId];
  if (!player || !player.isAlive) {
    logs.push('玩家不存在或已死亡');
    return { success: false, logs };
  }

  const petCount = getPetCount(G, currentPlayerId);

  // 弃掉等于宠物数的手牌（需要玩家选择，暂时简化为弃掉最后的牌）
  if (petCount > 0 && player.hand.length >= petCount) {
    const discarded = player.hand.splice(-petCount);
    G.piles.discardPile.push(...discarded);
    logs.push(`弃掉${petCount}张手牌（宠物数）`);
  } else {
    logs.push(`宠物数为0或手牌不足，无需弃牌`);
  }

  // 补1张
  drawCardsForEvent(G, currentPlayerId, 1);
  logs.push(`补1张牌`);

  return { success: true, logs };
}

/**
 * S3W01 大军围蜀山
 * 效果：战力最高弃2张，最低补2张
 */
export function eventDaJunWeiShuShan(ctx: EventContext): EventResult {
  const { G } = ctx;
  const logs: string[] = [];

  // 找出战力最高和最低的角色
  let maxStr = -Infinity;
  let minStr = Infinity;
  const maxStrPlayers: string[] = [];
  const minStrPlayers: string[] = [];

  for (const playerId of Object.keys(G.players)) {
    const player = G.players[playerId];
    if (!player || !player.isAlive) continue;

    const str = getPlayerStrength(G, playerId);

    if (str > maxStr) {
      maxStr = str;
      maxStrPlayers.length = 0;
      maxStrPlayers.push(playerId);
    } else if (str === maxStr) {
      maxStrPlayers.push(playerId);
    }

    if (str < minStr) {
      minStr = str;
      minStrPlayers.length = 0;
      minStrPlayers.push(playerId);
    } else if (str === minStr) {
      minStrPlayers.push(playerId);
    }
  }

  // 战力最高的弃2张
  for (const playerId of maxStrPlayers) {
    const player = G.players[playerId];
    if (player && player.hand.length >= 2) {
      const discarded = player.hand.splice(-2);
      G.piles.discardPile.push(...discarded);
      logs.push(`玩家 ${playerId} 战力最高，弃2张牌`);
    }
  }

  // 战力最低的补2张
  for (const playerId of minStrPlayers) {
    drawCardsForEvent(G, playerId, 2);
    logs.push(`玩家 ${playerId} 战力最低，补2张牌`);
  }

  return { success: true, logs };
}

/**
 * S3W02 绝世美味的诞生
 * 效果：己方1人恢复HP=敌方宠物总数
 */
export function eventJueShiMeiWeiDeDanSheng(ctx: EventContext): EventResult {
  const { G, currentPlayerId } = ctx;
  const logs: string[] = [];

  const player = G.players[currentPlayerId];
  if (!player || !player.isAlive) {
    logs.push('玩家不存在或已死亡');
    return { success: false, logs };
  }

  // 计算敌方宠物总数
  let enemyPetCount = 0;
  for (const pid of Object.keys(G.players)) {
    const p = G.players[pid];
    if (p && p.isAlive && p.team !== player.team) {
      enemyPetCount += getPetCount(G, pid);
    }
  }

  // 己方1人恢复HP（需要选择，暂时选择当前玩家）
  applyHeal(G, currentPlayerId, enemyPetCount);
  logs.push(`玩家 ${currentPlayerId} 恢复${enemyPetCount}HP（敌方宠物总数）`);

  return { success: true, logs };
}

/**
 * SJ401 拜访石沉溪洞
 * 效果：弃掉所有手牌，补2张
 */
export function eventBaiFangShiChenXiDong(ctx: EventContext): EventResult {
  const { G, currentPlayerId } = ctx;
  const logs: string[] = [];

  const player = G.players[currentPlayerId];
  if (!player || !player.isAlive) {
    logs.push('玩家不存在或已死亡');
    return { success: false, logs };
  }

  // 弃掉所有手牌
  const handCount = player.hand.length;
  if (handCount > 0) {
    const discarded = player.hand.splice(0);
    G.piles.discardPile.push(...discarded);
    logs.push(`弃掉${handCount}张手牌`);
  }

  // 补2张
  drawCardsForEvent(G, currentPlayerId, 2);
  logs.push(`补2张牌`);

  return { success: true, logs };
}

/**
 * SJ402 束缚幻瞑界
 * 效果：所有角色扣除自己宠物数量的HP
 */
export function eventShuFuHuanMingJie(ctx: EventContext): EventResult {
  const { G } = ctx;
  const logs: string[] = [];

  // 遍历所有存活玩家
  for (const playerId of Object.keys(G.players)) {
    const player = G.players[playerId];
    if (!player || !player.isAlive) continue;

    const petCount = getPetCount(G, playerId);
    if (petCount > 0) {
      applyHpDamage(G, playerId, petCount);
      logs.push(`玩家 ${playerId} 扣除${petCount}HP（宠物数）`);
    }
  }

  return { success: true, logs };
}

/**
 * SJ501 误闯神魔之隙
 * 效果：手牌最多的角色横置（多人并列无效）
 */
export function eventWuChuangShenMoZhiXi(ctx: EventContext): EventResult {
  const { G } = ctx;
  const logs: string[] = [];

  // 找出手牌最多的玩家
  let maxHandSize = -1;
  const maxHandPlayers: string[] = [];

  for (const playerId of Object.keys(G.players)) {
    const player = G.players[playerId];
    if (!player || !player.isAlive) continue;

    const handSize = player.hand.length;

    if (handSize > maxHandSize) {
      maxHandSize = handSize;
      maxHandPlayers.length = 0;
      maxHandPlayers.push(playerId);
    } else if (handSize === maxHandSize) {
      maxHandPlayers.push(playerId);
    }
  }

  // 多人并列则无效
  if (maxHandPlayers.length > 1) {
    logs.push(`手牌最多玩家并列（${maxHandPlayers.length}人），事件无效`);
    return { success: true, logs };
  }

  // 横置手牌最多的角色
  if (maxHandPlayers.length === 1) {
    const playerId = maxHandPlayers[0]!;
    const player = G.players[playerId];
    if (player) {
      player.immobilized = true;
      logs.push(`玩家 ${playerId} 手牌最多（${maxHandSize}张），被横置`);
    }
  }

  return { success: true, logs };
}

// ==================== 事件调度器 ====================

/**
 * 根据事件CODE分发到对应的效果函数
 * 由 playEventCard Move 调用
 */
export function dispatchEvent(
  G: GameState,
  currentPlayerId: string,
  eventInstanceId: string,
): EventResult {
  const code = getEventCode(G, eventInstanceId);
  if (!code) {
    return { success: false, logs: ['事件CODE未找到'] };
  }

  const ctx: EventContext = {
    G,
    currentPlayerId,
    eventInstanceId,
  };

  switch (code) {
    case 'SJ101': // 仙灵岛的邂逅
      return eventXianLingDaoDeXieHou(ctx);
    case 'SJ102': // 深入将军冢
      return eventShenRuJiangJunZhong(ctx);
    case 'SJ103': // 走出圣姑小屋
      return eventZouChuShengGuXiaoWu(ctx);
    case 'SJ104': // 闯荡试炼窟
      return eventChuangDangShiLianKu(ctx);
    case 'SJ201': // 寻找天使绘卷
      return eventXunZhaoTianShiHuiJuan(ctx);
    case 'SJ202': // 破除禁咒空间
      return eventPoChuJinZhouKongJian(ctx);
    case 'SJ301': // 三世轮回
      return eventSanShiLunHui(ctx);
    case 'SJ302': // 神树与夕瑶
      return eventShenShuYuXiYao(ctx);
    case 'SJ303': // 封印锁妖塔
      return eventFengYinSuoYaoTa(ctx);
    case 'S3W01': // 大军围蜀山
      return eventDaJunWeiShuShan(ctx);
    case 'S3W02': // 绝世美味的诞生
      return eventJueShiMeiWeiDeDanSheng(ctx);
    case 'SJ401': // 拜访石沉溪洞
      return eventBaiFangShiChenXiDong(ctx);
    case 'SJ402': // 束缚幻瞑界
      return eventShuFuHuanMingJie(ctx);
    case 'SJ501': // 误闯神魔之隙
      return eventWuChuangShenMoZhiXi(ctx);
    default:
      return { success: false, logs: [`未实现的事件效果: ${code}`] };
  }
}
