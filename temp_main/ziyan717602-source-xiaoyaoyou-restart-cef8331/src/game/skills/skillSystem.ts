/**
 * 仙剑逍遥游 - 技能系统入口
 * Phase 4：角色技能引擎
 *
 * 整合技能注册表和解析器，提供统一的技能系统接口。
 * 注册所有角色技能。
 */

import { GameState } from '../../shared/types/game';
import { SkillTrigger } from '../../shared/types/enums';
import { SkillRuntimeContext } from './types';
import { skillRegistry } from './index';
import { skillResolver } from './resolver';
import { xianjian1Skills } from './xianjian1';
import { xianjian2Skills } from './xianjian2';
import { xianjian3Skills } from './xianjian3';
import { xianjian4Skills } from './xianjian4';
import { xianjian5Skills } from './xianjian5';
import { fengmingSkills } from './fengming';

/** 技能系统类 */
export class SkillSystem {
  private registry = skillRegistry;
  private resolver = skillResolver;
  private initialized = false;

  /**
   * 初始化技能系统，注册所有角色技能
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    // 注册仙剑一技能
    this.registry.registerAll(xianjian1Skills);

    // 注册仙剑二技能
    this.registry.registerAll(xianjian2Skills);

    // 注册仙剑三+外传技能
    this.registry.registerAll(xianjian3Skills);

    // 注册仙剑四技能
    this.registry.registerAll(xianjian4Skills);

    // 注册仙剑五技能
    this.registry.registerAll(xianjian5Skills);

    // 注册凤鸣玉誓技能
    this.registry.registerAll(fengmingSkills);

    // TODO: 注册其他系列技能
    // this.registry.registerAll(xianjian2Skills);
    // this.registry.registerAll(xianjian3Skills);
    // this.registry.registerAll(xianjian4Skills);
    // this.registry.registerAll(fengmingSkills);

    this.initialized = true;
  }

  /**
   * 注册技能
   */
  register(
    skill: import('./types').SkillDefinition
  ): void {
    this.registry.register(skill);
  }

  /**
   * 批量注册技能
   */
  registerAll(
    skills: import('./types').SkillDefinition[]
  ): void {
    this.registry.registerAll(skills);
  }

  /**
   * 触发技能
   * 在指定时机检查并执行所有符合条件的技能
   */
  trigger(
    G: GameState,
    trigger: SkillTrigger,
    context: Omit<SkillRuntimeContext, 'trigger'>
  ): void {
    this.resolver.resolve(G, trigger, context);
  }

  /**
   * 触发指定角色的技能
   */
  triggerForHero(
    G: GameState,
    heroInstanceId: string,
    trigger: SkillTrigger,
    context: Omit<SkillRuntimeContext, 'trigger' | 'heroInstanceId'>
  ): void {
    this.resolver.resolveForHero(G, heroInstanceId, trigger, context);
  }

  /**
   * 获取技能注册表（用于调试）
   */
  getRegistry() {
    return this.registry;
  }
}

/** 全局技能系统实例 */
export const skillSystem = new SkillSystem();

// 导出所有模块
export { skillRegistry } from './index';
export { skillResolver } from './resolver';
export * from './types';
export * from './effects';
