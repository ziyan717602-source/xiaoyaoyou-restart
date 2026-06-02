# Clothing.cs 源码标注文档

## 1. 文件概述

Clothing.cs 是 Artiad 命名空间下的**装备系统数据结构定义文件**。该文件定义了装备的穿戴、消耗、效果管理等核心机制，处理：
- 标准装备（武器/防具/行囊）
- 扩展装备（ExCards）
- 伪造装备（Fakeq）
- 装备槽位管理
- 装备效果的生效/失效

在整个游戏系统中，Clothing.cs 是**装备管理系统**，负责卡牌从手牌到装备槽的流转，以及装备效果的动态管理。

## 2. 完整类定义

### 2.1 EquipStandard 类（标准装备）

```csharp
public class EquipStandard
{
    public ushort Who { set; get; }       // 装备者UID
    public ushort Source { set; get; }    // 来源玩家UID（0=天空）
    public ushort Coach { set; get; }     // 决策者UID（默认=Who）
    public bool SlotAssign { set; get; }  // 槽位指定模式
    public ushort[] Cards { set; get; }   // 装备卡牌ID数组
    public ushort SingleCard { set; get; } // 单张装备设置/获取器
    public bool FromSky { set; get; }     // 是否来自天空
}
```

**方法**：
```csharp
public string ToMessage()                           // 转为 G0ZB,0 消息
public static EquipStandard Parse(string line)      // 从 G0ZB,0 消息解析
```

### 2.2 EquipExCards 类（扩展装备）

```csharp
public class EquipExCards
{
    public ushort Who { set; get; }       // 装备者UID
    public ushort Source { set; get; }    // 来源玩家UID
    public ushort[] Cards { set; get; }   // 扩展卡牌ID数组
    public ushort SingleCard { set; ... } // 单张设置器
    public bool FromSky { set; get; }     // 是否来自天空
}
```

**方法**：
```csharp
public string ToMessage()                           // 转为 G0ZB,1 消息
public static EquipExCards Parse(string line)       // 从 G0ZB,1 消息解析
```

### 2.3 EquipFakeq 类（伪造装备）

```csharp
public class EquipFakeq
{
    public ushort Who { set; get; }       // 装备者UID
    public ushort Source { set; get; }    // 来源玩家UID
    public ushort Card { set; get; }      // 原始卡牌ID
    public string CardAs { set; get; }    // 伪装的卡牌代码
}
```

**方法**：
```csharp
public string ToMessage()                           // 转为 G0ZB,2 消息
public static EquipFakeq Parse(string line)         // 从 G0ZB,2 消息解析
```

### 2.4 EquipSemaphore 类（装备信号）

```csharp
public class EquipSemaphore
{
    public ushort Who { set; get; }                    // 装备者UID
    public ushort Source { set; get; }                 // 来源玩家UID
    public ClothingHelper.SlotType Slot { set; get; } // 装备槽类型
    public ushort[] Cards { set; get; }               // 卡牌ID数组
    public ushort SingleCard { set; get; }            // 单张设置/获取器
    public string CardAs { set; get; }                // 伪装卡牌（仅FQ槽）
}
```

**方法**：
```csharp
public void Telegraph(Action<string> send)  // 广播 E0ZB 信号
```

### 2.5 EqSlotVariation 类（槽位变化）

```csharp
public class EqSlotVariation
{
    public ushort Who { set; get; }                    // 玩家UID
    public ClothingHelper.SlotType Slot { set; get; } // 槽位类型
    public bool Increase { set; get; }                // 增加/减少
}
```

**方法**：
```csharp
public string ToMessage()                           // 转为 G0ZJ 消息
public static EqSlotVariation Parse(string line)    // 从 G0ZJ 消息解析
```

### 2.6 CardAsUnit 类（卡牌单元）

```csharp
public class CardAsUnit
{
    public ushort Who { set; get; }       // 持有者UID
    public ushort Card { set; get; }      // 卡牌ID
    public string CardAs { set; get; }    // 伪装卡牌代码
}
```

**方法**：
```csharp
public Tux GetActualCardAs(XI XI)         // 获取实际卡牌对象
internal string ToRawMessage()            // 转为原始格式
internal static CardAsUnit[] ParseFromLine(string line)  // 从消息解析
```

