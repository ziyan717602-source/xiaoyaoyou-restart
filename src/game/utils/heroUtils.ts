/**
 * 角色工具函数
 *
 * 提供角色相关的查询功能：
 * - 性别判断（从 heroes.json 加载）
 * - 角色属性查询
 */

import { heroes } from '../../shared/data';

/**
 * 获取角色性别
 * @param staticId 角色静态ID
 * @returns 'M' 为男性，'F' 为女性，null 为未找到
 */
export function getHeroGender(staticId: number): 'M' | 'F' | null {
  const heroData = heroes.find(h => h.ID === staticId);
  if (!heroData) return null;
  return heroData.GENDER as 'M' | 'F';
}

/**
 * 判断角色是否为男性
 */
export function isMaleHero(staticId: number): boolean {
  return getHeroGender(staticId) === 'M';
}

/**
 * 判断角色是否为女性
 */
export function isFemaleHero(staticId: number): boolean {
  return getHeroGender(staticId) === 'F';
}

/**
 * 获取角色名称
 */
export function getHeroName(staticId: number): string | null {
  const heroData = heroes.find(h => h.ID === staticId);
  return heroData?.NAME ?? null;
}

/**
 * 获取角色基础属性
 */
export function getHeroBaseStats(staticId: number): { hp: number; str: number; dex: number } | null {
  const heroData = heroes.find(h => h.ID === staticId);
  if (!heroData) return null;
  return { hp: heroData.HP, str: heroData.STR, dex: heroData.DEX };
}
