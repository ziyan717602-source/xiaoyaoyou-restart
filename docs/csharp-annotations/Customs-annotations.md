# Customs.cs 源码标注文档

## 1. 文件概述

Customs.cs 是 Artiad 命名空间下的**卡牌弃置系统数据结构定义文件**。该文件定义了卡牌弃置（Abandon）的核心机制，处理：
- 从各个区域（玩家手牌、展示区、显式/隐式区域）弃置卡牌
- 弃牌堆的管理
- 弃牌信号的广播

在整个游戏系统中，Customs.cs 是**卡牌生命周期管理**的关键部分，负责卡牌从游戏区域到弃牌堆的流转。

## 2. 完整类定义

### 2.1 Abandon 类（弃牌操作）

```csharp
public class Abandon
{
    public Card.Genre Genre { set; get; }          // 卡牌类型（Tux/NMB/Eve）
    public CustomsHelper.ZoneType Zone { set; get; } // 弃牌来源区域
    public List<CustomsUnit> List { set; get; }    // 弃牌单元列表
    public CustomsUnit SingleUnit { set; ... }     // 单个弃牌设置器
}
```

**方法**：
```csharp
public string ToMessage()                           // 转为 G0ON 消息
public static Abandon Parse(string line)            // 从 G0ON 消息解析
public void Handle(XI XI, Base.VW.IWISV WI)        // 处理弃牌逻辑
```

**Handle() 逻辑**：
1. 遍历所有 CustomsUnit
2. 根据 Genre 类型添加到对应弃牌堆：
   - Tux → Board.TuxDises
   - NMB → Board.MonDises
   - Eve → Board.EveDises
3. 广播 AbadonSemaphore 信号

### 2.2 CustomsUnit 类（弃牌单元）

```csharp
public class CustomsUnit
{
    public ushort Source { set; get; }    // 来源玩家UID（仅 Zone=PLAYER 时有效）
    public ushort[] Cards { set; get; }  // 卡牌ID数组
    public ushort SingleCard { set; get; } // 单张卡牌设置/获取器
}
```

**方法**：
```csharp
internal string ToRawMessage()                              // 转为原始格式
internal static List<CustomsUnit> ParseFromLine(string line)  // 从消息解析
```

### 2.3 AbadonSemaphore 类（弃牌信号）

```csharp
public class AbadonSemaphore
{
    public Card.Genre Genre { set; get; }          // 卡牌类型
    public CustomsHelper.ZoneType Zone { set; get; } // 来源区域
    public ushort[] Cards { set; get; }           // 卡牌ID数组
}
```

**方法**：
```csharp
public void Telegraph(System.Action<string> send)  // 广播 E0ON 信号
```

### 2.4 CustomsHelper 类（辅助工具）

```csharp
public static class CustomsHelper
{
    public enum ZoneType
    {
        NIL,       // 无
        PLAYER,    // 玩家区域（P）
        SHOWBOARD, // 展示区（S）
        EXPLICIT,  // 显式区域（E）- 需要通知
        IMPLICIT   // 隐式区域（I）- 无需通知
    }
}
```

**静态方法**：
```csharp
internal static char Zone2Char(ZoneType zone)                    // 区域转字符
internal static ZoneType Char2Zone(char ch)                      // 字符转区域
internal static bool RemoveCards(Abandon abandon, params ushort[] cards)  // 从弃牌中移除特定卡牌
public static void ExclToAbandon(ushort lugCode, ushort who, XI XI)      // 行囊禁用时弃置内容物
```

**ExclToAbandon() 逻辑**：
1. 解码行囊卡牌
2. 设置 lug.Pull = true（防止递归）
3. 发送 G0SN 消息（移除容量）
4. 发送 G2TZ 消息（标记移除）
5. 触发 Abandon 消息（弃置内容物）
6. 恢复 lug.Pull = false

## 3. 核心逻辑流程

### 弃牌流程
```
1. 创建 Abandon 对象
   │
   ├─ 设置 Genre（卡牌类型）
   ├─ 设置 Zone（来源区域）
   └─ 添加 CustomsUnit（玩家 + 卡牌列表）

2. 序列化为 G0ON 消息
   │
   └─ 格式: G0ON,{Genre},{Zone},{Source1},{Count1},{Cards1},...

3. XIG 处理 G0ON 消息
   │
   └─ Abandon.Parse() → Abandon.Handle()

4. Handle() 执行
   │
   ├─ 遍历 CustomsUnit
   ├─ 根据 Genre 添加到弃牌堆
   │   ├─ Tux → Board.TuxDises
   │   ├─ NMB → Board.MonDises
   │   └─ Eve → Board.EveDises
   └─ 广播 AbadonSemaphore

5. AbadonSemaphore.Telegraph()
   │
   └─ 发送 E0ON 信号
```