### 2.7 EqImport 类（装备导入）

```csharp
public class EqImport
{
    public CardAsUnit[] Imports { set; get; }  // 导入单元数组
    public CardAsUnit SingleUnit { set; ... } // 单个设置器
}
```

**方法**：
```csharp
public string ToMessage()                    // 转为 G1IZ 消息
public static EqImport Parse(string line)    // 从 G1IZ 消息解析
public void Handle(XI XI)                    // 处理装备导入
```

**Handle() 逻辑**：
1. 筛选可生效的装备（未禁用）
2. 触发 EquipIntoForce 消息

### 2.8 EqExport 类（装备导出）

```csharp
public class EqExport
{
    public CardAsUnit[] Exports { set; get; } // 导出单元数组
    public CardAsUnit SingleUnit { set; ... } // 单个设置器
}
```

**方法**：
```csharp
public string ToMessage()                    // 转为 G1OZ 消息
public static EqExport Parse(string line)    // 从 G1OZ 消息解析
public void Handle(XI XI)                    // 处理装备导出
```

**Handle() 逻辑**：
1. 筛选可失效的装备（未禁用）
2. 触发 EquipOutofForce 消息

### 2.9 EquipIntoForce 类（装备生效）

```csharp
public class EquipIntoForce
{
    public CardAsUnit[] Imports { set; get; } // 生效单元数组
    public CardAsUnit SingleUnit { set; ... } // 单个设置器
}
```

**方法**：
```csharp
public string ToMessage()                           // 转为 G0ZS 消息
public static EquipIntoForce Parse(string line)     // 从 G0ZS 消息解析
public void Handle(XI XI, Base.VW.IWISV WI)        // 处理装备生效
```

**Handle() 逻辑**：
1. 遍历所有装备
2. 调用 TuxEqiup.IncrAction() 增加效果
3. 广播 EquipIntoForceSemaphore 信号

### 2.10 EquipOutofForce 类（装备失效）

```csharp
public class EquipOutofForce
{
    public CardAsUnit[] Exports { set; get; } // 失效单元数组
    public CardAsUnit SingleUnit { set; ... } // 单个设置器
}
```

**方法**：
```csharp
public string ToMessage()                           // 转为 G0ZL 消息
public static EquipOutofForce Parse(string line)    // 从 G0ZL 消息解析
public void Handle(XI XI, Base.VW.IWISV WI)        // 处理装备失效
```

**Handle() 逻辑**：
1. 遍历所有装备
2. 调用 TuxEqiup.DecrAction() 减少效果
3. 广播 EquipOutofForceSemaphore 信号

### 2.11 信号类

```csharp
public class EqSlotMoveSemaphore        // 槽位移动信号 (E0ZJ)
public class EquipIntoForceSemaphore    // 装备生效信号 (E0ZS)
public class EquipOutofForceSemaphore   // 装备失效信号 (E0ZL)
```

### 2.12 ClothingHelper 类（辅助工具）

```csharp
public static class ClothingHelper
{
    public enum SlotType
    {
        NL = 0, // 无（0）
        WQ = 1, // 武器（1）
        FJ = 2, // 防具（2）
        XB = 3, // 行囊（3）
        EE = 4, // 额外装备（4）
        EX = 5, // 扩展卡牌（5）
        FQ = 6  // 伪造装备（6）
    }
}
```

**静态方法**：
```csharp
public static SlotType ParseSlot(ushort value)                // 数字转槽位
public static bool IsStandard(string line)                    // 判断是否标准装备
public static bool IsEx(string line)                          // 判断是否扩展装备
public static bool IsFakeq(string line)                       // 判断是否伪造装备
public static ushort GetWho(string line)                      // 获取装备者UID
public static ushort GetSource(string line)                   // 获取来源UID
public static bool IsEquipable(Player player, Tux.TuxType tuxType)  // 判断是否可装备
public static int GetSubstitude(Player player, Tux.TuxType tuxType, bool isSlotAssign, Func<string, string> input)  // 获取替换装备
```

