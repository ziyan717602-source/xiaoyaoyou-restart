/**
 * 仙剑逍遥游 - 技能注册表
 * Phase 4：角色技能引擎
 *
 * 管理所有技能的注册、查询和索引。
 * 技能按触发时机和角色编码进行索引，支持快速查询。
 */

import { SkillTrigger } from '../../shared/types/enums';
import { SkillDefinition, ISkillRegistry } from './types';

/** 技能注册表实现 */
export class SkillRegistry implements ISkillRegistry {
  /** 所有已注册技能（按 ID 索引） */
  private skillsById: Map<string, SkillDefinition> = new Map();

  /** 技能索引（按触发时机） */
  private skillsByTrigger: Map<SkillTrigger, SkillDefinition[]> = new Map();

  /** 技能索引（按角色编码） */
  private skillsByHeroCode: Map<string, SkillDefinition[]> = new Map();

  /** 注册技能 */
  register(skill: SkillDefinition): void {
    if (this.skillsById.has(skill.id)) {
      console.warn(`[SkillRegistry] Skill already registered: ${skill.id}`);
      return;
    }

    this.skillsById.set(skill.id, skill);

    // 按触发时机索引
    if (!this.skillsByTrigger.has(skill.trigger)) {
      this.skillsByTrigger.set(skill.trigger, []);
    }
    this.skillsByTrigger.get(skill.trigger)!.push(skill);

    // 按角色编码索引
    if (!this.skillsByHeroCode.has(skill.heroCode)) {
      this.skillsByHeroCode.set(skill.heroCode, []);
    }
    this.skillsByHeroCode.get(skill.heroCode)!.push(skill);
  }

  /** 批量注册技能 */
  registerAll(skills: SkillDefinition[]): void {
    for (const skill of skills) {
      this.register(skill);
    }
  }

  /** 根据触发时机获取技能列表 */
  getByTrigger(trigger: SkillTrigger): SkillDefinition[] {
    return this.skillsByTrigger.get(trigger) ?? [];
  }

  /** 根据角色编码获取技能列表 */
  getByHeroCode(heroCode: string): SkillDefinition[] {
    return this.skillsByHeroCode.get(heroCode) ?? [];
  }

  /** 根据技能 ID 获取技能 */
  getById(skillId: string): SkillDefinition | undefined {
    return this.skillsById.get(skillId);
  }

  /** 获取所有已注册技能 */
  getAll(): SkillDefinition[] {
    return Array.from(this.skillsById.values());
  }

  /** 获取已注册技能数量 */
  get size(): number {
    return this.skillsById.size;
  }
}

/** 全局技能注册表实例 */
export const skillRegistry = new SkillRegistry();
