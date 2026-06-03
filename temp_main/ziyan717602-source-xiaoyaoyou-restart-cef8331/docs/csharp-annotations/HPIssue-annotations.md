# HPIssue.cs 源码标注文档

## 1. 文件概述

HPIssue.cs 是 Artiad 命名空间下的**HP（生命值）相关数据结构定义文件**。该文件定义了游戏中的伤害、治疗、倾慕等核心机制的数据模型和消息格式。

在整个游戏系统中，HPIssue.cs 是**HP 值管理的数据层**，为 XIG.cs 中的 G0OH（伤害）、G0IH（治疗）、G0LV（倾慕）等消息提供类型安全的解析和序列化。

## 2. 完整类定义

### 2.1 Harm 类（伤害）

```csharp
public class Harm
{
    public ushort Who { set; get; }           // 受伤玩家UID
    public FiveElement Element { set; get; }  // 伤害元素（火/水/雷/风/土/阴/阳）
    public int N { set; get; }               // 伤害值
    public int Source { set; get; }           // 伤害来源（0=未知, 1-6=玩家, 1001+=怪物/NPC）
    public long Mask { set; get; }           // 伤害掩码（特殊效果标记）
}
```

**构造函数**：
```csharp
public Harm(ushort who, int source, FiveElement elem, int n, long mask)
```
- 自动处理阴伤和阳伤的特殊掩码

**静态方法**：
```csharp
public static string ToMessage(Harm harm)                    // 转为 G0OH 消息
public static string ToMessage(IEnumerable<Harm> harms)     // 批量转为 G0OH 消息
public static List<Harm> Parse(string line)                  // 从 G0OH 消息解析
internal static string ToRawMessage(Harm harm)               // 转为原始格式
```

### 2.2 HarmResult 类（伤害结果）

```csharp
public static class HarmResult
{
    public static string ToMessage(Harm harm)                // 转为 G1TH 消息
    public static string ToMessage(IEnumerable<Harm> harms) // 批量转为 G1TH 消息
}
```

### 2.3 Cure 类（治疗）

```csharp
public class Cure
{
    public ushort Who { set; get; }           // 治疗玩家UID
    public FiveElement Element { set; get; }  // 治疗元素
    public int N { set; get; }               // 治疗值
    public int Source { set; get; }           // 治疗来源
    public long Mask { set; get; }           // 治疗掩码
}
```

**构造函数**：
```csharp
public Cure(ushort who, int source, FiveElement elem, int n, long mask)
```

**静态方法**：
```csharp
public static string ToMessage(Cure cure)                    // 转为 G0IH 消息
public static string ToMessage(IEnumerable<Cure> cures)     // 批量转为 G0IH 消息
public static List<Cure> Parse(string line)                  // 从 G0IH 消息解析
internal static string ToRawMessage(Cure cure)               // 转为原始格式
```

### 2.4 CureResult 类（治疗结果）

```csharp
public static class CureResult
{
    public static string ToMessage(Cure cure)                // 转为 G1CH 消息
    public static string ToMessage(IEnumerable<Cure> cures) // 批量转为 G1CH 消息
}
```

### 2.5 Love 类（倾慕）

```csharp
public class Love
{
    public ushort Princess { set; get; }        // 被倾慕者（公主）UID
    public List<string> Prince { set; get; }   // 倾慕者（王子）列表
}
```

**构造函数**：
```csharp
public Love(ushort princess, IEnumerable<string> prince)
```

**静态方法**：
```csharp
public static string ToMessage(Love love)                    // 转为 G0LV 消息
public static string ToMessage(IEnumerable<Love> loves)     // 批量转为 G0LV 消息
public static List<Love> Parse(string line)                  // 从 G0LV 消息解析
private string ToRawMessage()                                 // 转为原始格式
```

### 2.6 HpIssueSemaphore 类（HP变化信号）

```csharp
public class HpIssueSemaphore
{
    private ushort Who;           // 玩家UID
    private bool IsLove;          // 是否为倾慕导致
    private FiveElement Element;  // 元素类型
    private int Delta;            // HP变化值（正=增加，负=减少）
    private int HP;               // 变化后的HP值
}
```

**构造函数**：
```csharp
public HpIssueSemaphore(ushort who, bool isLove, FiveElement? element, int delta, int hp)
```

**静态方法**：
```csharp
public static void Telegraph(Action<string> send, HpIssueSemaphore his)         // 发送单个信号
public static void Telegraph(Action<string> send, IEnumerable<HpIssueSemaphore> hises) // 批量发送
```

## 3. 核心逻辑流程

