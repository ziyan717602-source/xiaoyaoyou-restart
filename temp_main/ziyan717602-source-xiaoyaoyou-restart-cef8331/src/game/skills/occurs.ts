/**
 * OCCURS 编码解析器
 *
 * 将 skills.json 中的 OCCURS 编码转换为 SkillTrigger 枚举值。
 *
 * OCCURS 格式: [lock][scope][phase/event]
 * - lock: ! = 强制, ? = 条件可选, 空 = 可选
 * - scope: # = 自己, * = 任意玩家, $ = 其他玩家 (回合阶段)
 *          0 = 玩家级, 1 = 全局, 2 = 系统级 (游戏事件)
 * - phase/event: 2字符代码
 *
 * 参考: reference/psd48-master/PSDGamepkg/XIR.cs (回合流程)
 * 参考: reference/psd48-master/PSDGamepkg/XI.cs (事件注册)
 */

import { SkillTrigger } from '../../shared/types/enums';

// ==================== 回合阶段映射 ====================

/** R[scope][phase] → SkillTrigger 映射 */
const ROUND_PHASE_MAP: Record<string, Record<string, SkillTrigger>> = {
  // 阶段代码 → scope映射
  ST: {
    '#': SkillTrigger.ROUND_START_SELF,
    '*': SkillTrigger.ROUND_START_ANY,
    '$': SkillTrigger.ROUND_START_OTHER,
  },
  GR: {
    '#': SkillTrigger.SKILL_PHASE_SELF,
    '*': SkillTrigger.SKILL_PHASE_ANY,
  },
  GE: {
    '#': SkillTrigger.SKILL_END_SELF,
    '$': SkillTrigger.SKILL_END_OTHER,
  },
  TM: {
    '#': SkillTrigger.TURN_END_SELF,
    '*': SkillTrigger.TURN_END_ANY,
    '$': SkillTrigger.TURN_END_OTHER,
  },
  IC: {
    '#': SkillTrigger.TURN_END_CONFIRM_SELF,
  },
  BC: {
    '#': SkillTrigger.DRAW_PHASE_SELF,
  },
  OC: {
    '#': SkillTrigger.ROUND_PREP_SELF,
  },
  EP: {
    '#': SkillTrigger.EVENT_PREP_SELF,
  },
  EV: {
    '#': SkillTrigger.EVENT_PHASE_SELF,
  },
  EE: {
    '#': SkillTrigger.EVENT_END_SELF,
  },
  ED: {
    '#': SkillTrigger.ROUND_END_SELF,
  },
  Z1: {
    '#': SkillTrigger.COMBAT_START_SELF,
    '*': SkillTrigger.COMBAT_START_ANY,
    '$': SkillTrigger.COMBAT_START_OTHER,
  },
  ZC: {
    '#': SkillTrigger.BATTLE_CARD_CONFIRM_SELF,
    '*': SkillTrigger.BATTLE_CARD_CONFIRM_ANY,
    '$': SkillTrigger.BATTLE_CARD_CONFIRM_OTHER,
  },
  ZD: {
    '*': SkillTrigger.BATTLE_CARD_ANY,
  },
  ZN: {
    '*': SkillTrigger.BATTLE_RESULT_ANY,
  },
  VS: {
    '#': SkillTrigger.COMBAT_FAIL_SELF,
    '*': SkillTrigger.COMBAT_FAIL_ANY,
  },
  ZW: {
    '#': SkillTrigger.COMBAT_END_SELF,
    '*': SkillTrigger.COMBAT_END_ANY,
  },
  ZF: {
    '#': SkillTrigger.COMBAT_CLEANUP_SELF,
  },
  Z2: {
    '*': SkillTrigger.COMBAT_END_PREP_ANY,
  },
  ZU: {
    '#': SkillTrigger.SUPPORT_CONFIRM_SELF,
    '*': SkillTrigger.SUPPORT_CONFIRM_ANY,
  },
  ZM: {
    '#': SkillTrigger.MONSTER_REVEAL_SELF,
  },
  QR: {
    '#': SkillTrigger.DISCARD_PHASE_SELF,
  },
};

// ==================== 游戏事件映射 ====================

