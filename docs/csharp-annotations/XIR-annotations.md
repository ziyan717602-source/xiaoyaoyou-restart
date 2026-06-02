# XIR.cs 源码标注文档

## 1. 文件概述

XIR.cs 是 XI 类的分部类实现，负责**游戏主循环和回合管理**。该文件是游戏引擎的核心，处理：
- 游戏初始化和卡牌库构建
- 回合流程控制（从回合开始到结束的完整状态机）
- 战斗阶段的详细逻辑（支援/妨碍选择、怪物翻牌、战斗结算）
- 技能系统的集成（通过 sk02/sk03 技能映射表）

在整个游戏系统中，XIR.cs 是**游戏流程控制器**，实现了完整的回合制卡牌游戏循环。

## 2. 完整方法清单

### 2.1 公共方法

```csharp
public void Run(int levelCode, bool inDebug)
```
- **参数**: `levelCode` - 关卡等级, `inDebug` - 是否调试模式
- **返回值**: void
- **功能**: 游戏主入口，初始化并启动游戏循环

```csharp
public void BlockSetJumpTable(string jumpTarget, string jumpEnd)
```
- **参数**: `jumpTarget` - 跳转目标, `jumpEnd` - 跳转结束点
- **返回值**: void
- **功能**: 设置跳转表，用于中断当前回合流程

```csharp
public void RunRound(string rstage, string endRstage)
```
- **参数**: `rstage` - 当前阶段, `endRstage` - 结束阶段
- **返回值**: void
- **功能**: 执行完整的回合流程

```csharp
public void ResetAllPlayerRAM()
```
- **参数**: 无
- **返回值**: void
- **功能**: 重置所有玩家的RAM（临时数据）

```csharp
public void ClearLeftPendingTux()
```
- **参数**: 无
- **返回值**: void
- **功能**: 清除所有待处理的手牌

### 2.2 私有方法

```csharp
private void RunQuadStage(string zero)
```
- **参数**: `zero` - 阶段标识
- **返回值**: void
- **功能**: 执行四阶段处理（简化版）

```csharp
private bool RunQuadMixedStage(string zero, int sina, int[] silentPriority, Action[] silentAction)
```
- **参数**: `zero` - 阶段标识, `sina` - 信号类型, `silentPriority` - 静默优先级, `silentAction` - 静默动作
- **返回值**: bool - 是否执行了实际动作
- **功能**: 执行混合四阶段处理，支持静默动作和优先级控制

```csharp
private bool RunSeperateStage(string zero, int sina, Func<Board, bool> judge)
```
- **参数**: `zero` - 阶段标识, `sina` - 信号类型, `judge` - 判断函数
- **返回值**: bool - 是否执行了实际动作
- **功能**: 执行分离式阶段处理（支持双方交替执行）

```csharp
private UEchoCode UKEvenMessage(bool[] involved, List<SKE> purse, string[] pris, int sina)
```
- **参数**: `involved` - 参与者数组, `purse` - 技能包, `pris` - 优先级, `sina` - 信号
- **返回值**: UEchoCode - 执行结果代码
- **功能**: 处理用户输入消息的循环

```csharp
private UEchoCode UKEvenMessage(bool[] involved, List<SKE> purse, string[] pris, int[] sina)
```
- **参数**: `involved` - 参与者数组, `purse` - 技能包, `pris` - 优先级, `sina[]` - 信号数组
- **返回值**: UEchoCode - 执行结果代码
- **功能**: 处理用户输入消息的重载版本

```csharp
private void RecycleMonster()
```
- **参数**: 无
- **返回值**: void
- **功能**: 回收战斗区域的怪物卡牌

```csharp
public UEchoCode HandleWithNPCEffect(Player player, NPC npc, string reason)
```
- **参数**: `player` - 玩家, `npc` - NPC对象, `reason` - 原因
- **返回值**: UEchoCode - 执行结果代码
- **功能**: 处理NPC效果的逻辑

```csharp
private void AwakeABCValue(bool containsC)
```
- **参数**: `containsC` - 是否包含C值
- **返回值**: void
- **功能**: 唤醒所有玩家的ABC属性值

```csharp
private void AwakeABCValue(bool containsC, Player py)
```
- **参数**: `containsC` - 是否包含C值, `py` - 目标玩家
- **返回值**: void
- **功能**: 唤醒单个玩家的ABC属性值

## 3. 核心逻辑流程

### Run() 游戏主循环
1. **初始化阶段**
   - 构建卡牌堆（TuxPiles, MonPiles, EvePiles）
   - 注册各类Cottage（技能、手牌、NPC、事件、符文等）
   - 映射技能触发条件（MappingSksp）
   - 初始化玩家英雄属性

2. **游戏开始阶段**
   - 执行 H0ST 阶段
   - 给每个玩家发3张初始手牌

3. **回合循环**
   - 使用 jumpTareget/jumpEnd 控制跳转
   - 在独立线程中执行 RunRound
   - 循环直到游戏结束

### RunRound() 回合流程状态机
回合代码格式: `R{玩家号}{阶段代码}`

