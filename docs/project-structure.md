# 项目结构详解

> 完整的文件目录结构与每个文件的职责说明。

```
xiaoyaoyou-restart/
├── reference/                          # 参考资料（psd48-master 已 gitignore）
│   ├── docs/                           # 游戏规则、卡牌信息、开发边界
│   │   ├── scope.md                    # 开发范围边界（硬性约束）
│   │   ├── game-flow.md                # 游戏流程规则
│   │   ├── card-info.md                # 卡牌信息全表
│   │   └── 现有的资源.md               # 现有资源清单
│   └── psd48-master/                   # 原版 C# WPF 实现（仅参考）
│
├── route/                              # 实施路线文档
│   ├── 统一实施路线.md                 # 综合四份 AI 建议的唯一指导路线
│   └── AI的路线指引和推荐的插件.md     # 原始 AI 建议汇总
│
├── docs/                               # 项目文档
│   ├── project-structure.md            # 本文件
│   ├── architecture.md                 # 系统架构
│   └── development.md                  # 开发环境指南
│
└── src/
    │
    ├── game/                           # ━━ boardgame.io 游戏引擎 ━━
    │   ├── Game.ts                     # 主入口，导出 XiaoyaoyouGame 对象
    │   ├── setup.ts                    # 游戏初始化（洗牌、发牌、选将）
    │   ├── constants.ts                # 游戏常量（手牌上限、阶段名枚举等）
    │   │
    │   ├── phases/                     # 回合阶段定义
    │   │   ├── index.ts                # 统一导出
    │   │   ├── turnStart.ts            # 回合开始（触发回合开始技能、横置跳过）
    │   │   ├── event.ts                # 事件阶段（翻事件牌或跳过）
    │   │   ├── skill.ts                # 技牌阶段（使用技牌、放置装备、发动技能）
    │   │   ├── combat.ts               # 战斗阶段（含7步子流程，用 stages 实现）
    │   │   ├── draw.ts                 # 补牌阶段
    │   │   ├── discard.ts              # 弃牌阶段（手牌上限3/5）
    │   │   └── turnEnd.ts              # 回合结束
    │   │
    │   ├── moves/                      # 玩家动作（纯函数，只修改 G）
    │   │   ├── index.ts                # 统一导出
    │   │   ├── drawCards.ts            # 摸牌（含牌堆耗尽重洗）
    │   │   ├── discardCards.ts         # 弃牌
    │   │   ├── playTuxCard.ts          # 使用技牌
    │   │   ├── equipCard.ts            # 装备武器/防具
    │   │   ├── unequipCard.ts          # 卸下装备
    │   │   ├── useItem.ts              # 使用特殊牌（隐蛊、冰心诀等）
    │   │   ├── selectSupport.ts        # 选择支援者
    │   │   ├── selectHinder.ts         # 选择妨碍者
    │   │   ├── playCombatCard.ts       # 出战牌
    │   │   ├── skipPlay.ts             # 跳过出牌
    │   │   ├── triggerCombat.ts        # 触发战斗（打怪）
    │   │   ├── skipCombat.ts           # 放弃战斗
    │   │   ├── useNpc.ts               # 使用 NPC 效果
    │   │   └── respond.ts              # 响应窗口（隐蛊/冰心诀）
    │   │
    │   ├── skills/                     # 角色技能系统
    │   │   ├── index.ts                # 技能注册表（按触发时机索引）
    │   │   ├── resolver.ts             # 技能解析器（遍历→检查→执行）
    │   │   ├── types.ts                # 技能接口定义
    │   │   ├── xianjian1.ts            # 仙剑一（李逍遥、赵灵儿、林月如等 7 角色）
    │   │   ├── xianjian2.ts            # 仙剑二（王小虎、苏媚、魔尊等 5 角色）
    │   │   ├── xianjian3.ts            # 仙剑三+外传（唐雪见、重楼、温慧等 7 角色）
    │   │   ├── xianjian4.ts            # 仙剑四（云天河、慕容紫英等 5 角色）
    │   │   ├── xianjian5.ts            # 仙剑五（龙幽、小蛮 2 角色）
    │   │   └── fengming.ts             # 凤鸣玉誓扩展（龙葵、魔翳、湮世穹兵等 8 角色）
    │   │
    │   ├── engine/                     # 核心引擎（纯函数工具）
    │   │   ├── combat.ts               # 战力计算（基础+装备+宠物+技能+战牌）
    │   │   ├── hitCheck.ts             # 命中判定
    │   │   ├── damage.ts               # 伤害处理（含装备减伤检查）
    │   │   ├── death.ts                # 死亡处理（倾慕链递归）
    │   │   ├── transform.ts            # 变身系统（赵灵儿↔梦蛇、魔尊等）
    │   │   ├── interrupt.ts            # 打断窗口（暂停→等待响应→继续）
    │   │   └── pile.ts                 # 牌堆管理（抽牌、重洗、混合）
    │   │
    │   └── monsters/                   # 怪物效果系统
    │       ├── index.ts                # 怪物效果注册表
    │       ├── effects.ts              # 20 个怪物的 4 效果槽位（出场/胜利/失败/宠物）
    │       └── npc.ts                  # 26 个 NPC 的 9 种效果
    │
    ├── shared/                         # ━━ 前后端共享 ━━
    │   ├── types/                      # TypeScript 类型定义
    │   │   ├── index.ts                # 统一导出
    │   │   ├── card.ts                 # 卡牌类型（TuxCard、MonsterCard、EventCard、NpcCard）
    │   │   ├── hero.ts                 # 角色类型（StaticHeroDef、HeroInstance）
    │   │   ├── monster.ts              # 怪物类型（StaticMonsterDef、MonsterInstance）
    │   │   ├── skill.ts                # 技能类型（触发时机、效果类型）
    │   │   ├── equipment.ts            # 装备类型（武器/防具/饰品）
    │   │   ├── game.ts                 # GameState（G）接口、PlayerState 接口
    │   │   └── enums.ts                # 枚举（PhaseType、CardType、Element、DamageType 等）
    │   │
    │   ├── data/                       # psd.db3 导出的游戏数据
    │   │   ├── index.ts                # 数据加载与导出
    │   │   ├── heroes.json             # 34 角色
    │   │   ├── monsters.json           # 20 怪物
    │   │   ├── tux.json                # 56 手牌
    │   │   ├── npcs.json               # 26 NPC
    │   │   ├── events.json             # 14 事件
    │   │   ├── skills.json             # 技能数据
    │   │   ├── runes.json              # 符文数据
    │   │   └── exsp.json               # 特殊能力数据
    │   │
    │   └── utils/                      # 共享工具函数
    │       ├── random.ts               # 随机数（封装 ctx.random）
    │       ├── id.ts                   # ID 生成（nanoid 封装）
    │       └── validation.ts           # zod 运行时类型校验
    │
    ├── ui/                             # ━━ React 前端 ━━
    │   ├── main.tsx                    # 入口文件
    │   ├── App.tsx                     # 根组件（路由、Client 初始化）
    │   │
    │   ├── components/                 # 通用 UI 组件（shadcn/ui 风格）
    │   │   ├── Card.tsx                # 卡牌基础组件（正面/背面/翻转）
    │   │   ├── CardTooltip.tsx         # 卡牌悬浮详情
    │   │   ├── Button.tsx              # 按钮（确认/跳过/结束）
    │   │   ├── Dialog.tsx              # 模态弹窗（怪物登场剧场）
    │   │   ├── Toast.tsx               # 操作提示（HP-2、战力+3）
    │   │   ├── Popover.tsx             # 气泡（NPC 二选一）
    │   │   ├── ProgressBar.tsx         # 进度条（HP 条、倒计时）
    │   │   └── Icon.tsx                # 图标（五行属性、战力、命中）
    │   │
    │   ├── board/                      # 游戏面板组件
    │   │   ├── GameBoard.tsx           # 主游戏面板（布局容器）
    │   │   ├── PlayerArea.tsx          # 玩家区域（头像、HP、装备、宠物）
    │   │   ├── HandArea.tsx            # 手牌区（扇形布局 + 拖拽）
    │   │   ├── CombatArea.tsx          # 战斗区（怪物、战力对比、支援/妨碍）
    │   │   ├── MonsterSlot.tsx         # 怪物槽（翻取动画）
    │   │   ├── EventLog.tsx            # 游戏日志（滚动文字）
    │   │   └── PhaseIndicator.tsx      # 阶段指示器
    │   │
    │   ├── features/                   # 功能页面
    │   │   ├── RoomLobby.tsx           # 房间大厅（创建/加入/列表）
    │   │   ├── HeroSelect.tsx          # 选将界面（随机 3 选 1）
    │   │   ├── GameSetup.tsx           # 游戏设置（人数、模式）
    │   │   └── GameOver.tsx            # 游戏结束（胜负结算）
    │   │
    │   └── hooks/                      # 自定义 Hooks
    │       ├── useGameClient.ts        # boardgame.io Client 封装
    │       ├── useGameInput.ts         # 游戏输入状态机（选中→高亮→提交）
    │       ├── useGameMoves.ts         # Moves 调用封装
    │       └── useUIStore.ts           # Zustand Store（纯 UI 状态）
    │
    ├── server/                         # ━━ 服务端 ━━
    │   ├── index.ts                    # 服务端入口（boardgame.io Server）
    │   └── config.ts                   # 配置（端口、CORS、房间等）
    │
    ├── assets/                         # ━━ 静态资源 ━━
    │   ├── cards/                      # 卡图（从 PSDRisoLib 复制）
    │   │   ├── heroes/                 # 角色卡图（resources_card_heros_*）
    │   │   ├── monsters/               # 怪物卡图（resources_card_nmb_*）
    │   │   ├── tux/                    # 手牌卡图（resources_card_tux_*）
    │   │   ├── events/                 # 事件卡图（resources_card_eve_*）
    │   │   └── back/                   # 卡背（纯色渐变）
    │   └── icons/                      # 图标资源
    │
    ├── styles/                         # ━━ 全局样式 ━━
    │   ├── globals.css                 # Tailwind 入口 + 全局样式
    │   └── animations.css              # 自定义动画 keyframes
    │
    └── tests/                          # ━━ 测试 ━━
        ├── game/                       # 游戏引擎测试
        │   ├── setup.test.ts
        │   └── phases.test.ts
        ├── moves/                      # 动作测试
        │   ├── drawCards.test.ts
        │   ├── playTuxCard.test.ts
        │   └── combat.test.ts
        └── skills/                     # 技能测试
            ├── xianjian1.test.ts
            └── death.test.ts
```