/** G[scope][event] → SkillTrigger 映射 */
const GAME_EVENT_MAP: Record<string, Record<string, SkillTrigger>> = {
  // G0 事件（玩家级）
  IS: { '0': SkillTrigger.HERO_ENTER },
  OS: { '0': SkillTrigger.HERO_LEAVE },
  HD: { '0': SkillTrigger.PET_GAINED },
  HL: { '0': SkillTrigger.PET_LOST },
  OH: { '0': SkillTrigger.ON_HP_DAMAGE },
  ZW: { '0': SkillTrigger.ON_DEATH },
  ZH: { '0': SkillTrigger.ON_HP_ZERO },
  DH: { '0': SkillTrigger.ON_HAND_CHANGE },
  IH: { '0': SkillTrigger.ON_HP_RECOVER },
  HT: { '0': SkillTrigger.ON_DRAW_CARDS },
  QR: { '0': SkillTrigger.ON_DISCARD_CHECK },
  DS: { '0': SkillTrigger.ON_IMMOBILIZE },
  CC: { '0': SkillTrigger.ON_TECH_USED },
  CD: { '0': SkillTrigger.ON_CARD_PLAYED },
  WB: { '0': SkillTrigger.ON_PET_POWER },
  '9P': { '0': SkillTrigger.ON_HIT_CHECK },
  TT: { '0': SkillTrigger.ON_DICE_ROLL },
  IT: { '0': SkillTrigger.ON_ITEM_ENTER },
  OT: { '0': SkillTrigger.ON_ITEM_LEAVE },
  IC: { '0': SkillTrigger.ON_EQUIP_ENTER },
  OC: { '0': SkillTrigger.ON_EQUIP_LEAVE },
  IX: { '0': SkillTrigger.ON_WEAPON_ENTER },
  OX: { '0': SkillTrigger.ON_WEAPON_LEAVE },
  IW: { '0': SkillTrigger.ON_ARMOR_ENTER },
  OW: { '0': SkillTrigger.ON_ARMOR_LEAVE },
  IY: { '0': SkillTrigger.ON_TRANSFORM },
  OY: { '0': SkillTrigger.ON_FINAL_LEAVE },
  AX: { '0': SkillTrigger.ON_RESET_AX },
  ZB: { '0': SkillTrigger.ON_ACCESSORY_EQUIP },
  FI: { '0': SkillTrigger.ON_FIELD_CHANGE },
  OJ: { '0': SkillTrigger.ON_OBJECT_JOIN },
  HC: { '0': SkillTrigger.ON_HP_CHANGE },
  HZ: { '0': SkillTrigger.ON_HP_ZERO_CHAIN },
  WN: { '0': SkillTrigger.ON_VICTORY },

  // G1 事件（全局）
  CH: { '1': SkillTrigger.GLOBAL_SUPPORT_HIT },
  TH: { '1': SkillTrigger.GLOBAL_HP_DECREASE },
  SG: { '1': SkillTrigger.GLOBAL_PRE_REVEAL },
  EV: { '1': SkillTrigger.GLOBAL_EVENT_PHASE },
  GE: { '1': SkillTrigger.GLOBAL_COMBAT_RESULT },
  DI: { '1': SkillTrigger.GLOBAL_DRAW },
  IZ: { '1': SkillTrigger.GLOBAL_WEAPON_EQUIP },
  OZ: { '1': SkillTrigger.GLOBAL_WEAPON_REMOVE },
  ZK: { '1': SkillTrigger.GLOBAL_CLOSE_POOL },
  WJ: { '1': SkillTrigger.GLOBAL_MONSTER_EXHAUST },
  LY: { '1': SkillTrigger.GLOBAL_LOYALTY },
  YP: { '1': SkillTrigger.GLOBAL_NPC_EFFECT },
  UE: { '1': SkillTrigger.GLOBAL_EVENT_USE },
};

// ==================== 寄生触发映射 ====================

