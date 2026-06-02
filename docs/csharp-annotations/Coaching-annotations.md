# Coaching.cs 源码标注文档

## 1. 文件概述

Coaching.cs 是 Artiad 命名空间下的**战斗辅助系统数据结构定义文件**。该文件定义了战斗中支援/妨碍者选择、位置变化、参与者管理等核心机制。

在整个游戏系统中，Coaching.cs 是**战斗参与者管理系统**，负责：
- 支援者（Supporter）和妨碍者（Hinder）的标记和变更
- 战斗位置的刷新和更新
- 鼓手（Drum）系统的进入/退出管理
- 战斗信号的广播

## 2. 完整类定义

### 2.1 CoachingSign 类（战斗信号）

```csharp
public class CoachingSign
{
    public List<CoachingSignUnit> List { set; get; }  // 信号单元列表
    public CoachingSignUnit SingleUnit { set; ... }   // 单个信号设置器
}
```

**方法**：
```csharp
public string ToMessage()                           // 转为 G17F 消息
public static CoachingSign Parse(string line)       // 从 G17F 消息解析
public void Handle(XI XI)                           // 处理信号逻辑
```

**Handle() 逻辑**：
1. **GIVEUP（放弃战斗）**
   - 触发 CoachingChange 消息
   - 设置所有参与者为 0

2. **DONE（战斗完成）**
   - 触发 CoachingChange 消息
   - 记录回合玩家

3. **其他角色（TRIGGER/SUPPORTER/HINDER/HORN）**
   - 收集所有角色变化
   - 生成 CoachingChangeUnit 列表
   - 触发 CoachingChange 消息

### 2.2 CoachingSignUnit 类（信号单元）

```csharp
public class CoachingSignUnit
{
    public CoachingHelper.PType Role { set; get; }  // 角色类型
    public ushort Coach { set; get; }               // 玩家UID
}
```

**方法**：
```csharp
internal string ToRawMessage()                              // 转为原始格式
internal static List<CoachingSignUnit> ParseFromLine(string line)  // 从消息解析
```

### 2.3 CoachingChange 类（位置变更）

```csharp
public class CoachingChange
{
    public List<CoachingChangeUnit> List { set; get; }  // 变更单元列表
    public CoachingChangeUnit SingleUnit { set; ... }   // 单个变更设置器
}
```

**方法**：
```csharp
public string ToMessage()                           // 转为 G0FI 消息
public static CoachingChange Parse(string line)     // 从 G0FI 消息解析
public void Handle(XI XI, Base.VW.IWISV WI)        // 处理变更逻辑
public int AttendOrLeave(ushort ut)                 // 判断玩家进入/离开
```

**Handle() 逻辑**：
1. 对每个 CoachingChangeUnit 执行 Solve()
2. 广播 CoachingChangeSemaphore 信号
3. 如果战力池启用，触发 PondRefresh

**AttendOrLeave() 逻辑**：
- 正数: 玩家进入战斗
- 负数: 玩家离开战斗
- 零: 无变化

### 2.4 CoachingChangeUnit 类（变更单元）

```csharp
public class CoachingChangeUnit
{
    public CoachingHelper.PType Role { set; get; }  // 角色类型
    public ushort Elder { set; get; }               // 原位置玩家
    public ushort Stepper { set; get; }             // 新位置玩家
}
```

**方法**：
```csharp
internal string ToRawMessage()                              // 转为原始格式
internal static List<CoachingChangeUnit> ParseFromLine(string line)  // 从消息解析
internal void Solve(XI XI)                                  // 执行变更逻辑
```

**Solve() 逻辑**：
- **SUPPORTER**: 更新 Board.Supporter
- **HINDER**: 更新 Board.Hinder
- **EX_ENTER**: 添加鼓手到 RDrums/ODrums
- **EX_EXIT**: 从 RDrums/ODrums 移除鼓手

### 2.5 CoachingChangeSemaphore 类（变更信号）

```csharp
public class CoachingChangeSemaphore
{
    public List<CoachingChangeUnit> List { set; get; }  // 变更单元列表
}
```

**方法**：
```csharp
public void Telegraph(System.Action<string> send)  // 广播 E0FI 信号
```

### 2.6 CoachingHelper 类（辅助工具）

```csharp
public class CoachingHelper
{
    public enum PType
    {
        NIL,      // 无
        GIVEUP,   // 放弃（O）
        DONE,     // 完成（U）
        TRIGGER,  // 触发者（T）
        SUPPORTER,// 支援者（S）
        HINDER,   // 妨碍者（H）
        HORN,     // 号角（W）
        EX_ENTER, // 鼓手进入（C）
        EX_EXIT,  // 鼓手退出（D）
        REFRESH   // 刷新（R）
    }
}
```

**静态方法**：
```csharp
internal static char PType2Char(PType role)   // 角色转字符
internal static PType Char2PType(char ch)     // 字符转角色
```

