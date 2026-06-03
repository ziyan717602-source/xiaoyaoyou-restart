# Phase 5：怪物/NPC 效果引擎

> 目标：实现 20 个怪物的完整效果和 NPC 系统。
> 预计耗时：3-5 天
> 状态：✅ 已完成
> 前置依赖：Phase 3 完成

## 任务清单

### 5.1 怪物效果系统

- [x] `src/game/monsters/monsterEffects.ts` - 怪物效果注册表 + 20 个怪物的 4 效果槽位

**水属性（4 怪物）：**
- [x] 千杯不醉 GS01：出场与妨碍者手牌对调，失败横置，宠物战力+1
- [x] 勇气 GS02：胜利敌全体-1后指定-2，失败 HP-2+弃装备
- [x] 蛇妖男 GS03：胜利妨碍者 HP-4，失败 HP-4
- [x] 水魔兽 GS04：胜利敌全体-1+抽牌，失败 HP-2+抽牌，宠物战力+1命中+1

**火属性（4 怪物）：**
- [x] 赝月 GH01：胜利妨碍者 HP-2，失败 HP-3，宠物战力+1
- [x] 肥肥 GH02：胜利妨碍者 HP-3，失败 HP-3
- [x] 赤鬼王 GH03：出场支援者受伤=战力-1，胜利妨碍者 HP-3，失败触发者+支援者各3，宠物战力+2
- [x] 毒娘子 GH04：出场全体 HP-2，胜利敌全体 HP-2，失败触发者+支援者各2，宠物战力+2

**雷属性（4 怪物）：**
- [x] 暗香 GL01：胜利触发者 HP+2，失败 HP-3
- [x] 蝶精 GL02：出场支援者命中+2，胜利触发者补2张，失败 HP-2+弃装备补牌
- [x] 刑天 GL03：胜利弃牌 HP+2，失败弃装备+全场弃装备，宠物命中+2
- [x] 金蟾鬼母 GL04：胜利己方有装备补牌，失败己方全体 HP-2，宠物敌方武器无效

**风属性（4 怪物）：**
- [x] 璇龟 GF01：胜利触发者补1张，失败 HP-2
- [x] 句芒 GF02：胜利触发者 HP+2，失败敌方全体 HP+2，宠物战力+1
- [x] 五毒兽 GF03：胜利触发者+支援者各 HP+2，失败弃牌补牌+各 HP-2
- [x] 叶灵 GF04：胜利敌方 HP+2

**土属性（4 怪物）：**
- [x] 积粮隐者 GT01：胜利触发者+支援者各3，失败妨碍者 HP-3
- [x] 邪剑仙 GT02：出场非参战角色按手牌数扣血，宠物命中+1
- [x] 熔岩兽王 GT03：出场自身战力+3，胜利敌全体 HP-1，失败己方全体 HP-2

**阴属性（5 怪物）：**
- [x] 天鬼皇 GIT1：出场支援者战力+1，胜利己方队友补牌，失败 HP-3+弃装备补牌
- [x] 魔骨 GIT3：出场交换基础装备，胜利敌方有装备受伤，失败己方有装备受伤，宠物战力+1
- [x] 鬼将军 GIT4：出场战力+3，胜利妨碍者 HP-2，失败触发者+支援者各2，宠物战力+1
- [x] 积粮隐者·改 GIT5：出场战力+=存活人数，胜利敌全体-1，失败己方全体-1
- [x] 戾枭 GIT8：出场战力+2，胜利抽牌+伤害，失败妨碍者执行相同

**阳属性（7 怪物）：**
- [x] 句芒·阳 GYT1：出场手牌补至3张，胜利获五行标记，宠物战力+1命中+2
- [x] 千杯不醉·阳 GYT3：出场手牌调整至3张，胜利触发者补3张，失败妨碍者补3张，宠物战力+1命中+1手牌上限+1
- [x] 赤鬼王·阳 GYT4：出场失去正面标记，胜利弃牌+获标记，失败同胜利效果
- [x] 水魔兽·阳 GYT5：出场各弃1张，胜利敌方弃1张，宠物命中+1
- [x] 蝶精·阳 GYT6：出场非参战弃装备，胜利敌方弃装备，宠物战力+1
- [x] 金蟾鬼母·阳 GYT7：出场手牌超上限弃牌，胜利队友补至上限，宠物命中+1
- [x] 刑天·阳 GYT8：出场全体获负面标记，胜利掷骰补/弃牌，失败妨碍者执行相同

