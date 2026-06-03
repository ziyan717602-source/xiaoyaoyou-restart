# Phase 6：基础前端

> 目标：用最朴素的 UI 实现完整可玩的游戏。
> 预计耗时：5-7 天
> 状态：⬜ 未开始
> 前置依赖：Phase 2 完成（可与 Phase 3-5 并行）

## 任务清单

### 6.1 项目配置

- [ ] 安装 React 相关依赖
- [ ] 配置 Vite
- [ ] 配置 Tailwind CSS
- [ ] 创建入口文件 `src/ui/main.tsx`
- [ ] 创建根组件 `src/ui/App.tsx`

### 6.2 通用 UI 组件

- [ ] `src/ui/components/Card.tsx` - 卡牌基础组件（正面/背面/翻转）
- [ ] `src/ui/components/CardTooltip.tsx` - 卡牌悬浮详情
- [ ] `src/ui/components/Button.tsx` - 按钮（确认/跳过/结束）
- [ ] `src/ui/components/Dialog.tsx` - 模态弹窗
- [ ] `src/ui/components/Toast.tsx` - 操作提示
- [ ] `src/ui/components/Popover.tsx` - 气泡
- [ ] `src/ui/components/ProgressBar.tsx` - 进度条（HP 条）
- [ ] `src/ui/components/Icon.tsx` - 图标

### 6.3 游戏面板组件

- [ ] `src/ui/board/GameBoard.tsx` - 主游戏面板（布局容器）
- [ ] `src/ui/board/PlayerArea.tsx` - 玩家区域（头像、HP、装备、宠物）
- [ ] `src/ui/board/HandArea.tsx` - 手牌区
- [ ] `src/ui/board/CombatArea.tsx` - 战斗区（怪物、战力对比）
- [ ] `src/ui/board/MonsterSlot.tsx` - 怪物槽
- [ ] `src/ui/board/EventLog.tsx` - 游戏日志
- [ ] `src/ui/board/PhaseIndicator.tsx` - 阶段指示器

### 6.4 功能页面

- [ ] `src/ui/features/RoomLobby.tsx` - 房间大厅（创建/加入/列表）
- [ ] `src/ui/features/HeroSelect.tsx` - 选将界面（随机 3 选 1）
- [ ] `src/ui/features/GameSetup.tsx` - 游戏设置
- [ ] `src/ui/features/GameOver.tsx` - 游戏结束

### 6.5 自定义 Hooks

- [ ] `src/ui/hooks/useGameClient.ts` - boardgame.io Client 封装
- [ ] `src/ui/hooks/useGameInput.ts` - 游戏输入状态机（选中 → 高亮 → 提交）
- [ ] `src/ui/hooks/useGameMoves.ts` - Moves 调用封装
- [ ] `src/ui/hooks/useUIStore.ts` - Zustand Store（纯 UI 状态）

### 6.6 全局样式

- [ ] `src/styles/globals.css` - Tailwind 入口 + 全局样式
- [ ] `src/styles/animations.css` - 自定义动画 keyframes

## 产出物

| 产出 | 路径 | 状态 |
|------|------|------|
| 通用组件 | `src/ui/components/*.tsx` | ⬜ |
| 游戏面板 | `src/ui/board/*.tsx` | ⬜ |
| 功能页面 | `src/ui/features/*.tsx` | ⬜ |
| 自定义 Hooks | `src/ui/hooks/*.ts` | ⬜ |
| 全局样式 | `src/styles/*.css` | ⬜ |

## 交互要求

### 技牌阶段

1. 点击手牌区的技牌 → 卡牌上浮高亮
2. 选择目标（点击其他玩家头像）
3. 确认打出

### 战斗阶段

1. 点击"打怪"按钮
2. 选择支援者（点击队友头像）
3. 翻牌动画
4. 战牌阶段轮流出牌
5. 结算显示

### 弃牌阶段

1. 手牌超过上限时，手牌区高亮
2. 点击要弃掉的牌
3. 确认弃牌

## 测试验证

- [ ] 可在浏览器中完整跑通一局游戏
- [ ] 所有阶段流转正常
- [ ] 所有交互操作可正常执行
- [ ] 无 JavaScript 错误

## 备注

_在此记录开发过程中的发现、问题、决策。_