### 伤害处理流程
```
1. 创建 Harm 对象
   └─ 自动设置阴伤/阳伤掩码

2. 序列化为 G0OH 消息
   └─ 格式: G0OH,{Who},{Source},{Element},{N},{Mask}

3. XIG.SimpleGMessage100() 处理
   ├─ 阴伤特殊处理（可弃手牌抵消）
   ├─ 计算实际伤害值
   ├─ 扣减 HP
   └─ 触发 G1TH（伤害结果）

4. 广播 HpIssueSemaphore 信号
   └─ E0OH: 伤害信号
```

### 治疗处理流程
```
1. 创建 Cure 对象

2. 序列化为 G0IH 消息
   └─ 格式: G0IH,{Who},{Source},{Element},{N},{Mask}

3. XIG.SimpleGMessage100() 处理
   ├─ 检查 HP 上限
   ├─ 增加 HP
   └─ 触发 G1CH（治疗结果）

4. 广播 HpIssueSemaphore 信号
   └─ E0IH: 治疗信号
```

### 倾慕处理流程
```
1. 死亡时触发 G0ZH

2. XIG.SimpleGMessage() 处理（priority=100）
   ├─ 查找倾慕者（Spouses）
   ├─ 计算倾慕链
   ├─ 生成 Love 对象
   └─ 触发 G0LV

3. G0LV 处理
   ├─ 计算 HP 变化
   ├─ 扣减/增加 HP
   ├─ 广播 HpIssueSemaphore
   └─ 触发死亡检查
```

## 4. 关键数据结构

### FiveElement 枚举（五元素）
```
A: 无元素
FIRE: 火
WATER: 水
THUNDER: 雷
WIND: 风
EARTH: 土
YINN: 阴
SOLARIS: 阳
```

### HPEvoMask 掩码
```
TUX_INAVO: 手牌无效
DECR_INVAO: 减伤无效
CHAIN_INVAO: 链式反应无效
IMMUNE_INVAO: 免疫无效
ALIVE_HARD: 强制保留1HP
ALIVE: 保留至少1HP
```

### 消息格式

#### G0OH（伤害）
```
G0OH,{Who},{Source},{Element},{N},{Mask}
示例: G0OH,1,2,1,3,0
解释: 玩家1受到2点火元素伤害，伤害值3，无特殊效果
```

#### G0IH（治疗）
```
G0IH,{Who},{Source},{Element},{N},{Mask}
示例: G0IH,3,1,2,5,0
解释: 玩家3接受1点水元素治疗，治疗值5
```

#### G0LV（倾慕）
```
G0LV,{Princess},{Count},{Prince1},{Prince2},...
示例: G0LV,2,3,1,3,5
解释: 玩家2被玩家1、3、5倾慕
```

#### E0OH / E0IH（HP变化信号）
```
E0OH/HP0IH,{Who},{IsLove?0:Element},{Delta},{HP}
示例: E0OH,1,0,1,3,25
解释: 玩家1受到火元素伤害，减少3HP，剩余25HP
```

## 5. 与其他类的交互

### 被调用的类
- `XIG.SimpleGMessage100()`: 处理 G0OH, G0IH 消息
- `XIG.SimpleGMessage()`: 处理 G0LV 消息
- `Artiad.Procedure.ArticuloMortis()`: 死亡检查
- `WI.BCast()`: 广播信号

### 调用的类
- `FiveElementHelper`: 元素枚举转换
- `Algo.TakeRange()`: 数组切片工具

### 消息流向
```
Harm/Cure/Love
    │
    ├─ ToMessage() → G0OH/G0IH/G0LV
    │
    └─ XIG 处理
         │
         └─ Telegraph() → E0OH/E0IH/E0LV (UI信号)
```

## 6. 对 Web 版实现的启示

### 需要移植到 boardgame.io 的逻辑

1. **数据结构**
   - 保留 Harm, Cure, Love 类结构
   - 转换为 TypeScript 接口
   - 使用枚举替代字符串元素标识

2. **序列化/反序列化**
   - 简化消息格式，使用 JSON
   - 保留 ToMessage/Parse 逻辑

3. **HP 计算逻辑**
   - 伤害计算公式
   - 治疗上限检查
   - 阴伤特殊处理（弃手牌抵消）

4. **倾慕机制**
   - 倾慕链查找逻辑
   - HP 变化计算
   - 死亡检查触发

### 可以简化的部分
- 移除 HpIssueSemaphore（UI 直接监听 G state 变化）
- 简化掩码系统（使用 TypeScript 位运算）

### 需要保持的核心
- Harm/Cure/Love 数据结构
- 元素系统
- HP 计算公式
- 倾慕机制

### 建议的实现
```typescript
interface Harm {
  who: number;
  element: FiveElement;
  n: number;
  source: number;
  mask: number;
}

interface Cure {
  who: number;
  element: FiveElement;
  n: number;
  source: number;
  mask: number;
}

interface Love {
  princess: number;
  prince: string[];
}
```
