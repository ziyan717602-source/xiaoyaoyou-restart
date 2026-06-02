# XIG.cs 源码标注文档

## 1. 文件概述

XIG.cs 是 XI 类的分部类实现，负责**游戏消息处理系统**。该文件是游戏引擎的消息中枢，处理：
- G消息（Game Message）的接收和分发
- 技能系统的优先级控制
- 各类游戏事件的处理逻辑（伤害、治疗、装备、宠物、手牌等）
- 简单消息（G2xx）的快速处理

在整个游戏系统中，XIG.cs 是**消息路由器和事件处理器**，将字符串格式的消息转换为具体的游戏逻辑执行。

## 2. 完整方法清单

### 2.1 核心消息处理方法

```csharp
public void RaiseGMessage(string cmd)
```
- **参数**: `cmd` - 游戏消息字符串（格式: G0xx,...）
- **返回值**: void
- **功能**: 触发游戏消息，是消息处理的主入口

```csharp
public void InnerGMessage(string cmd, int priorty)
```
- **参数**: `cmd` - 消息字符串, `priorty` - 优先级
- **返回值**: void
- **功能**: 内部消息处理，支持优先级控制和技能拦截

```csharp
private void SimpleGMessage(string cmd, int priority)
```
- **参数**: `cmd` - 消息字符串, `priority` - 优先级
- **返回值**: void
- **功能**: 无技能拦截时的基础消息处理

```csharp
private void SimpleGMessage100(string cmd)
```
- **参数**: `cmd` - 消息字符串
- **返回值**: void
- **功能**: 处理 G2xx 开头的简单消息

## 3. 核心逻辑流程

### 消息处理流程
```
RaiseGMessage(cmd)
    │
    ├─ G2xx: SimpleGMessage100() → 快速处理
    │
    └─ G0xx/G1xx: InnerGMessage() → 技能拦截 + 基础处理
         │
         ├─ 检查 sk02 映射表
         │
         ├─ 如果有技能:
         │    ├─ 解析技能包
         │    ├─ 按优先级排序
         │    ├─ 执行锁定技能
         │    ├─ 发送U1消息
         │    └─ 等待玩家响应
         │
         └─ 如果无技能:
              └─ SimpleGMessage() → 执行基础逻辑
```

### SimpleGMessage() 处理的消息类型

| 消息码 | 名称 | 功能 | 优先级处理 |
|--------|------|------|------------|
| G1TH | Harm Telegraph | 伤害预告 | 100: 预告, 200: 死亡检查 |
| G0ZH | Zero HP | 零血处理（倾慕机制） | 100: 倾慕计算, 200: 死亡标记 |
| G0ZW | Zero Win | 死亡结算 | 0: 标记, 100: 判定胜负, 200: 弃牌, 300: 补牌, 400: 离场 |
| G0OY | Out Yard | 离场处理 | 100: 清理装备/宠物/技能, 200: 重置状态, 300: 处理战斗 |
| G0CC | Card Cast | 使用卡牌准备 | 100: 记录待弃牌, 200: 执行卡牌效果, 300: 弃置待弃牌 |
| G0HZ | Hinder Zone | 妨碍区域 | 100: 设置Monster2, 200: 显示妨碍, 300: 计算战力 |
| G1WJ | Win Judge | 胜负判定 | 100: 计算宠物分数, 200: 判定胜负 |
| G1EV | Event | 事件翻牌 | 100: 翻牌, 200: 执行效果 |
| G0YM | Imperial | 场地消息 | 直接委托处理 |

### SimpleGMessage100() 处理的消息类型

#### 手牌相关
| 消息码 | 名称 | 功能 |
|--------|------|------|
| G0IT | Obtain Tux | 获得手牌（更新玩家手牌列表） |
| G0OT | Lose Tux | 失去手牌（从手牌/装备移除） |
| G0HQ | Hand Quality | 手牌交互（玩家间/牌堆/展示） |
| G0QZ | Quick Zone | 快速弃牌 |
| G0DH | Discard Hand | 弃牌（选择/随机/全部） |