**IsEquipable() 逻辑**：
1. 检查 XPDisabled（装备禁用标志）
2. 检查 FyMask（防护掩码）：
   - 武器: 0x1
   - 防具: 0x2
   - 行囊: 0x4

**GetSubstitude() 逻辑**：
1. 检查 FyMask（防护掩码）
2. 检查 ExMask（扩展掩码）
3. 根据 SlotAssign 模式决定替换策略
4. 返回值：
   - 0: 空槽位
   - 正数: 被替换的装备ID
   - -1: 无法装备

## 3. 核心逻辑流程

### 标准装备流程
```
1. 创建 EquipStandard 对象
   │
   ├─ 设置 Who（装备者）
   ├─ 设置 Source（来源）
   ├─ 设置 Cards（装备卡牌）
   └─ 设置 SlotAssign（槽位指定）

2. 序列化为 G0ZB,0 消息
   │
   └─ 格式: G0ZB,0,{Who},{Source},{Coach},{SlotAssign},{Cards}

3. XIG 处理 G0ZB 消息
   │
   └─ EquipStandard.Parse() → 检查槽位容量

4. 槽位分配
   │
   ├─ 检查每个类型的容量
   ├─ 如果槽位已满：
   │   ├─ SlotAssign=true: 直接替换
   │   └─ SlotAssign=false: 询问玩家选择
   └─ 调用 GetSubstitude() 获取替换装备

5. 装备穿戴
   │
   ├─ 移除来源玩家的卡牌
   ├─ 设置装备槽：
   │   ├─ WQ → player.Weapon
   │   ├─ FJ → player.Armor
   │   ├─ XB → player.Trove
   │   └─ EE → player.ExEquip
   ├─ 广播 EquipSemaphore
   └─ 触发 EqImport（装备生效）
```

### 装备生效流程
```
1. EqImport.Handle()
   │
   ├─ 筛选可生效装备（未禁用）
   └─ 触发 EquipIntoForce

2. EquipIntoForce.Handle()
   │
   ├─ 遍历所有装备
   ├─ 调用 TuxEqiup.IncrAction()
   │   └─ 增加玩家属性（STR/DEX等）
   └─ 广播 EquipIntoForceSemaphore
```

### 装备失效流程
```
1. EqExport.Handle()
   │
   ├─ 筛选可失效装备（未禁用）
   └─ 触发 EquipOutofForce

2. EquipOutofForce.Handle()
   │
   ├─ 遍历所有装备
   ├─ 调用 TuxEqiup.DecrAction()
   │   └─ 减少玩家属性
   └─ 广播 EquipOutofForceSemaphore
```

### 槽位变化流程
```
1. 创建 EqSlotVariation 对象
   │
   ├─ 设置 Who（玩家）
   ├─ 设置 Slot（槽位）
   └─ 设置 Increase（增加/减少）

2. 序列化为 G0ZJ 消息

3. XIG 处理 G0ZJ 消息
   │
   ├─ 增加槽位：
   │   ├─ 清除 FyMask 对应位
   │   └─ 设置 ExMask
   └─ 减少槽位：
       ├─ 检查 ExMask
       ├─ 如果有 ExEquip，移动到原槽位
       ├─ 设置 FyMask
       └─ 广播 EqSlotMoveSemaphore
```

## 4. 关键数据结构

### SlotType 枚举
```
NL: 无（0）
WQ: 武器（1）- Weapon
FJ: 防具（2）- Armor
XB: 行囊（3）- Trove
EE: 额外装备（4）- ExEquip
EX: 扩展卡牌（5）- ExCards
FQ: 伪造装备（6）- Fakeq
```

### 玩家装备属性
```csharp
Player.Weapon        // 武器槽
Player.Armor         // 防具槽
Player.Trove         // 行囊槽
Player.ExEquip       // 额外装备槽
Player.ExCards       // 扩展卡牌列表
Player.Fakeq         // 伪造装备字典 (ushort -> string)
Player.FyMask        // 防护掩码（0x1武器/0x2防具/0x4行囊）
Player.ExMask        // 扩展掩码
Player.XPDisabled    // 装备禁用标志
Player.WeaponDisabled // 武器禁用
Player.ArmorDisabled  // 防具禁用
Player.TroveDisabled  // 行囊禁用
```