## 目录职责速查

| 目录 | 职责 | 关键文件 |
|------|------|---------|
| `src/game/` | boardgame.io 游戏引擎 | `Game.ts`（主入口）、`setup.ts`（初始化） |
| `src/game/phases/` | 回合阶段定义 | `combat.ts`（最复杂，含 7 步子流程） |
| `src/game/moves/` | 玩家动作（纯函数） | `playTuxCard.ts`、`respond.ts`（打断窗口） |
| `src/game/skills/` | 角色技能系统 | `resolver.ts`（技能解析器）、按系列分组文件 |
| `src/game/engine/` | 核心引擎工具 | `combat.ts`（战力计算）、`death.ts`（倾慕链） |
| `src/game/monsters/` | 怪物/NPC 效果 | `effects.ts`（20 怪物）、`npc.ts`（26 NPC） |
| `src/shared/types/` | TypeScript 类型 | `game.ts`（G 接口）、`enums.ts`（所有枚举） |
| `src/shared/data/` | 游戏数据 JSON | `heroes.json`、`monsters.json`、`tux.json` |
| `src/shared/utils/` | 共享工具 | `random.ts`（封装 ctx.random） |
| `src/ui/components/` | 通用 UI 组件 | `Card.tsx`、`Dialog.tsx`、`Toast.tsx` |
| `src/ui/board/` | 游戏面板 | `GameBoard.tsx`、`HandArea.tsx`、`CombatArea.tsx` |
| `src/ui/features/` | 功能页面 | `RoomLobby.tsx`、`HeroSelect.tsx` |
| `src/ui/hooks/` | 自定义 Hooks | `useGameClient.ts`、`useUIStore.ts` |
| `src/server/` | 服务端 | `index.ts`（boardgame.io Server） |
| `src/assets/` | 静态资源 | `cards/`（卡图）、`icons/` |
| `src/tests/` | 测试 | 按 game/moves/skills 分组 |