#### 伤害/治疗
| 消息码 | 名称 | 功能 |
|--------|------|------|
| G0OH | Obtain Harm | 扣血（计算伤害、阴阳伤特殊处理） |
| G0IH | Obtain Heal | 回血（不超过上限） |
| G1CH | Cure Telegraph | 治疗预告 |

#### 属性修改
| 消息码 | 名称 | 功能 |
|--------|------|------|
| G0IA | Increase Attack | 增加攻击力（STR） |
| G0OA | Obtain Attack | 减少攻击力 |
| G0IX | Increase X (DEX) | 增加敏捷（DEX） |
| G0OX | Obtain X (DEX) | 减少敏捷 |
| G0IB | Increase Battle | 增加怪物战力 |
| G0OB | Obtain Battle | 减少怪物战力 |
| G0IW | Increase Wisdom | 增加怪物命中 |
| G0OW | Obtain Wisdom | 减少怪物命中 |

#### 装备相关
| 消息码 | 名称 | 功能 |
|--------|------|------|
| G0ZB | Zone Bind | 装备卡牌（标准/扩展/伪造） |
| G0ZC | Zone Consume | 消耗装备效果 |
| G0ZI | Zone Invalidate | 无效化装备 |
| G1ZK | Zone Kill | 战斗中标记装备待弃 |
| G0ZS | Zone Start | 装备生效 |
| G0ZL | Zone Leave | 装备失效 |

#### 宠物相关
| 消息码 | 名称 | 功能 |
|--------|------|------|
| G0HC | Harvest Card | 收获/交易宠物 |
| G0HD | Harvest Done | 获得宠物 |
| G0HH | Harvest Harm | 宠物效果消耗 |
| G0HI | Harvest Invalidate | 宠物无效化 |
| G0HL | Harvest Lose | 失去宠物 |
| G1HK | Harvest Kill | 战斗中标记宠物待弃 |
| G0IC | In Campaign | 宠物效果生效 |
| G0OC | Out Campaign | 宠物效果失效 |

#### 技能相关
| 消息码 | 名称 | 功能 |
|--------|------|------|
| G0IS | In Skill | 获得技能（注册到映射表） |
| G0OS | Out Skill | 失去技能（从映射表移除） |

#### Token相关
| 消息码 | 名称 | 功能 |
|--------|------|------|
| G0IJ | In Token | 增加Token（计数/排除/目标/觉醒/折叠） |
| G0OJ | Out Token | 减少Token |

#### 其他
| 消息码 | 名称 | 功能 |
|--------|------|------|
| G0LV | Love | 倾慕机制（HP变化） |
| G0IY | In Yard | 英雄变身/换位 |
| G0DS | Debuff Set | 横置状态设置 |
| G0WN | Win | 游戏胜利 |
| G0TT | Throw | 掷骰判定 |
| G0TT | Throw Seven | 掷骰7点 |
| G1GE | Gain Effect | 怪物胜利/失败效果 |

## 4. 关键数据结构

### 消息格式
```
G{消息类型},{参数1},{参数2},...
```

消息类型分类：
- `G0xx`: 游戏逻辑消息
- `G1xx`: 游戏事件消息
- `G2xx`: 简单快速消息

### 核心对象
- **Artiad.Harm**: 伤害对象（Who, Element, N, Source, Mask）
- **Artiad.Cure**: 治疗对象（Who, Element, N, Source, Mask）
- **Artiad.Love**: 倾慕对象（Princess, Prince列表）
- **Artiad.Abondan**: 弃牌对象（Genre, Zone, List）
- **Artiad.EquipStandard**: 标准装备对象
- **Artiad.CoachingSign**: 支援/妨碍标记

### 状态管理
```csharp
// Board 对象的状态
Board.Garden          // 玩家字典
Board.TuxPiles        // 手牌堆
Board.MonPiles        // 怪物堆
Board.EvePiles        // 事件堆
Board.TuxDises        // 手牌弃牌堆
Board.MonDises        // 怪物弃牌堆
Board.EveDises        // 事件弃牌堆
Board.RPool           // 己方战力池
Board.OPool           // 对方战力池
Board.InCampaign      // 是否在战斗中
Board.PoolEnabled     // 战力池是否启用
Board.PlayerPoolEnabled // 玩家战力池是否启用
```

