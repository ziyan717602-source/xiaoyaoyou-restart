/**
 * 仙剑逍遥游 - GameState 类型定义
 * Phase 1：数据层
 *
 * 定义 boardgame.io 的 GameState（G）接口。
 * G 必须是纯数据，可 JSON 序列化，禁止存入函数或类实例。
 * G 中卡牌只存 instanceId（字符串），不存完整对象。
 *
 * 阶段流转：Turn Start → Event → Skill → Combat → Draw → Discard → Turn End
 * 战斗子流程：选支援/妨碍 → 翻怪+命中 → 战斗开始 → 出场效果 → 战牌 → 结算 → 结束
 */

import { PhaseType, CombatStage, Team } from './enums';
import { CardInstance, MonsterInstance, EventInstance, NpcInstance } from './card';
import { HeroInstance } from './hero';
import { SkillInstance } from './skill';

// ==================== 牌堆状态 ====================

/** 牌堆状态 */
export interface PileState {
  /** 手牌堆（卡牌实例 ID 列表） */
  handPile: string[];
  /** 事件牌堆 */
  eventPile: string[];
  /** 怪物/NPC 混合牌堆 */
  monsterPile: string[];
  /** 弃牌堆 */
  discardPile: string[];
  /** 牌堆顶部索引（用于翻牌） */
  topIndex: Record<string, number>;
}

// ==================== 玩家状态 ====================

/** 玩家状态 */
export interface PlayerState {
  /** 玩家 ID */
  id: string;
  /** 玩家昵称 */
  name: string;
  /** 所属队伍 */
  team: Team;
  /** 座位号（决定回合顺序） */
  seatNumber: number;
  /** 角色实例 ID */
  heroInstanceId: string;
  /** 手牌实例 ID 列表 */
  hand: string[];
  /** 手牌上限（默认3，可被技能修改） */
  handLimit: number;
  /** 是否已行动（回合内） */
  hasActed: boolean;
  /** 是否已跳过战斗 */
  skippedCombat: boolean;
  /** 是否被横置（下回合跳过除弃牌外的所有阶段） */
  immobilized: boolean;
  /** 是否存活 */
  isAlive: boolean;
  /** 是否已使用过倾慕（每局限1次） */
  loved: boolean;
  /** 回合内记忆（RAM，每回合重置） */
  ram: Record<string, unknown>;
  /** 回合记忆（RFM，当前回合内持续） */
  rfm: Record<string, unknown>;
}

// ==================== 战斗状态 ====================

/** 战斗参与者 */
export interface CombatParticipant {
  /** 玩家 ID */
  playerId: string;
  /** 角色实例 ID */
  heroInstanceId: string;
  /** 是否为支援者 */
  isSupporter: boolean;
  /** 是否为妨碍者 */
  isHinderer: boolean;
}

/** 战斗出牌记录 */
export interface CombatCardPlay {
  /** 玩家 ID */
  playerId: string;
  /** 卡牌实例 ID */
  cardInstanceId: string;
  /** 出牌顺序 */
  order: number;
}

/** 战斗状态 */
export interface CombatState {
  /** 当前战斗阶段 */
  stage: CombatStage;
  /** 怪物实例 ID */
  monsterInstanceId: string;
  /** 支援者玩家 ID */
  supporterPlayerId: string | null;
  /** 支援者角色实例 ID */
  supporterHeroInstanceId: string | null;
  /** 妨碍者玩家 ID */
  hindererPlayerId: string | null;
  /** 妨碍者角色实例 ID */
  hindererHeroInstanceId: string | null;
  /** 所有参与者 */
  participants: CombatParticipant[];
  /** 战牌出牌记录 */
  cardPlays: CombatCardPlay[];
  /** 当前出牌玩家 ID */
  currentPlayerId: string | null;
  /** 战斗是否结束 */
  isFinished: boolean;
  /** 战斗结果（胜利/失败/平局） */
  result: 'WIN' | 'LOSE' | 'DRAW' | null;
  /** 攻击方战力池 */
  attackerPool: number;
  /** 怪物方战力池 */
  monsterPool: number;
}

// ==================== 事件状态 ====================

/** 事件状态 */
export interface EventState {
  /** 当前事件实例 ID */
  currentEventInstanceId: string | null;
  /** 事件是否已处理 */
  processed: boolean;
}

// ==================== GameState（G） ====================

/** GameState（G）接口 - boardgame.io 游戏状态 */
export interface GameState {
  /** 当前游戏阶段 */
  currentPhase: PhaseType;
  /** 当前回合玩家 ID */
  currentPlayerId: string;
  /** 回合数 */
  turnCount: number;
  /** 游戏是否结束 */
  isGameOver: boolean;
  /** 获胜队伍 */
  winnerTeam: Team | null;

  /** 牌堆状态 */
  piles: PileState;
  /** 玩家状态映射（playerId → PlayerState） */
  players: Record<string, PlayerState>;
  /** 角色实例映射（instanceId → HeroInstance） */
  heroInstances: Record<string, HeroInstance>;
  /** 手牌实例映射（instanceId → CardInstance） */
  cardInstances: Record<string, CardInstance>;
  /** 怪物实例映射（instanceId → MonsterInstance） */
  monsterInstances: Record<string, MonsterInstance>;
  /** 事件实例映射（instanceId → EventInstance） */
  eventInstances: Record<string, EventInstance>;
  /** NPC 实例映射（instanceId → NpcInstance） */
  npcInstances: Record<string, NpcInstance>;
  /** 技能实例映射（instanceId → SkillInstance） */
  skillInstances: Record<string, SkillInstance>;

  /** 当前战斗状态（null 表示不在战斗中） */
  combat: CombatState | null;
  /** 当前事件状态 */
  event: EventState;

  /** 待处理的打断窗口（如隐蛊/冰心诀） */
  pendingInterrupts: PendingInterrupt[];
  /** 待处理的选择（如弃牌选择） */
  pendingChoices: PendingChoice[];
}

// ==================== 待处理状态 ====================

/** 待处理的打断窗口 */
export interface PendingInterrupt {
  /** 打断 ID */
  id: string;
  /** 触发者玩家 ID */
  triggerPlayerId: string;
  /** 可响应的玩家 ID 列表 */
  availablePlayerIds: string[];
  /** 已响应的玩家 ID 列表 */
  respondedPlayerIds: string[];
  /** 超时时间（毫秒） */
  timeoutMs: number;
  /** 打断类型（如 HIDE_BUG、ICE_HEART） */
  type: string;
}

/** 待处理的选择 */
export interface PendingChoice {
  /** 选择 ID */
  id: string;
  /** 玩家 ID */
  playerId: string;
  /** 选择类型（如 DISCARD、TARGET） */
  type: string;
  /** 可选项列表 */
  options: string[];
  /** 已选项列表 */
  selected: string[];
  /** 是否多选 */
  multiSelect: boolean;
  /** 最少选择数量 */
  minCount: number;
  /** 最多选择数量 */
  maxCount: number;
}