| 阶段代码 | 名称 | 说明 |
|----------|------|------|
| 00 | Round Start | 回合开始，检查横置状态 |
| OC | Open Card | 开牌阶段 |
| ST | Stage | 主阶段开始 |
| EP | Event Prepare | 事件准备阶段 |
| EV | Event | 事件阶段（是否翻看事件牌） |
| EE | Event End | 事件结束 |
| GS | Game Start | 战斗准备开始 |
| GR | Game Round | 战斗回合（支援/妨碍选择） |
| GE | Game End | 战斗结束 |
| Z0 | Zone Init | 战斗区域初始化 |
| ZW | Zone War | 战斗开始（选择支援者/妨碍者） |
| ZU | Zone Update | 战斗更新 |
| ZM | Zone Monster | 怪物翻牌 |
| NP | NPC | NPC处理 |
| Z1 | Zone Fight | 战斗开始 |
| Z8 | Zone Continue | 战斗继续 |
| CC | Curtain Call | 出场效果 |
| PD | Pool Draw | 战力池抽取 |
| ZC | Zone Combat | 战斗计算 |
| ZD | Zone Decision | 战斗决策（出战牌阶段） |
| ZN | Zone Result | 战斗结果 |
| VS/VT | Victory/Skip | 胜利处理/跳过 |
| Z2 | Zone After | 战斗后处理 |
| ZF | Zone Final | 战斗清理 |
| ZZ | Zone Zero | 战斗完全结束 |
| BC | Battle Card | 战牌阶段（抽牌） |
| QR | Quick Rest | 快速休整 |
| TM | Turn Move | 回合移动 |
| IC | In Card | 入牌阶段 |
| ED | End | 回合结束 |

### RunQuadMixedStage() 四阶段处理流程
1. 从 sk02 映射表获取该阶段的技能列表
2. 按优先级排序技能
3. 按优先级执行静默动作（silentAction）
4. 对每个优先级：
   - 收集参与的玩家（involved）
   - 处理锁定技能（locks）
   - 发送U1消息给参与玩家
   - 等待玩家响应（UKEvenMessage）
5. 执行后续静默动作

### 战斗流程详解 (ZW阶段)
1. **初始化**
   - 设置 PosHinders（妨碍者位置）
   - 设置 PosSupporters（支援者位置）
   - 允许不支援/不妨碍

2. **支援者选择**
   - 回合玩家决定是否需要支援
   - 同队玩家可建议支援
   - 支援者可以是：
     - T{uid}: 同队玩家
     - P{T}xxx: 宠物
     - I{uid}: 特殊装备
     - /: 不支援

3. **妨碍者选择**
   - 对方玩家决定是否妨碍
   - 妨碍者类型同上

4. **战斗判断**
   - 如果选择不支援，直接进入结束流程
   - 如果选择支援，进入怪物翻牌（ZM）

## 4. 关键数据结构

### 状态变量
```csharp
private bool isFinished;           // 游戏是否结束
private List<Thread> listOfThreads; // 执行线程列表
private string jumpTareget;        // 跳转目标
private string jumpEnd;            // 跳转结束点
private Random randomSeed;         // 随机种子
```

### 阶段代码格式
- 格式: `R{玩家号}{阶段代码}`
- 示例: `R100` (玩家1回合开始), `R2ZW` (玩家2战斗阶段)

### 消息协议
- `H0DP`: 发牌堆信息
- `G0IS`: 技能初始化
- `G0HQ`: 发牌
- `G0QR`: 快速休整
- `G0WN`: 游戏胜利
- `G1EV`: 事件翻牌
- `G1SG`: 战斗开始信号
- `G1ZK`: 战斗中标记
- `G1HK`: 宠物标记

## 5. 与其他类的交互

### 调用的类
- `JNS.TuxCottage`: 手牌效果处理
- `JNS.SkillCottage`: 技能效果处理
- `JNS.OperationCottage`: 操作效果处理
- `JNS.NPCCottage`: NPC效果处理
- `JNS.EveCottage`: 事件效果处理
- `JNS.RuneCottage`: 符文效果处理
- `JNS.MonsterCottage`: 怪物效果处理
- `Artiad.CoachingSign`: 支援/妨碍标记
- `Artiad.Abandon`: 弃牌处理
- `Artiad.ImperialLeft`: 场地状态处理
- `Artiad.HarvestPet`: 宠物收获
- `Artiad.PondRefresh`: 战力池刷新

### 被调用的类
- `XI.RaiseGMessage()`: 触发游戏消息
- `XI.AsyncInput()`: 异步获取玩家输入
- `XI.NFSAsyncInput()`: 非自由选择异步输入
- `XI.MayorAsyncInput()`: 市长模式异步输入
- `XI.DequeueOfPile()`: 从堆中取牌
- `XI.SendOutU1Message()`: 发送U1消息

## 6. 对 Web 版实现的启示

### 需要移植到 boardgame.io 的逻辑

1. **回合状态机**
   - 使用 boardgame.io 的 Phases 和 Stages
   - 将阶段代码映射为 boardgame.io 的 phase 名称
   - 使用 ctx.turn 和 ctx.phase 控制流程

2. **战斗系统**
   - ZW 阶段的支援/妨碍选择可使用 stages
   - ZD 阶段的出牌决策需要专门的 stage
   - 战力池（RPool/OPool）计算逻辑直接移植

3. **技能系统**
   - sk02/sk03 映射表需要转换为 TypeScript
   - SKE（技能执行对象）结构保留
   - 优先级系统需要重新设计

4. **消息系统**
   - C# 的字符串消息协议需要转换为 TypeScript 类型
   - RaiseGMessage 可转换为 boardgame.io 的 events
   - 简化消息格式，使用 JSON 结构

### 可以简化的部分
- 移除线程管理（boardgame.io 是单线程）
- 简化随机数生成（使用 ctx.random）
- 移除控制台交互逻辑

### 需要保持的核心
- 完整的回合流程状态机
- 战斗的详细逻辑（支援/妨碍/战牌）
- 技能优先级系统
- 卡牌堆管理逻辑
