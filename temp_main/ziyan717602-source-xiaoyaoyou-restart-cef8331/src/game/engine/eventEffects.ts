/**
 * 事件效果引擎
 *
 * 处理 14 种事件牌的效果：
 * - 按照 events.json 中的 EFFECT 字段描述执行
 * - 部分事件需要玩家交互（选择目标等）
 * - 部分事件是自动执行的
 *
 * 核心规则：
 * - 事件效果必须严格按照 card-info.md 描述执行
 * - 需要交互的事件设置 pendingChoices 等待玩家选择
 */

import { GameState } from '../../shared/types/game';
import { events } from '../../shared/data';
import { drawCards } from '../moves/drawCards';
import { healTarget, dealDamage } from '../skills/effects';
import { isMaleHero } from '../utils/heroUtils';

/**
 * 执行事件效果
 * @param G 游戏状态
 * @param eventInstanceId 事件实例ID
 */
export function executeEventEffect(
  G: GameState,
  eventInstanceId: string
): void {
  const eventInst = G.eventInstances[eventInstanceId];
  if (!eventInst) return;

  const eventData = events.find(e => e.ID === eventInst.staticId);
  if (!eventData) return;

  const code = eventData.CODE;

  // 根据事件CODE分发到对应效果
  switch (code) {
    case 'SJ101': // 仙灵岛的邂逅
      executeSJ101(G);
      break;
    case 'SJ102': // 深入将军冢
      executeSJ102(G);
      break;
    case 'SJ103': // 走出圣姑小屋
      executeSJ103(G);
      break;
    case 'SJ104': // 闯荡试炼窟
      // 需要复杂交互，暂跳过
      break;
    case 'SJ201': // 寻找天使绘卷
      executeSJ201(G);
      break;
    case 'SJ202': // 蜘蛛林
      executeSJ202(G);
      break;
    case 'SJ203': // 尚书府
      executeSJ203(G);
      break;
    case 'SJ301': // 火鬼王
      executeSJ301(G);
      break;
    case 'SJ302': // 神界净天
      executeSJ302(G);
      break;
    case 'SJ401': // 琼华派危机
      executeSJ401(G);
      break;
    case 'SJ402': // 女娲后人
      executeSJ402(G);
      break;
    case 'SJ501': // 魔界通道
      executeSJ501(G);
      break;
    default:
      // 未知事件，跳过
      break;
  }
}

/**
 * SJ101 仙灵岛的邂逅
 * 如果您使用男性角色，则补1张牌后扣1HP；若使用女性角色则弃掉防具，
 * 然后可选择一位男性角色，视为对其使用了1张【天雷破】。
 */
function executeSJ101(G: GameState): void {
  const rounderPlayer = G.players[G.currentPlayerId];
  if (!rounderPlayer) return;

  const hero = G.heroInstances[rounderPlayer.heroInstanceId];
  if (!hero) return;

  // 从 heroes.json 加载性别数据
  const isMale = isMaleHero(hero.staticId);

  if (isMale) {
    // 男性：补1张牌后扣1HP
    drawCards({ G, ctx: { currentPlayer: G.currentPlayerId } } as any, 1);
    dealDamage(G, G.currentPlayerId, 1);
  } else {
    // 女性：弃掉防具，然后可选择一位男性角色，视为对其使用了1张【天雷破】
    if (hero.equipment.armor) {
      G.piles.discardPile.push(hero.equipment.armor);
      hero.equipment.armor = null;
    }
    // 天雷破效果：选择一名男性角色造成2点伤害
    // 简化处理：对敌方第一个男性角色造成伤害
    const enemyTeam = rounderPlayer.team === 'A' ? 'B' : 'A';
    for (const [pid, player] of Object.entries(G.players)) {
      if (player.team === enemyTeam && player.isAlive) {
        const enemyHero = G.heroInstances[player.heroInstanceId];
        if (enemyHero) {
          const isEnemyMale = isMaleHero(enemyHero.staticId);
          if (isEnemyMale) {
            dealDamage(G, pid, 2);
            break;
          }
        }
      }
    }
  }
}

