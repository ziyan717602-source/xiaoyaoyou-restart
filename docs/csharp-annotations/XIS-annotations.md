# XIS.cs 源码标注文档

## 1. 文件概述

XIS.cs 是 XI 类的分部类实现，负责**游戏房间的启动和网络管理**。该文件处理以下核心功能：
- 单机模式（SF）和联网模式（NT）的房间创建
- 玩家连接管理、观战者处理、断线重连
- 房间隧道维护（HoldRoomTunnel）

在整个游戏系统中，XIS.cs 是**会话管理层**，负责建立玩家之间的网络连接，为后续的游戏逻辑（XIR.cs）和消息处理（XIG.cs）奠定基础。

## 2. 完整方法清单

| 方法名 | 可见性 | 参数 | 返回值 | 功能说明 |
|--------|--------|------|--------|----------|
| GetValue | private | string[] args, int index, string hint | string | 获取命令行参数值 |
| StartRoom | private | string[] args | void | 启动游戏房间（主入口） |
| StartRoom | private | int room, int[] opts, ushort[] invs, string[] trainer | void | 通过大厅启动房间 |
| HandleHoldOfWatcher | private | ushort wuid | void | 处理观察者加入 |
| HandleHoldOfReconnect | private | ushort wuid | void | 处理玩家重连 |
| HoldRoomTunnel | private | 无 | void | 后台监听房间连接 |

## 3. 核心逻辑流程

### StartRoom(string[] args) 流程
1. 初始化 VI（视觉界面）和 WI（网络接口）
2. 判断联机模式（SF=单机/NT=联网）
3. **单机模式**：
   - 创建6个模拟玩家（Neayer）
   - 随机分配UID和队伍
   - 创建XIClient处理每个玩家的输入输出
   - 广播初始化消息 H0SD
4. **联网模式**：
   - 获取网络配置（队伍模式、房间等级、端口）
   - 显示本机IP地址
   - 创建Aywi网络监听
   - 等待玩家连接并确认准备
   - 广播初始化消息 H0SD
5. 设置房间状态并启动游戏选择和主循环

### HandleHoldOfWatcher 流程
1. 发送当前选人模式和等级 H0SM
2. 如果游戏已开始（非H0PR阶段）：
   - 发送玩家列表 H09N
   - 发送游戏板序列化消息
   - 发送场地状态 H09P
3. 如果在选人阶段：
   - 发送对应的选人模式（Pick/Table/Public/Congress）

### HoldRoomTunnel 流程
1. 在后台任务中无限循环
2. 调用 aywi.CatchNewRoomComer() 获取新连接
3. 如果 UID > 1000：处理观察者加入
4. 如果 UID != 0：处理玩家重连并恢复输入事件
5. 如果 UID = 0：退出循环

## 4. 关键数据结构

### 常量
```csharp
private const int playerCapacity = 6;  // 玩家容量
```

### 依赖的关键对象
- **VI (VW.Djvi/VW.Ajvi)**: 视觉界面接口，处理控制台输入输出
- **WI (VW.Djwi/VW.Aywi)**: 网络接口，处理消息收发
- **Board.Garden**: 玩家字典 (ushort -> Player)
- **LibTuple**: 包含各种卡牌库 (HL英雄库, TL手牌库, ML怪物库等)

## 5. 与其他类的交互

### 调用的类
- `VW.Djvi` / `VW.Ajvi`: 控制台界面实现
- `VW.Djwi` / `VW.Aywi`: 网络通信实现
- `PSD.ClientZero.XIClient`: 客户端输入处理
- `PSD.Base.Player`: 玩家对象
- `PSD.Base.NetworkCode`: 网络端口配置
- `PSD.Base.Rules.RuleCode`: 规则代码（模式、等级）

### 被调用的类
- `XI.Run()`: 主游戏循环入口
- `XI.SelectHero()`: 选人阶段入口
- `XI.SafeExecute()`: 安全执行包装器

### 广播的消息
- `H0SD`: 游戏初始化数据
- `H0SM`: 选人模式和等级
- `H09N`: 玩家列表
- `H09P`: 场地状态
- `H09R`: 重连确认
- `H09I`: 选人阶段标识

## 6. 对 Web 版实现的启示

### 需要移植到 boardgame.io 的逻辑

1. **房间管理**
   - 替换为 boardgame.io 的 Lobby 系统
   - 移除 TCP 直连，使用 WebSocket
   - 移除控制台输入，使用 React UI

2. **玩家初始化**
   - 保留 `Board.Garden` 字典结构
   - Player 对象的创建和初始化逻辑
   - 队伍分配逻辑（基于 UID 奇偶）

3. **观察者和重连**
   - boardgame.io 内置重连支持
   - 观察者功能可通过 game state 的 spectators 实现

4. **消息协议**
   - C# 的字符串消息协议需要转换为 TypeScript 类型
   - 保留消息格式作为 UI 事件的基础

### 可以简化的部分
- 移除单机模式（SF）的模拟玩家逻辑
- 移除控制台交互（GetValue 方法）
- 移除网络端口配置逻辑

### 需要保持的核心
- 玩家对象的初始化流程
- 房间状态同步机制（观察者/重连时的状态广播）
- 游戏开始前的准备工作流程
