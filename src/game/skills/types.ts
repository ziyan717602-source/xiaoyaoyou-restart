/**
 * 仙剑逍遥游 - 技能系统运行时类型
 * Phase 4：角色技能引擎
 *
 * 定义技能注册、触发和执行的运行时类型。
 * 这些类型用于技能引擎内部，与 shared/types/skill.ts 中的静态定义分离。
 *
 * 核心规则：
 * - 技能函数必须是纯函数，只能修改 G
 * - 随机数必须使用 ctx.random
 * - G 中只存储 ID，不存储函数或类实例
 */

import { GameState } from '../../shared/types/game';
import { SkillTrigger, CombatStage } from '../../shared/types/enums';

// ==================== 技能上下文 ====================

/** 技能执行上下文（运行时） */
export interface SkillRuntimeContext {
  /** 触发者玩家 ID */
  playerId: string;
  /** 触发者角色实例 ID */
  heroInstanceId: string;
  /** 目标玩家 ID 列表 */
  targetPlayerIds: string[];
  /** 目标角色实例 ID 列表 */
  targetHeroInstanceIds: string[];
  /** 当前战斗阶段 */
  combatStage: CombatStage | null;
  /** 触发时机 */
  trigger: SkillTrigger;
  /** 额外参数（由具体技能定义） */
  params: Record<string, unknown>;
  /** 随机数生成器（boardgame.io ctx.random） */
  random: {
    /** 生成 [0, 1) 之间的随机数 */
    Number: () => number;
    /** 生成 [min, max] 之间的整数 */
    Die: (sides: number) => number;
    /** 从数组中随机选择 */
    Shuffle: <T>(arr: T[]) => T[];
  };
}

// ==================== 技能条件检查 ====================

/** 技能条件检查函数类型 */
export type SkillCondition = (
  G: GameState,
  ctx: SkillRuntimeContext
) => boolean;

// ==================== 技能效果执行 ====================

/** 技能效果执行函数类型 */
export type SkillEffect = (
  G: GameState,
  ctx: SkillRuntimeContext
) => void;

// ==================== 技能定义 ====================

/** 技能运行时定义（用于注册和执行） */
export interface SkillDefinition {
  /** 技能唯一标识（如 "xj101_skill1"） */
  id: string;
  /** 技能名称（中文） */
  name: string;
  /** 所属角色编码（如 "XJ101"） */
  heroCode: string;
  /**
   * 触发时机（单触发器，向后兼容）
   * 新技能应使用 triggers 数组
   */
  trigger?: SkillTrigger;
  /**
   * 触发时机列表（多触发器，来自 OCCURS 编码）
   * 技能在任一触发器匹配时激活
   */
  triggers?: SkillTrigger[];
  /**
   * 原始 OCCURS 编码（来自 skills.json，如 "!R$Z1"）
   * 用于调试和交叉验证
   */
  occurs?: string;
  /** 是否为强制技能（[!] 标记，条件满足时自动触发） */
  isForced: boolean;
  /** 条件检查函数 */
  condition: SkillCondition;
  /** 效果执行函数 */
  effect: SkillEffect;
  /** 技能优先级（数值越大越先触发） */
  priority?: number;
  /** 是否为一次性技能（使用后标记为 used） */
  isOnce?: boolean;
}

// ==================== 技能注册表接口 ====================

/** 技能注册表接口 */
export interface ISkillRegistry {
  /** 注册技能 */
  register(skill: SkillDefinition): void;
  /** 批量注册技能 */
  registerAll(skills: SkillDefinition[]): void;
  /** 根据触发时机获取技能列表 */
  getByTrigger(trigger: SkillTrigger): SkillDefinition[];
  /** 根据角色编码获取技能列表 */
  getByHeroCode(heroCode: string): SkillDefinition[];
  /** 根据技能 ID 获取技能 */
  getById(skillId: string): SkillDefinition | undefined;
  /** 获取所有已注册技能 */
  getAll(): SkillDefinition[];
}

// ==================== 技能解析器接口 ====================

/** 技能解析器接口 */
export interface ISkillResolver {
  /** 解析并执行技能 */
  resolve(
    G: GameState,
    trigger: SkillTrigger,
    context: Omit<SkillRuntimeContext, 'trigger'>
  ): void;
  /** 解析并执行指定角色的技能 */
  resolveForHero(
    G: GameState,
    heroInstanceId: string,
    trigger: SkillTrigger,
    context: Omit<SkillRuntimeContext, 'trigger' | 'heroInstanceId'>
  ): void;
}