/** &[card]&[type] → SkillTrigger 映射 */
const PARASITISM_MAP: Record<string, SkillTrigger> = {
  'TP01,0': SkillTrigger.CARD_BINGXINJUE,
  'TP02,0': SkillTrigger.CARD_LINGHU,
  'TP02,1': SkillTrigger.CARD_LINGHU,
  'TP03,0': SkillTrigger.CARD_YINGU,
  'TP04,0': SkillTrigger.CARD_DONGMING,
};

// ==================== 别名映射 ====================

/** %N → SkillTrigger 映射 */
const ALIAS_MAP: Record<number, SkillTrigger> = {
  1: SkillTrigger.ALIAS_TECH_USE,
  2: SkillTrigger.ALIAS_SPECIAL_USE,
  4: SkillTrigger.ALIAS_ANY_CARD_USE,
  5: SkillTrigger.ALIAS_TECH_POST,
  7: SkillTrigger.ALIAS_YINGU,
};

// ==================== 解析函数 ====================

/**
 * 解析单个 OCCURS 代码为 SkillTrigger
 *
 * @param occurs - 单个 OCCURS 代码（如 "!R$Z1", "G0IS", "&TP01&0", "%5"）
 * @returns 对应的 SkillTrigger，无法解析时返回 null
 */
export function parseOccur(occurs: string): SkillTrigger | null {
  // 移除 lock 前缀 (!, ?)
  let code = occurs;
  if (code.startsWith('!') || code.startsWith('?')) {
    code = code.substring(1);
  }

  // 回合阶段: R[scope][phase]
  if (code.startsWith('R') && code.length >= 3) {
    const scope = code[1]; // #, *, $
    const phase = code.substring(2); // ST, GR, TM, etc.
    const phaseMap = ROUND_PHASE_MAP[phase];
    if (phaseMap && phaseMap[scope]) {
      return phaseMap[scope];
    }
    // 对于未精确映射的回合阶段，尝试通用匹配
    console.warn(`[OCCURS] 未映射的回合阶段: ${occurs} (scope=${scope}, phase=${phase})`);
    return null;
  }

  // 游戏事件: G[scope][event]
  if (code.startsWith('G') && code.length >= 3) {
    const scope = code[1]; // 0, 1, 2
    const event = code.substring(2); // IS, OS, HD, etc.
    const eventMap = GAME_EVENT_MAP[event];
    if (eventMap && eventMap[scope]) {
      return eventMap[scope];
    }
    console.warn(`[OCCURS] 未映射的游戏事件: ${occurs} (scope=${scope}, event=${event})`);
    return null;
  }

  // 寄生触发: &[card]&[type]
  if (code.startsWith('&')) {
    const parts = code.substring(1).split('&');
    if (parts.length >= 2) {
      const key = `${parts[0]},${parts[1]}`;
      if (PARASITISM_MAP[key]) {
        return PARASITISM_MAP[key];
      }
    }
    console.warn(`[OCCURS] 未映射的寄生触发: ${occurs}`);
    return null;
  }

  // 别名触发: %N
  if (code.startsWith('%')) {
    const aliasNum = parseInt(code.substring(1), 10);
    if (ALIAS_MAP[aliasNum]) {
      return ALIAS_MAP[aliasNum];
    }
    console.warn(`[OCCURS] 未映射的别名: ${occurs}`);
    return null;
  }

  console.warn(`[OCCURS] 无法解析: ${occurs}`);
  return null;
}

/**
 * 解析 OCCURS 字符串（可能包含多个逗号分隔的触发器）
 *
 * @param occursStr - OCCURS 字符串（如 "!R$Z1,!G0IS"）
 * @returns SkillTrigger 数组
 */
export function parseOccurs(occursStr: string): SkillTrigger[] {
  const parts = occursStr.split(',');
  const triggers: SkillTrigger[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) {
      const trigger = parseOccur(trimmed);
      if (trigger) {
        triggers.push(trigger);
      }
    }
  }

  return triggers;
}

/**
 * 从 OCCURS 字符串提取 isForced 标志
 * ! 前缀 = 强制, ? 前缀 = 条件可选, 无前缀 = 可选
 *
 * @param occursStr - OCCURS 字符串
 * @returns true = 强制, false = 可选
 */
export function isForcedFromOccurs(occursStr: string): boolean {
  return occursStr.startsWith('!');
}