### 行囊禁用弃置流程
```
1. 行囊被禁用（TroveDisabled = true）
   │
   └─ CustomsHelper.ExclToAbandon()

2. 解码行囊卡牌
   │
   └─ lug = LibTuple.TL.DecodeTux(lugCode) as Luggage

3. 设置防递归标志
   │
   └─ lug.Pull = true

4. 移除行囊容量
   │
   └─ RaiseGMessage("G0SN,...")

5. 弃置内容物
   │
   └─ RaiseGMessage(new Abandon() {...})

6. 恢复标志
   │
   └─ lug.Pull = false
```

## 4. 关键数据结构

### ZoneType 枚举
```
NIL:     无（/）
PLAYER:  玩家区域（P）- 手牌、装备
SHOWBOARD: 展示区（S）- 公开信息
EXPLICIT: 显式区域（E）- 需要通知玩家
IMPLICIT: 隐式区域（I）- 无需通知
```

### Genre 枚举（卡牌类型）
```
Tux: 手牌/装备
NMB: 怪物/NPC/宠物
Eve: 事件牌
```

### 消息格式

#### G0ON（弃牌）
```
G0ON,{Genre},{Zone},{Source1},{Count1},{Cards1},...
示例: G0ON,T,P,1,3,101,102,103
解释: 从玩家1弃置3张手牌（101,102,103）
```

#### E0ON（弃牌信号）
```
E0ON,{Genre},{Zone},{Card1},{Card2},...
示例: E0ON,T,P,101,102,103
解释: 弃牌信号，包含具体卡牌ID
```

### 弃牌堆状态
```csharp
Board.TuxDises  // 手牌弃牌堆
Board.MonDises  // 怪物弃牌堆
Board.EveDises  // 事件弃牌堆
```

## 5. 与其他类的交互

### 被调用的类
- `XIG.SimpleGMessage100()`: 处理 G0ON 消息
- `XIG.RaiseGMessage()`: 触发弃牌消息
- `LibTuple.TL.DecodeTux()`: 解码手牌
- `LibTuple.ML.Decode()`: 解码怪物
- `LibTuple.EL.DecodeEvenement()`: 解码事件

### 调用的类
- `Card.Genre`: 卡牌类型枚举
- `Board.TuxDises`: 手牌弃牌堆
- `Board.MonDises`: 怪物弃牌堆
- `Board.EveDises`: 事件弃牌堆
- `Luggage`: 行囊卡牌类

### 消息流向
```
Abandon 对象
    │
    ├─ ToMessage() → G0ON 消息
    │
    └─ Handle() → 更新弃牌堆 + 广播
         │
         └─ AbadonSemaphore.Telegraph() → E0ON 信号
```

## 6. 对 Web 版实现的启示

### 需要移植到 boardgame.io 的逻辑

1. **数据结构**
   - 保留 ZoneType 枚举
   - 转换 CustomsUnit 为 TypeScript 接口

2. **弃牌堆管理**
   - Board.TuxDises / MonDises / EveDises 映射到 G state
   - 保留弃牌堆的卡牌ID列表

3. **行囊系统**
   - Luggage 类的容量管理
   - 禁用时的弃置逻辑

### 可以简化的部分
- 移除 ShowBoard 区域（Web 版不需要）
- 简化 ZoneType 枚举（只保留 PLAYER/EXPLICIT/IMPLICIT）

### 需要保持的核心
- Abandon 数据结构
- CustomsUnit 的 Source + Cards 结构
- 弃牌堆管理逻辑
- 行囊禁用弃置逻辑

### 建议的实现
```typescript
enum ZoneType {
  NIL = '/',
  PLAYER = 'P',
  EXPLICIT = 'E',
  IMPLICIT = 'I'
}

interface CustomsUnit {
  source: number;  // 玩家UID
  cards: number[]; // 卡牌ID列表
}

interface Abandon {
  genre: CardGenre;
  zone: ZoneType;
  list: CustomsUnit[];
}

// 在 G state 中
interface GameState {
  tuxDises: number[];  // 手牌弃牌堆
  monDises: number[];  // 怪物弃牌堆
  eveDises: number[];  // 事件弃牌堆
}
```