### 消息格式

#### G0ZB（装备）
```
G0ZB,{Type},{Who},{Source},{Coach},{SlotAssign},{Cards}
示例: G0ZB,0,1,3,1,0,201
解释: 标准装备，玩家1从玩家3获得装备201，不指定槽位
```

#### G0ZJ（槽位变化）
```
G0ZJ,{Who},{Slot},{Increase}
示例: G0ZJ,1,1,1
解释: 玩家1增加武器槽
```

#### G1IZ（装备导入）
```
G1IZ,{Who1},{Card1},{CardAs1},...
示例: G1IZ,1,201,0
解释: 玩家1的装备201导入
```

#### G1OZ（装备导出）
```
G1OZ,{Who1},{Card1},{CardAs1},...
示例: G1OZ,1,201,0
解释: 玩家1的装备201导出
```

#### G0ZS（装备生效）
```
G0ZS,{Who1},{Card1},{CardAs1},...
示例: G0ZS,1,201,0
解释: 玩家1的装备201生效
```

#### G0ZL（装备失效）
```
G0ZL,{Who1},{Card1},{CardAs1},...
示例: G0ZL,1,201,0
解释: 玩家1的装备201失效
```

#### E0ZB（装备信号）
```
E0ZB,{Who},{Source},{Slot},{Cards},{CardAs}
示例: E0ZB,1,3,1,201,0
解释: 装备信号，玩家1从玩家3获得武器201
```

## 5. 与其他类的交互

### 被调用的类
- `XIG.SimpleGMessage100()`: 处理 G0ZB/G0ZJ 消息
- `XIG.RaiseGMessage()`: 触发装备相关消息
- `TuxEqiup.IncrAction()`: 增加装备效果
- `TuxEqiup.DecrAction()`: 减少装备效果
- `LibTuple.TL.DecodeTux()`: 解码手牌

### 调用的类
- `Player`: 玩家对象
- `TuxEqiup`: 装备卡牌类
- `Luggage`: 行囊卡牌类
- `ContentRule`: 内容规则工具

### 消息流向
```
EquipStandard / EquipExCards / EquipFakeq
    │
    ├─ ToMessage() → G0ZB 消息
    │
    └─ XIG 处理 → 更新装备槽 + 广播
         │
         └─ EquipSemaphore.Telegraph() → E0ZB 信号

EqImport / EqExport
    │
    ├─ Handle() → 筛选可生效/失效装备
    │
    └─ 触发 EquipIntoForce / EquipOutofForce
         │
         └─ Handle() → 调用 IncrAction/DecrAction + 广播
```

## 6. 对 Web 版实现的启示

### 需要移植到 boardgame.io 的逻辑

1. **数据结构**
   - 保留 SlotType 枚举
   - 转换 CardAsUnit 为 TypeScript 接口

2. **装备槽管理**
   - Player.Weapon/Armor/Trove/ExEquip 映射到 G state
   - ExCards/Fakeq 映射到 G state

3. **槽位掩码**
   - FyMask/ExMask 映射到 G state
   - 用于判断是否可装备

4. **装备效果**
   - IncrAction/DecrAction 逻辑保留
   - 用于修改玩家属性

### 可以简化的部分
- 移除 ShowBoard 相关逻辑
- 简化槽位变化流程

### 需要保持的核心
- SlotType 枚举
- 装备穿戴流程
- 槽位容量检查
- 装备生效/失效逻辑
- 伪造装备系统

### 建议的实现
```typescript
enum SlotType {
  NL = 0,
  WQ = 1,
  FJ = 2,
  XB = 3,
  EE = 4,
  EX = 5,
  FQ = 6
}

interface CardAsUnit {
  who: number;
  card: number;
  cardAs: string;
}

interface EquipStandard {
  who: number;
  source: number;
  coach: number;
  slotAssign: boolean;
  cards: number[];
}

// 在 G state 中
interface GameState {
  players: {
    [uid: number]: {
      weapon: number | null;
      armor: number | null;
      trove: number | null;
      exEquip: number | null;
      exCards: number[];
      fakeq: Record<number, string>;
      fyMask: number;
      exMask: number;
    }
  }
}
```