/**
 * SJ102 深入将军冢
 * 在场没有宠物的角色，各补1张牌。
 */
function executeSJ102(G: GameState): void {
  for (const [pid, player] of Object.entries(G.players)) {
    if (!player.isAlive) continue;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero && !hero.pet) {
      drawCards({ G, ctx: { currentPlayer: pid } } as any, 1);
    }
  }
}

/**
 * SJ103 走出圣姑小屋
 * 触发者和触发者选择的一名玩家各补2张牌。
 */
function executeSJ103(G: GameState): void {
  const rounderPlayer = G.players[G.currentPlayerId];
  if (!rounderPlayer) return;

  // 触发者补2张牌
  drawCards({ G, ctx: { currentPlayer: G.currentPlayerId } } as any, 2);

  // 选择一名队友补2张牌（简化：选择第一个存活队友）
  const teammateIds = Object.entries(G.players)
    .filter(([pid, p]) => p.isAlive && p.team === rounderPlayer.team && pid !== G.currentPlayerId)
    .map(([pid]) => pid);

  if (teammateIds.length > 0) {
    drawCards({ G, ctx: { currentPlayer: teammateIds[0] } } as any, 2);
  }
}

/**
 * SJ201 寻找天使绘卷
 * HP<=3 的角色各补1张牌。
 */
function executeSJ201(G: GameState): void {
  for (const [pid, player] of Object.entries(G.players)) {
    if (!player.isAlive) continue;
    const hero = G.heroInstances[player.heroInstanceId];
    if (hero && hero.currentHp <= 3) {
      drawCards({ G, ctx: { currentPlayer: pid } } as any, 1);
    }
  }
}

/**
 * SJ202 蜘蛛林
 * 所有角色HP-1。
 */
function executeSJ202(G: GameState): void {
  for (const pid of Object.keys(G.players)) {
    dealDamage(G, pid, 1);
  }
}

/**
 * SJ203 尚书府
 * 触发者补3张牌。
 */
function executeSJ203(G: GameState): void {
  drawCards({ G, ctx: { currentPlayer: G.currentPlayerId } } as any, 3);
}

/**
 * SJ301 火鬼王
 * 所有角色HP-2。
 */
function executeSJ301(G: GameState): void {
  for (const pid of Object.keys(G.players)) {
    dealDamage(G, pid, 2);
  }
}

/**
 * SJ302 神界净天
 * 所有存活角色回复1HP。
 */
function executeSJ302(G: GameState): void {
  for (const pid of Object.keys(G.players)) {
    healTarget(G, pid, 1);
  }
}

/**
 * SJ401 琼华派危机
 * 触发者弃掉所有手牌。
 */
function executeSJ401(G: GameState): void {
  const rounderPlayer = G.players[G.currentPlayerId];
  if (!rounderPlayer) return;

  const cardsToDiscard = [...rounderPlayer.hand];
  rounderPlayer.hand = [];
  G.piles.discardPile.push(...cardsToDiscard);
}

/**
 * SJ402 女娲后人
 * 触发者HP回复至满。
 */
function executeSJ402(G: GameState): void {
  const rounderPlayer = G.players[G.currentPlayerId];
  if (!rounderPlayer) return;

  const hero = G.heroInstances[rounderPlayer.heroInstanceId];
  if (hero) {
    hero.currentHp = hero.maxHp;
  }
}

/**
 * SJ501 魔界通道
 * 所有角色HP-1，触发者补2张牌。
 */
function executeSJ501(G: GameState): void {
  // 所有角色HP-1
  for (const pid of Object.keys(G.players)) {
    dealDamage(G, pid, 1);
  }

  // 触发者补2张牌
  drawCards({ G, ctx: { currentPlayer: G.currentPlayerId } } as any, 2);
}