### 玩家属性
```csharp
Player.Tux             // 手牌列表
Player.Weapon          // 武器
Player.Armor           // 防具
Player.Trove           // 行囊
Player.ExEquip         // 额外装备
Player.ExCards         // 扩展卡牌
Player.Fakeq           // 伪造装备
Player.Pets            // 宠物数组
Player.Skills          // 技能列表
Player.Runes           // 符文列表
Player.TokenCount      // 计数Token
Player.TokenExcl       // 排除Token
Player.TokenTars       // 目标Token
Player.HP / HPb        // 当前/最大HP
Player.STRb / DEXb     // 基础攻/敏
Player.STRa / DEXa     // 战斗中攻/敏
```

## 5. 与其他类的交互

### 调用的 Artiad 类
- `Artiad.Harm`: 伤害处理
- `Artiad.Cure`: 治疗处理
- `Artiad.Love`: 倾慕处理
- `Artiad.Abandon`: 弃牌处理
- `Artiad.EquipStandard`: 装备处理
- `Artiad.HarvestPet`: 宠物收获
- `Artiad.LosePet`: 失去宠物
- `Artiad.JoinPetEffects`: 宠物效果生效
- `Artiad.CollapsePetEffects`: 宠物效果失效
- `Artiad.PondRefresh`: 战力池刷新
- `Artiad.Goto`: 阶段跳转
- `Artiad.Procedure`: 程序工具类

### 被调用的类
- `tx01` (TuxCottage): 手牌效果注册表
- `sk01` (SkillCottage): 技能效果注册表
- `sk02` / `sk03`: 技能触发映射表
- `nj01` (NPCCottage): NPC效果注册表
- `ev01` (EveCottage): 事件效果注册表
- `mt01` (MonsterCottage): 怪物效果注册表

### 调用的 XI 方法
- `WI.BCast()`: 广播消息
- `WI.Send()`: 发送消息给特定玩家
- `WI.Live()`: 发送消息给观战者
- `AsyncInput()`: 异步获取玩家输入
- `MultiAsyncInput()`: 多玩家异步输入
- `DequeueOfPile()`: 从堆中取牌
- `CalculatePetsScore()`: 计算宠物分数
- `ExceptStaff()`: 排除特定玩家

## 6. 对 Web 版实现的启示

### 需要移植到 boardgame.io 的逻辑

1. **消息系统架构**
   - 保留消息格式作为 UI 事件
   - 使用 boardgame.io 的 events 替代 RaiseGMessage
   - 将字符串消息转换为 TypeScript 类型

2. **核心游戏逻辑**
   - G0OH/G0IH: 伤害/治疗计算
   - G0IT/G0OT: 手牌增减
   - G0ZB/G0ZC: 装备系统
   - G0HC/G0HL: 宠物系统
   - G0IS/G0OS: 技能系统
   - G0LV: 倾慕机制

3. **战斗系统**
   - G0HZ: 妨碍区域处理
   - G0IB/G0OB: 怪物战力修改
   - G0IP/G0OP: 战力池增减

4. **状态管理**
   - Board 对象状态直接映射到 G state
   - Player 属性映射到 G.players

### 可以简化的部分
- 移除消息序列化/反序列化（使用 TypeScript 类型）
- 简化优先级系统（boardgame.io 有内置事件顺序）
- 移除控制台输出逻辑

### 需要保持的核心
- 完整的消息类型定义（约50种消息）
- 消息处理的优先级逻辑
- 技能拦截机制
- 伤害/治疗计算公式
- 装备/宠物的状态管理
- 倾慕机制的链式反应

### 建议的实现策略
1. 将每个消息类型映射为一个 TypeScript 类型
2. 创建消息处理器注册表（类似 tx01, sk01）
3. 使用 boardgame.io 的 moves 替代玩家输入
4. 保留消息格式用于 UI 事件通知