### 5.2 扩展包怪物（简化实现）

- [x] GST1~GTT2（Package 4#）：8 个扩展怪物简化效果
- [x] GSH1~GTH2（Package HL）：9 个 Boss 怪物简化效果

### 5.3 宠物系统

- [x] `src/game/engine/pet.ts` - 宠物操作
- [x] 获得宠物：obtainPet - 同属性唯一，自动替换
- [x] 失去宠物：releasePet - 触发Decr效果
- [x] 交换宠物：tradePets - 双方触发Decr/Incr
- [x] 宠物战力/属性查询

### 5.4 NPC 系统

- [x] `src/game/npcs/npcActions.ts` - 26 个 NPC 的 9 种效果

**NPC 行动类型：**
- [x] NJ01 加入：弃全部手牌，HP=手牌数×2（上限3）
- [x] NJ02 治疗：指定 1 人+1HP
- [x] NJ03 修炼：自己-1HP，指定 1 人补 1 张
- [x] NJ04 传功：补 1 张
- [x] NJ05 袭击：指定 1 人-1HP
- [x] NJ06 交易：指定 1 人交 1 张手牌给队友
- [x] NJ07 驯化：指定 1 人交 1 只宠物给队友
- [x] NJ08 盗窃：弃掉任意玩家 1 张手牌
- [x] NJ09 默认加入
- [x] NJT1 翻怪物堆
- [x] NJT2 选择符文
- [x] NJH1~NJH9 扩展包NPC效果

### 5.5 死亡处理

- [x] `src/game/engine/death.ts` - 死亡处理
- [x] 倾慕系统：handleDeath - 倾慕者扣1HP复活
- [x] 队伍胜负判定：checkTeamVictory
- [x] 复活角色：revivePlayer

### 5.6 战斗阶段集成

- [x] `src/game/phases/combat.ts` - 已集成怪物效果
- [x] 翻怪时执行 Debut 效果
- [x] 战斗结算时执行 WinEff/LoseEff
- [x] 胜利后自动捕获宠物
- [x] 死亡后检查队伍胜负

## C# 源码对照

| 文件 | 对照 | 说明 |
|------|------|------|
| PSDGamepkg/JNS/FG04.cs | monsters/monsterEffects.ts | 怪物Debut/WinEff/LoseEff/Pet |
| PSDGamepkg/JNS/NC303.cs | npcs/npcActions.ts | NPC行动效果 |
| PSDBase/Card/Monster.cs | types/card.ts | 怪物数据模型 |
| PSDBase/Card/Npc.cs | types/card.ts | NPC数据模型 |
| PSDBase/NCAction.cs | npcs/npcActions.ts | NPC行动数据 |
| PSDGamepkg/Artiad/Kitty.cs | engine/pet.ts | 宠物操作 |
| PSDBase/Board.cs | engine/death.ts | 死亡处理/倾慕 |

## 产出物

| 产出 | 路径 | 状态 |
|------|------|------|
| 怪物效果引擎 | `src/game/monsters/monsterEffects.ts` | ✅ |
| 宠物系统 | `src/game/engine/pet.ts` | ✅ |
| NPC行动系统 | `src/game/npcs/npcActions.ts` | ✅ |
| 死亡处理引擎 | `src/game/engine/death.ts` | ✅ |
| 战斗阶段（已集成） | `src/game/phases/combat.ts` | ✅ |
| 枚举类型更新 | `src/shared/types/enums.ts` | ✅ |
| Phase 5 跟踪文档 | `route/phase-tracking/phase-5.md` | ✅ |

## 待优化项

1. **交互简化**：部分需要玩家选择的效果（如GS02指定目标、GL01选择目标）简化为自动选择第一个目标
2. **复杂NPC效果**：NJH系列的Escue（爆发）效果简化处理
3. **掷骰判定**：GIT4/GYT8的掷骰效果简化为固定值
4. **五行标记**：GYT1/GYT4/GYT8的五行标记系统简化为RAM标记
5. **宠物同属性检查**：当前简化为CODE前2位匹配，实际应检查五行属性
