/**
 * 游戏数据导出
 *
 * 自动生成，请勿手动编辑
 */

import heroes from './heroes.json';
import monsters from './monsters.json';
import tux from './tux.json';
import npcs from './npcs.json';
import events from './events.json';
import skills from './skills.json';
import runes from './runes.json';
import exsp from './exsp.json';

export {
  heroes,
  monsters,
  tux,
  npcs,
  events,
  skills,
  runes,
  exsp
};

// 类型定义
export type HeroData = (typeof heroes)[number];
export type MonsterData = (typeof monsters)[number];
export type TuxData = (typeof tux)[number];
export type NpcData = (typeof npcs)[number];
export type EventData = (typeof events)[number];
export type SkillData = (typeof skills)[number];
export type RuneData = (typeof runes)[number];
export type ExspData = (typeof exsp)[number];
