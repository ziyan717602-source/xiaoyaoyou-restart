/**
 * 仙剑逍遥游 - 类型统一导出
 * Phase 1：数据层
 *
 * 统一导出所有类型定义，方便其他模块引用。
 */

// 枚举类型
export {
  PhaseType,
  CardType,
  Element,
  DamageType,
  SkillTrigger,
  CombatStage,
  Team,
  Gender,
  CardOwner,
} from './enums';

// 卡牌类型
export type {
  StaticCardBase,
  StaticCardDef,
  StaticMonsterDef,
  StaticEventDef,
  StaticNpcDef,
  CardBuff,
  CardInstance,
  MonsterInstance,
  EventInstance,
  NpcInstance,
  TuxCard,
  MonsterCard,
  EventCard,
  NpcCard,
} from './card';

// 角色类型
export type {
  StaticHeroDef,
  HeroInstance,
  EquipmentSlot,
  TransformRelation,
  HeroSelection,
} from './hero';

// 怪物类型
export type {
  StaticMonsterDef as StaticMonsterDefFull,
  MonsterInstance as MonsterInstanceFull,
  SpiMask,
  MonsterEffect,
} from './monster';

export { MonsterEffectSlot } from './monster';

// 技能类型
export type {
  StaticSkillDef,
  SkillTriggerCondition,
  SkillInstance,
  SkillContext,
  SkillEffect,
} from './skill';

export { SkillType, SkillEffectType } from './skill';

// 装备类型
export type {
  WeaponDef,
  ArmorDef,
  EquipmentSlotState,
  EquipmentRule,
} from './equipment';

export { EquipmentType, EquipmentSlotType } from './equipment';

// GameState 类型
export type {
  PileState,
  PlayerState,
  CombatParticipant,
  CombatCardPlay,
  CombatState,
  EventState,
  GameState,
  PendingInterrupt,
  PendingChoice,
} from './game';