**角色字符映射**：
```
O: GIVEUP（放弃）
U: DONE（完成）
T: TRIGGER（触发者）
S: SUPPORTER（支援者）
H: HINDER（妨碍者）
W: HORN（号角）
C: EX_ENTER（鼓手进入）
D: EX_EXIT（鼓手退出）
R: REFRESH（刷新）
```

## 3. 核心逻辑流程

### 战斗参与者管理流程
```
1. 战斗开始（ZW阶段）
   │
   ├─ 初始化 PosHinders（对方玩家）
   ├─ 初始化 PosSupporters（己方玩家）
   │
   └─ 回合玩家选择支援者
        │
        ├─ CoachingSign(Role=SUPPORTER)
        │
        └─ CoachingChange 处理
             │
             ├─ Board.Supporter = 新支援者
             └─ 广播 E0FI 信号

2. 妨碍者选择
   │
   ├─ CoachingSign(Role=HINDER)
   │
   └─ CoachingChange 处理
        │
        ├─ Board.Hinder = 新妨碍者
        └─ 广播 E0FI 信号

3. 鼓手进入/退出
   │
   ├─ CoachingSign(Role=EX_ENTER/EX_EXIT)
   │
   └─ CoachingChange 处理
        │
        ├─ 添加/移除 RDrums/ODrums
        └─ 广播 E0FI 信号
```

### 位置刷新流程
```
1. CoachingSign(Role=REFRESH)
   │
   └─ CoachingChange 处理
        │
        ├─ Board.RDrums[py] = false
        └─ 广播 E0FI 信号
```

### 放弃战斗流程
```
1. CoachingSign(Role=GIVEUP)
   │
   └─ CoachingChange 处理
        │
        ├─ 清空所有参与者
        └─ 广播 E0FI 信号
```

## 4. 关键数据结构

### Board 战斗状态
```csharp
Board.Rounder       // 回合玩家
Board.Supporter     // 支援者（玩家对象）
Board.Hinder        // 妨碍者（玩家对象）
Board.Horn          // 号角（玩家对象）
Board.RDrums        // 己方鼓手字典 (Player -> bool)
Board.ODrums        // 对方鼓手字典 (Player -> bool)
Board.DrumUts       // 鼓手UID列表
```

### 消息格式

#### G17F（战斗信号）
```
G17F,{Role1},{Coach1},{Role2},{Coach2},...
示例: G17F,T,1,S,3,H,5
解释: 触发者是玩家1，支援者是玩家3，妨碍者是玩家5
```

#### G0FI（位置变更）
```
G0FI,{Role1},{Elder1},{Stepper1},...
示例: G0FI,S,2,4
解释: 支援者从玩家2变更为玩家4
```

#### E0FI（变更信号）
```
E0FI,{Role1},{Elder1},{Stepper1},...
示例: E0FI,S,2,4
解释: 支援者位置变化信号
```

## 5. 与其他类的交互

### 被调用的类
- `XIR.RunQuadMixedStage()`: 战斗阶段处理
- `XIG.RaiseGMessage()`: 触发消息
- `Artiad.PondRefresh`: 战力池刷新
- `ContentRule.DecodePlayer()`: 解码玩家对象

### 调用的类
- `Board.Garden`: 玩家字典
- `Board.Rounder`: 回合玩家
- `Board.Supporter`: 支援者
- `Board.Hinder`: 妨碍者

### 消息流向
```
CoachingSign
    │
    ├─ Handle() → 生成 CoachingChangeUnit 列表
    │
    └─ CoachingChange
         │
         ├─ Handle() → 执行 Solve() + 广播
         │
         └─ Telegraph() → E0FI 信号
```

## 6. 对 Web 版实现的启示

### 需要移植到 boardgame.io 的逻辑

1. **数据结构**
   - 保留 PType 枚举
   - 转换 CoachingChangeUnit 为 TypeScript 接口

2. **位置管理**
   - Board.Supporter / Board.Hinder 映射到 G state
   - RDrums / ODrums 映射到 G state

3. **信号系统**
   - G17F / G0FI 消息格式
   - Telegraph 广播机制

### 可以简化的部分
- 移除 CoachingSign → CoachingChange 的间接层
- 直接在 Moves 中更新 Board.Supporter / Board.Hinder

### 需要保持的核心
- PType 角色枚举
- 支援者/妨碍者切换逻辑
- 鼓手进入/退出逻辑
- 位置变化信号

### 建议的实现
```typescript
enum CoachingRole {
  NIL = '/',
  GIVEUP = 'O',
  DONE = 'U',
  TRIGGER = 'T',
  SUPPORTER = 'S',
  HINDER = 'H',
  HORN = 'W',
  EX_ENTER = 'C',
  EX_EXIT = 'D',
  REFRESH = 'R'
}

interface CoachingChange {
  role: CoachingRole;
  elder?: number;  // 原位置玩家
  stepper?: number; // 新位置玩家
}

// 在 G state 中
interface GameState {
  supporter: number | null;
  hinder: number | null;
  rDrums: Record<number, boolean>;
  oDrums: Record<number, boolean>;
}
```
