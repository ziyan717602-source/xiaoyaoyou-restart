# Phase 0 - 准备周

> 目标：消除所有模糊信息，产出可执行的数据字典。

## 状态

| 项目 | 值 |
|------|-----|
| 状态 | ✅ 已完成 |
| 开始时间 | 2026-06-02 |
| 完成时间 | 2026-06-02 |
| 总耗时 | 约 30 分钟 |

## 任务清单

### 0.1 数据库导出 ✅

- [x] 创建 database-export/package.json
- [x] 创建 database-export/export.mjs
- [x] 导出 heroes.json（123 条记录）
- [x] 导出 monsters.json（67 条记录）
- [x] 导出 tux.json（68 条记录）
- [x] 导出 npcs.json（97 条记录）
- [x] 导出 events.json（47 条记录）
- [x] 导出 skills.json（322 条记录）
- [x] 导出 runes.json（8 条记录）
- [x] 导出 exsp.json（53 条记录）
- [x] 验证所有 JSON 文件数据完整性（共 785 条记录）

### 0.2 C# 源码标注 ✅

- [x] XIS.cs - 游戏主循环
- [x] XIR.cs - 回合流程
- [x] XIG.cs - G 消息/效果触发
- [x] HPIssue.cs - 伤害/治疗
- [x] Coaching.cs - 战斗参与者管理
- [x] Customs.cs - 弃牌系统
- [x] Clothing.cs - 装备系统

### 0.3 文档校准 - game-flow.md ✅

- [x] 确认回合阶段顺序
- [x] 确认战斗 7 阶段流程
- [x] 确认死亡处理流程
- [x] 确认倾慕链规则
- [x] 确认横置规则
- [x] 确认混战规则
- [x] 消除所有模糊描述

### 0.4 文档校准 - card-info.md ✅

- [x] 补充角色技能触发时机（skills.json.OCCURS 字段）
- [x] 补充角色技能优先级（skills.json.PRIORS 字段）
- [x] 补充怪物效果参数（SPI 位掩码系统完整说明）
- [x] 补充手牌 TARGET 字段（tux.json.TARGET 字段）
- [x] 补充手牌使用条件（tux.json.OCCURS 字段）
- [x] 补充装备消耗条件（装备条件和爆发条件）

## 产出物

| 文件 | 位置 | 状态 |
|------|------|------|
| heroes.json | src/shared/data/ | ✅ 123 条 |
| monsters.json | src/shared/data/ | ✅ 67 条 |
| tux.json | src/shared/data/ | ✅ 68 条 |
| npcs.json | src/shared/data/ | ✅ 97 条 |
| events.json | src/shared/data/ | ✅ 47 条 |
| skills.json | src/shared/data/ | ✅ 322 条 |
| runes.json | src/shared/data/ | ✅ 8 条 |
| exsp.json | src/shared/data/ | ✅ 53 条 |
| XIS-annotations.md | docs/csharp-annotations/ | ✅ |
| XIR-annotations.md | docs/csharp-annotations/ | ✅ |
| XIG-annotations.md | docs/csharp-annotations/ | ✅ |
| HPIssue-annotations.md | docs/csharp-annotations/ | ✅ |
| Coaching-annotations.md | docs/csharp-annotations/ | ✅ |
| Customs-annotations.md | docs/csharp-annotations/ | ✅ |
| Clothing-annotations.md | docs/csharp-annotations/ | ✅ |
| game-flow.md（校准后） | reference/docs/ | ✅ 387 行 |
| card-info.md（校准后） | reference/docs/ | ✅ 422 行 |

## 备注

- 数据库路径：reference/psd48-master/~ex-lib/psd.db3
- C# 源码路径：reference/psd48-master/
- 导出工具使用 sql.js（better-sqlite3 需要原生编译，改用纯 JS 方案）
- JSON 数据包含所有版本/扩展数据（123 英雄、67 怪物等），Phase 1 筛选范围内子集
- game-flow.md 关键校准：妨碍者由敌方玩家自行选择（非"推举"），战斗流程细化为 12 个子阶段
- card-info.md 关键校准：补充了所有技能的 OCCURS/PRIORS 字段、SPI 位掩码系统、TARGET 编码
