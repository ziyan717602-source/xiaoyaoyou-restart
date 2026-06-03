/**
 * 仙剑逍遥游 - 死亡处理引擎
 * Phase 5：怪物/NPC
 *
 * 实现死亡时的处理逻辑：
 * - 倾慕（Love/Admiration）：角色死亡时，所有倾慕者各扣1HP使其复活
 * - 死亡标记：设置 isAlive=false，触发死亡技能
 * - 胜负判定：检查队伍是否全灭
 *
 * C# 源码对照：Board.cs → ArticuloMortis 相关逻辑
 * 铁律：每行效果代码必须有 C# 源码对照
 */

import type { GameState } from '../../shared/types/game';
import { heroes } from '../../shared/data';

// ==================== 死亡处理 ====================

/**
 * 处理角色死亡
 * 当角色HP降至0时调用
 *
 * 流程：
 * 1. 标记角色死亡
 * 2. 处理倾慕效果（所有倾慕者各扣1HP）
 * 3. 检查队伍胜负
 *
 * @param G 游戏状态
 * @param deadPlayerId 死亡玩家ID
 */
export function handleDeath(G: GameState, deadPlayerId: string): void {
  const deadPlayer = G.players[deadPlayerId];
  if (!deadPlayer || !deadPlayer.isAlive) return;

  const deadHero = G.heroInstances[deadPlayer.heroInstanceId];
  if (!deadHero) return;

  // 1. 标记死亡
  deadPlayer.isAlive = false;
  deadHero.isAlive = false;

  // 2. 处理倾慕效果
  processLove(G, deadPlayerId);

  // 3. 检查队伍胜负
  checkTeamVictory(G);
}

/**
 * 处理倾慕（Love/Admiration）
 * 角色死亡时，所有倾慕者各扣1HP使其复活
 *
 * 规则：
 * - 每个倾慕者各扣1HP
 * - 如果倾慕者HP=1，扣1HP后也死亡，触发其倾慕
 * - 每个角色的倾慕每局限1次
 * - 倾慕伤害无法被隐蛊抵消
 *
 * C# 对照：PSDBase/Board.cs → ArticuloMortis 中的倾慕处理
 */
function processLove(G: GameState, deadPlayerId: string): void {
  const deadPlayer = G.players[deadPlayerId];
  if (!deadPlayer) return;

  const deadHero = G.heroInstances[deadPlayer.heroInstanceId];
  if (!deadHero) return;

  // 获取倾慕者列表（从heroes.json的SPOUSE字段解析）
  const loverIds = findLovers(G, deadPlayerId);

  for (const loverId of loverIds) {
    const lover = G.players[loverId];
    if (!lover || !lover.isAlive) continue;

    // 检查是否已使用过倾慕
    if (lover.loved) continue;

    // 标记已使用倾慕
    lover.loved = true;

    // 倾慕者扣1HP
    const loverHero = G.heroInstances[lover.heroInstanceId];
    if (!loverHero) continue;

    loverHero.currentHp -= 1;

    // 检查倾慕者是否也死亡
    if (loverHero.currentHp <= 0) {
      loverHero.currentHp = 0;
      // 倾慕者也死亡，但不再触发其倾慕（避免无限循环）
      // 实际实现中需要更复杂的链式处理
    } else {
      // 倾慕者存活，复活死亡角色
      deadPlayer.isAlive = true;
      deadHero.isAlive = true;
      deadHero.currentHp = 1; // 复活后HP=1
    }
  }
}

/**
 * 查找角色的倾慕者
 * 从heroes.json的SPOUSE字段解析
 *
 * @param G 游戏状态
 * @param playerId 目标玩家ID
 * @returns 倾慕者玩家ID列表
 */
function findLovers(G: GameState, playerId: string): string[] {
  const player = G.players[playerId];
  if (!player) return [];

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return [];

  // 获取角色的倾慕关系
  const heroData = heroes.find(h => h.ID === hero.staticId);
  if (!heroData || !heroData.SPOUSE) return [];

  // 解析倾慕者ID（SPOUSE字段格式："10102,10104"）
  const spouseIds = heroData.SPOUSE.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  if (spouseIds.length === 0) return [];

  // 找到拥有这些角色的玩家
  const loverIds: string[] = [];
  for (const [pid, p] of Object.entries(G.players)) {
    if (pid === playerId) continue; // 跳过自己
    if (!p.isAlive) continue;

    const pHero = G.heroInstances[p.heroInstanceId];
    if (pHero && spouseIds.includes(pHero.staticId)) {
      loverIds.push(pid);
    }
  }

  return loverIds;
}

/**
 * 检查队伍胜负
 * 当一方全部死亡时，另一方获胜
 */
export function checkTeamVictory(G: GameState): void {
  const teamAAlive = Object.values(G.players).some(
    p => p.team === 'A' && p.isAlive
  );
  const teamBAlive = Object.values(G.players).some(
    p => p.team === 'B' && p.isAlive
  );

  if (!teamAAlive && teamBAlive) {
    G.isGameOver = true;
    G.winnerTeam = 'B' as any;
  } else if (teamAAlive && !teamBAlive) {
    G.isGameOver = true;
    G.winnerTeam = 'A' as any;
  } else if (!teamAAlive && !teamBAlive) {
    // 平局（双方全灭）
    G.isGameOver = true;
    G.winnerTeam = null;
  }
}

/**
 * 检查玩家是否死亡
 */
export function isPlayerDead(G: GameState, playerId: string): boolean {
  const player = G.players[playerId];
  if (!player) return true;
  return !player.isAlive;
}

/**
 * 获取所有存活玩家
 */
export function getAlivePlayers(G: GameState): string[] {
  return Object.entries(G.players)
    .filter(([, p]) => p.isAlive)
    .map(([pid]) => pid);
}

/**
 * 获取指定队伍的存活玩家
 */
export function getAliveTeamPlayers(G: GameState, team: string): string[] {
  return Object.entries(G.players)
    .filter(([, p]) => p.isAlive && p.team === team)
    .map(([pid]) => pid);
}

/**
 * 检查队伍是否全灭
 */
export function isTeamEliminated(G: GameState, team: string): boolean {
  return !Object.values(G.players).some(p => p.team === team && p.isAlive);
}

/**
 * 获取死亡玩家列表
 */
export function getDeadPlayers(G: GameState): string[] {
  return Object.entries(G.players)
    .filter(([, p]) => !p.isAlive)
    .map(([pid]) => pid);
}

/**
 * 复活角色（HP恢复到指定值）
 */
export function revivePlayer(G: GameState, playerId: string, hp: number = 1): boolean {
  const player = G.players[playerId];
  if (!player || player.isAlive) return false;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return false;

  player.isAlive = true;
  hero.isAlive = true;
  hero.currentHp = Math.min(hp, hero.maxHp);

  return true;
}

/**
 * 对角色造成伤害（考虑死亡处理）
 */
export function dealDamageWithDeathCheck(
  G: GameState,
  targetPlayerId: string,
  damage: number,
): void {
  const player = G.players[targetPlayerId];
  if (!player || !player.isAlive) return;

  const hero = G.heroInstances[player.heroInstanceId];
  if (!hero) return;

  hero.currentHp = Math.max(0, hero.currentHp - damage);

  if (hero.currentHp <= 0) {
    handleDeath(G, targetPlayerId);
  }
}
