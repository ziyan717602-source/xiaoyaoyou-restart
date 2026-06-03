/**
 * 仙剑逍遥游 - 技能解析器
 * Phase 4：角色技能引擎
 *
 * 遍历技能 → 检查条件 → 执行效果。
 * 支持强制技能[!]自动触发和可选技能等待玩家确认。
 *
 * 核心规则：
 * - 强制技能在条件满足时自动执行
 * - 可选技能需要玩家确认后执行
 * - 技能执行必须是纯函数，只能修改 G
 */

import { GameState } from '../../shared/types/game';
import { SkillTrigger } from '../../shared/types/enums';
import {
  SkillDefinition,
  SkillRuntimeContext,
  ISkillResolver,
} from './types';
import { skillRegistry } from './index';

/** 技能解析器实现 */
export class SkillResolver implements ISkillResolver {
  private registry: typeof skillRegistry;

  constructor(registry: typeof skillRegistry) {
    this.registry = registry;
  }

  /**
   * 解析并执行技能
   * @param G - 游戏状态
   * @param trigger - 触发时机
   * @param context - 技能上下文（不含 trigger）
   */
  resolve(
    G: GameState,
    trigger: SkillTrigger,
    context: Omit<SkillRuntimeContext, 'trigger'>
  ): void {
    const skills = this.registry.getByTrigger(trigger);

    for (const skill of skills) {
      // 检查技能是否属于当前触发的角色
      if (this.isSkillApplicable(G, skill, context)) {
        this.processSkill(G, skill, { ...context, trigger });
      }
    }
  }

  /**
   * 解析并执行指定角色的技能
   * @param G - 游戏状态
   * @param heroInstanceId - 角色实例 ID
   * @param trigger - 触发时机
   * @param context - 技能上下文（不含 trigger 和 heroInstanceId）
   */
  resolveForHero(
    G: GameState,
    heroInstanceId: string,
    trigger: SkillTrigger,
    context: Omit<SkillRuntimeContext, 'trigger' | 'heroInstanceId'>
  ): void {
    // 查找角色对应的玩家
    const playerId = this.findPlayerByHero(G, heroInstanceId);
    if (!playerId) {
      console.warn(
        `[SkillResolver] No player found for hero: ${heroInstanceId}`
      );
      return;
    }

    const skills = this.registry.getByTrigger(trigger);

    for (const skill of skills) {
      // 只处理属于当前角色的技能
      if (this.isSkillForHero(G, skill, heroInstanceId)) {
        this.processSkill(G, skill, {
          ...context,
          playerId,
          heroInstanceId,
          trigger,
        });
      }
    }
  }

  /**
   * 处理单个技能
   */
  private processSkill(
    G: GameState,
    skill: SkillDefinition,
    context: SkillRuntimeContext
  ): void {
    // 检查技能条件
    if (!skill.condition(G, context)) {
      return;
    }

    // 检查一次性技能是否已使用
    if (skill.isOnce) {
      const skillInstance = this.findSkillInstance(G, skill.id, context.heroInstanceId);
      if (skillInstance?.used) {
        return;
      }
    }

    // 执行技能效果
    skill.effect(G, context);

    // 标记一次性技能已使用
    if (skill.isOnce) {
      const skillInstance = this.findSkillInstance(G, skill.id, context.heroInstanceId);
      if (skillInstance) {
        skillInstance.used = true;
      }
    }
  }

  /**
   * 检查技能是否适用于当前上下文
   */
  private isSkillApplicable(
    G: GameState,
    skill: SkillDefinition,
    context: Omit<SkillRuntimeContext, 'trigger'>
  ): boolean {
    // 查找角色对应的玩家
    const playerId = this.findPlayerByHero(G, context.heroInstanceId);
    if (!playerId) {
      return false;
    }

    // 检查技能是否属于当前角色
    return this.isSkillForHero(G, skill, context.heroInstanceId);
  }

  /**
   * 检查技能是否属于指定角色
   */
  private isSkillForHero(
    G: GameState,
    skill: SkillDefinition,
    heroInstanceId: string
  ): boolean {
    const hero = G.heroInstances[heroInstanceId];
    if (!hero) {
      return false;
    }

    // 获取角色静态定义（从共享数据中）
    // 注意：这里需要从数据文件中加载角色定义
    // 暂时使用简单的编码匹配
    return this.matchHeroCode(skill.heroCode, hero.staticId);
  }

  /**
   * 匹配角色编码
   */
  private matchHeroCode(heroCode: string, staticId: number): boolean {
    // 角色编码格式：XJ101, XJ201, 等
    // staticId 格式：10101, 10102, 等
    // 需要将编码转换为 ID 进行匹配
    const codePrefix = heroCode.substring(0, 2); // XJ, X3
    const codeNumber = parseInt(heroCode.substring(2), 10);

    // 根据前缀确定系列
    let genrePrefix: number;
    switch (codePrefix) {
      case 'XJ':
        genrePrefix = 1; // 仙剑系列 (XJ101 → 10101)
        break;
      case 'X3':
        genrePrefix = 4; // 仙剑三外传系列 (X3W01 → 10401)
        break;
      default:
        return false;
    }

    // 计算预期的 staticId
    const expectedStaticId = genrePrefix * 10000 + codeNumber;

    return staticId === expectedStaticId;
  }

  /**
   * 通过角色实例 ID 查找对应的玩家 ID
   */
  private findPlayerByHero(G: GameState, heroInstanceId: string): string | null {
    for (const [playerId, playerState] of Object.entries(G.players)) {
      if (playerState.heroInstanceId === heroInstanceId) {
        return playerId;
      }
    }
    return null;
  }

  /**
   * 查找技能实例
   */
  private findSkillInstance(
    G: GameState,
    skillId: string,
    heroInstanceId: string
  ): { used: boolean } | null {
    // 在 G.skillInstances 中查找匹配的技能实例
    for (const skillInstance of Object.values(G.skillInstances)) {
      if (
        skillInstance.heroInstanceId === heroInstanceId &&
        skillInstance.staticId.toString() === skillId
      ) {
        return skillInstance;
      }
    }
    return null;
  }
}

/** 全局技能解析器实例 */
export const skillResolver = new SkillResolver(skillRegistry);
