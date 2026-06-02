# Phase 4 审查报告：角色技能实现状态

> **审查日期**: 2026-06-02
> **最后更新**: 2026-06-02
> **审查范围**: 34 个角色、76 个技能（skills.json 中所有技能条目）
> **结论**: Phase 4 **骨架完成**。语法错误、heroCode 映射、触发器映射已全部修复。剩余工作为效果逻辑补全。

---

## 一、总体评估

| 指标 | 数值 | 状态 |
|------|------|------|
| 范围内角色总数 | 34 | — |
| 预期技能总数 | 76 | — |
| 语法错误（无法编译） | 0 | ✅ 已修复 |
| console.log 桩代码 | 0 | ✅ 已清除 |
| heroCode 前缀错误 | 0 | ✅ 已修复 |
| 触发器逻辑错误 | 0 | ✅ 已修复（OCCURS→SkillTrigger） |
| 多触发器支持 | 76/76 | ✅ 已完成 |
| **触发器+骨架正确的技能** | **76 (100%)** | ✅ |
| **效果逻辑完整的技能** | **~4 (~5%)** | ⚠️ 待补全 |
| **全部技能正确实现的角色** | **0 / 34** | ⚠️ 效果逻辑待补全 |

---

## 二、已完成的修复

### 2.1 语法错误修复 ✅

| 文件 | 问题 | 修复 |
|------|------|------|
| xianjian1.ts | `console.log` 游离在 `effect` 函数体外 | 已删除 |
| xianjian3.ts | 多余 `}` ×2 + `console.log` 游离 | 已删除 |
| xianjian4.ts | 多余 `},` + 重复代码块 | 已删除 |

### 2.2 require() → import 修复 ✅

| 文件 | 原 require() | 修复方式 |
|------|-------------|----------|
| xianjian1.ts:198 | `require('../engine/transform')` | 顶层 `import { executeTransform }` |
| xianjian1.ts:503 | `require('../moves/drawCards')` | 改用 `effects.ts` 的 `drawCards` |
| xianjian2.ts:277 | `require('../utils/heroUtils')` | 顶层 `import { isFemaleHero }` |

### 2.3 console.log 清除 ✅

所有 50+ 处 `console.log` 已从 7 个技能文件中删除。

### 2.4 HeroCode 映射修复 ✅

| 文件 | 修复内容 |
|------|----------|
| fengming.ts | HL001-HL014 → XJ501-XJ508（匹配 card-info.md） |
| resolver.ts | 删除 HL 分支；修复 X3W 前缀提取（`substring(0,2)` → "X3"） |

### 2.5 触发器映射完成 ✅

**新建文件**：
- `src/game/skills/occurs.ts` — OCCURS 编码解析器（`parseOccur()` / `parseOccurs()`）

**修改文件**：
- `src/shared/types/enums.ts` — SkillTrigger 枚举从 10 个值扩展到 90+ 个值
- `src/game/skills/types.ts` — SkillDefinition 新增 `triggers: SkillTrigger[]` 和 `occurs: string` 字段
- 6 个技能文件 — 76 个技能全部映射到正确触发器

**OCCURS 编码系统**（参考 `reference/psd48-master/`）：

| 格式 | 含义 | 示例 |
|------|------|------|
| `R[scope][phase]` | 回合阶段触发 | `!R$Z1` = 他人战斗开始 |
| `G[scope][event]` | 游戏事件触发 | `!G0IS` = 角色进场 |
| `&[card]&[type]` | 卡牌寄生触发 | `&TP01&0` = 冰心诀使用 |
| `%[N]` | 数据库别名触发 | `%5` = 技牌使用后 |
| `!` 前缀 | 强制触发 | `!R#ST` = 自己回合开始时自动 |
| `?` 前缀 | 条件可选 | `?R*Z2` = 条件满足时可选 |
| 无前缀 | 可选触发 | `R#GR` = 自己技牌阶段可选 |

---

## 三、关键文件清单

| 文件 | 路径 | 状态 |
|------|------|------|
| 类型定义 | `src/game/skills/types.ts` | ✅ 已更新 |
| 注册中心 | `src/game/skills/index.ts` | ✅ 正确 |
| 解析器 | `src/game/skills/resolver.ts` | ✅ 已修复 |
| 系统入口 | `src/game/skills/skillSystem.ts` | ✅ 正确 |
| 效果工具 | `src/game/skills/effects.ts` | ⚠️ 需补充 |
| OCCURS 解析器 | `src/game/skills/occurs.ts` | ✅ 新增 |
| 仙剑一技能 | `src/game/skills/xianjian1.ts` | ✅ 14 技能已修复 |
| 仙剑二技能 | `src/game/skills/xianjian2.ts` | ✅ 10 技能已修复 |
| 仙剑三+外传 | `src/game/skills/xianjian3.ts` | ✅ 23 技能已修复 |
| 仙剑四技能 | `src/game/skills/xianjian4.ts` | ✅ 11 技能已修复 |
| 仙剑五技能 | `src/game/skills/xianjian5.ts` | ✅ 5 技能已修复 |
| 凤鸣玉誓技能 | `src/game/skills/fengming.ts` | ✅ 13 技能已修复 |
| 变身系统 | `src/game/engine/transform.ts` | ✅ 基本正确 |
| 技能数据 | `src/shared/data/skills.json` | ✅ 数据完整 |

---

## 四、逐角色技能状态

> 以下表格标注的是**效果逻辑**的完成状态。触发器映射已全部正确（见各技能的 `occurs` 字段）。

### 4.1 仙剑一（xianjian1.ts）— 7 角色，14 技能

| 角色 | 技能名 | CODE | 触发器 (OCCURS) | 效果状态 |
|------|--------|------|----------------|----------|
| 李逍遥 (XJ101) | 侠骨柔肠 | JN10101 | COMBAT_START_OTHER (`!R$Z1`) | ⚠️ 方向正确，闪避判断硬编码 |
| 李逍遥 (XJ101) | 飞龙探云手 | JN10102 | COMBAT_START_ANY (`!R*Z1`) | ⚠️ 方向正确，闪避判断硬编码 |
| 赵灵儿 (XJ102) | 双剑 | JN10201 | HERO_ENTER + HERO_LEAVE (`!G0IS,!G0OS`) | ⚠️ 仅推入 buff 标记 |
| 赵灵儿 (XJ102) | 梦蛇 | JN10202 | PET_GAINED + HERO_ENTER (`!G0HD,!G0IS`) | ✅ 调用 executeTransform |
| 赵灵儿梦蛇 (XJ103) | 梦蛇·变身 | JN10302 | PET_LOST + HERO_ENTER (`!G0HL,!G0IS`) | ⚠️ 需验证变身系统集成 |
| 赵灵儿梦蛇 (XJ103) | 女娲 | JN10303 | COMBAT_START_ANY + HERO_ENTER/LEAVE (`!R*PD,!G0IS,!G0OS`) | ⚠️ 仅设标志位 |
| 林月如 (XJ104) | 林家剑法 | JN10401 | GLOBAL_WEAPON_EQUIP + REMOVE (`!G1IZ,!G1OZ`) | ⚠️ 武器+1 战力方向正确 |
| 林月如 (XJ104) | 嫉恶如仇 | JN10402 | COMBAT_FAIL_ANY (`!R*VS`) | ⚠️ 方向正确 |
| 阿奴 (XJ105) | 鬼灵精 | JN10501 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 仅转移 1 牌给首个队友 |
| 阿奴 (XJ105) | 万蛊蚀天 | JN10502 | DRAW_PHASE_SELF (`!R#BC`) | ⚠️ 条件和效果方向正确 |
| 酒剑仙 (XJ106) | 御剑术 | JN10601 | GLOBAL_WEAPON_EQUIP + REMOVE (`!G1IZ,!G1OZ`) | ⚠️ 武器+1 战力方向正确 |
| 酒剑仙 (XJ106) | 醉仙望月步 | JN10602 | COMBAT_CLEANUP + DRAW + END (`!R#ZF,!G0HT,!R#ZW`) | ⚠️ 设标志位，二次战斗未实现 |
| 拜月教主 (XJ107) | 水魔兽合体 | JN10701 | COMBAT_START_ANY (`!R*Z1`) | ✅ 水/火+2 战力 |
| 拜月教主 (XJ107) | 召唤水魔兽 | JN10702 | BATTLE_CARD_ANY (`R*ZD`) | ⚠️ 弃牌+灵力池方向正确 |

### 4.2 仙剑二（xianjian2.ts）— 5 角色，10 技能

| 角色 | 技能名 | CODE | 触发器 (OCCURS) | 效果状态 |
|------|--------|------|----------------|----------|
| 王小虎 (XJ201) | 虎煞 | JN20101 | COMBAT_START_ANY (`!R*Z1`) | ⚠️ 骰子逻辑正确 |
| 王小虎 (XJ201) | 不屈不挠 | JN20102 | ON_DICE_ROLL (`G0TT`) | ⚠️ 弃牌重投方向正确 |
| 苏媚 (XJ202) | 狡猾 | JN20201 | COMBAT_START_SELF (`R#Z1`) | ⚠️ 骰子+弃牌方向正确 |
| 苏媚 (XJ202) | 拒绝 | JN20202 | CARD_BINGXINJUE (`&TP01&0`) | ⚠️ 设标志位 |
| 沈欺霜 (XJ203) | 仙霞五奇 | JN20301 | COMBAT_START_ANY + HIT_CHECK (`!R*PD,!G09P`) | ⚠️ 友方+3 战力方向正确 |
| 沈欺霜 (XJ203) | 元灵归心术 | JN20302 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 弃牌+回复方向正确 |
| 孔璘 (XJ206) | 辣手摧花 | JN20601 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 伤害+补牌方向正确 |
| 孔璘 (XJ206) | 生命献祭 | JN20602 | ON_DEATH (`!G0ZW`) | ⚠️ 需验证变身系统集成 |
| 魔尊 (XJ207) | 蓄势待发 | JN20701 | ROUND_START_SELF (`!R#ST`) | ✅ 回合开始补 1 牌 |
| 魔尊 (XJ207) | 崩坏 | JN20702 | TURN_END_SELF (`!R#TM`) | ✅ 回合结束 HP-1 |

### 4.3 仙剑三+外传（xianjian3.ts）— 9 角色，23 技能

| 角色 | 技能名 | CODE | 触发器 (OCCURS) | 效果状态 |
|------|--------|------|----------------|----------|
| 唐雪见 (XJ302) | 追打 | JN30201 | GLOBAL_HP_DECREASE (`G1TH`) | ⚠️ 弃牌+伤害方向正确 |
| 唐雪见 (XJ302) | 连击 | JN30202 | BATTLE_CARD_ANY (`R*ZD`) | ⚠️ 弃牌+补牌方向正确 |
| 唐雪见 (XJ302) | 好胜 | JN30203 | BATTLE_CARD_ANY (`R*ZD`) | ⚠️ 自伤+补牌方向正确 |
| 龙葵蓝 (XJ303) | 朱砂变·红 | JN30301 | ROUND_START_SELF (`R#ST`) | ⚠️ 需验证变身系统集成 |
| 龙葵蓝 (XJ303) | 熔铸 | JN30302 | ALIAS_TECH_POST + TECH_USED (`%5,!G0CC`) | ⚠️ 自伤+使用技牌方向正确 |
| 龙葵蓝 (XJ303) | 剑灵 | JN30303 | BATTLE_CARD_ANY (`R*ZD`) | ⚠️ 弃装备+灵力方向正确 |
| 龙葵红 (XJ304) | 朱砂变·蓝 | JN30401 | ROUND_START_SELF (`R#ST`) | ⚠️ 需验证变身系统集成 |
| 龙葵红 (XJ304) | 控剑 | JN30402 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 获取队友装备方向正确 |
| 龙葵红 (XJ304) | 剑魂 | JN30403 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 弃装备+伤害方向正确 |
| 紫萱 (XJ305) | 关爱 | JN30501 | PET_GAINED (`!G0HD`) | ⚠️ 条件+补牌方向正确 |
| 紫萱 (XJ305) | 神圣 | JN30502 | ON_PET_POWER (`!G0WB`) | ⚠️ 宠物+3 战力方向正确 |
| 重楼 (XJ306) | 决斗 | JN30601 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 掷骰拼点方向正确 |
| 重楼 (XJ306) | 手下留情 | JN30602 | ON_HP_DAMAGE (`!G0OH`) | ⚠️ 保命方向正确 |
| 重楼 (XJ306) | 降临 | JN30603 | COMBAT_START_OTHER (`!R$Z1`) | ⚠️ 妨碍+战力方向正确 |
| 南宫煌 (X3W01) | 占卜 | JN40101 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 弃牌+翻怪方向正确 |
| 南宫煌 (X3W01) | 摄灵法阵 | JN40102 | PET_GAINED (`!G0HD`) | ⚠️ 弃敌方宠物方向正确 |
| 温慧 (X3W02) | 阵法 | JN40201 | BATTLE_CARD_CONFIRM_SELF + HIT_CHECK (`!R#ZC,!G09P`) | ⚠️ 支援+3 战力方向正确 |
| 温慧 (X3W02) | 蛮横 | JN40202 | COMBAT_FAIL_SELF (`R#VS`) | ⚠️ 伤害+补牌方向正确 |
| 星璇 (X3W03) | 烹饪 | JN40301 | CARD_LINGHU (`&TP02&0,&TP02&1`) | ⚠️ 弃牌+回 HP 方向正确 |
| 星璇 (X3W03) | 兄弟 | JN40302 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 平均分配手牌 |
| 王蓬絮 (X3W04) | 饕餮 | JN40401 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 弃牌+回 HP 方向正确 |
| 王蓬絮 (X3W04) | 合成饰品 | JN40403 | ON_ACCESSORY_EQUIP + ITEM_LEAVE (`!G0ZB,!G0OT`) | ⚠️ 饰品+1 战力方向正确 |
| 王蓬絮 (X3W04) | 敏感 | JN40402 | 8 触发器 (`R#GR,R*Z1,...`) | ⚠️ 多触发+1 战力方向正确 |

### 4.4 仙剑四（xianjian4.ts）— 5 角色，11 技能

| 角色 | 技能名 | CODE | 触发器 (OCCURS) | 效果状态 |
|------|--------|------|----------------|----------|
| 云天河 (XJ401) | 天河剑 | JN50101 | COMBAT_START_ANY + 4 装备事件 (`!R*Z1,!G0IX,...`) | ⚠️ 命中+战力方向正确 |
| 云天河 (XJ401) | 后羿射日弓 | JN50102 | BATTLE_CARD_ANY + COMBAT_END_PREP (`R*ZD,!R*Z2`) | ⚠️ +8 战力方向正确 |
| 韩菱纱 (XJ402) | 搜囊探宝 | JN50201 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 弃牌+偷盗方向正确 |
| 韩菱纱 (XJ402) | 劫富济贫 | JN50202 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 补牌方向正确 |
| 韩菱纱 (XJ402) | 盗墓 | JN50203 | ON_DEATH (`!G0ZW`) | ⚠️ 取装备+自伤方向正确 |
| 柳梦璃 (XJ403) | 妖王 | JN50301 | ON_EQUIP_ENTER + 3 事件 (`!G0IC,!G0OC,!G0IS,!G0OS`) | ⚠️ 宠物+战力方向正确 |
| 柳梦璃 (XJ403) | 梦傀儡 | JN50302 | ON_DEATH + COMBAT_END + TRANSFORM (`!G0ZW,!R*ZW,!G0IY`) | ⚠️ 灵魂形态方向正确 |
| 慕容紫英 (XJ404) | 赠剑 | JN50401 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 赠装备+补牌方向正确 |
| 慕容紫英 (XJ404) | 剑匣 | JN50402 | ON_DISCARD_CHECK + HERO_ENTER (`!G0QR,!G0IS`) | ⚠️ 手牌上限+2 方向正确 |
| 玄霄 (XJ405) | 凝冰焚炎 | JN50501 | ON_HP_DAMAGE (`!G0OH`) | ⚠️ 免疫水火伤害方向正确 |
| 玄霄 (XJ405) | 结拜 | JN50502 | HERO_ENTER + COMBAT_START_OTHER + FINAL_LEAVE (`!G0IS,!R$Z1,!G0OY`) | ⚠️ 永久契约方向正确 |

### 4.5 仙剑五（xianjian5.ts）— 2 角色，5 技能

| 角色 | 技能名 | CODE | 触发器 (OCCURS) | 效果状态 |
|------|--------|------|----------------|----------|
| 龙幽 (XJ503) | 越行之术 | JN60302 | ON_HIT_CHECK (`!G09P`) | ⚠️ 支援者强制命中方向正确 |
| 龙幽 (XJ503) | 表现欲 | JN60301 | COMBAT_START_ANY + 3 事件 (`!R*Z1,!G0IY,!G0OY,!G0FI`) | ⚠️ 女性+战力方向正确 |
| 小蛮 (XJ504) | 无法无天 | JN60401 | SKILL_END_OTHER (`R$GE`) | ⚠️ 他人技牌阶段后使用方向正确 |
| 小蛮 (XJ504) | 活力 | JN60402 | COMBAT_START_ANY (`!R*Z1`) | ✅ 参战时补 1 牌 |
| 小蛮 (XJ504) | 炼药 | JN60403 | 9 触发器 (`R#GR,R*Z1,...`) | ⚠️ 弃牌+补牌方向正确 |

### 4.6 凤鸣玉誓（fengming.ts）— 6 角色，13 技能

| 角色 | 技能名 | CODE | 触发器 (OCCURS) | 效果状态 |
|------|--------|------|----------------|----------|
| 姜云凡 (XJ501) | 狂龙迅影斩 | JN60101 | BATTLE_CARD_ANY (`R*ZD`) | ⚠️ 弃牌+TokenCount 方向正确 |
| 姜云凡 (XJ501) | 山贼 | JN60102 | GLOBAL_DRAW (`G1DI,!G1DI`) | ⚠️ 翻牌消耗 Token 方向正确 |
| 唐雨柔 (XJ502) | 咏圣调 | JN60201 | ALIAS_SPECIAL_USE + ANY_CARD_USE (`%2,%4`) | ⚠️ 重定向目标方向正确 |
| 唐雨柔 (XJ502) | 逆天阵 | JN60202 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 获取召唤兽方向正确 |
| 姜世离 (XJ505) | 魔君 | JN60501 | COMBAT_START_OTHER + 5 事件 (`!R$PD,!G1CH,...`) | ⚠️ 支援+已损失 HP 战力方向正确 |
| 姜世离 (XJ505) | 牺牲 | JN60502 | BATTLE_CARD_ANY + COMBAT_END_PREP (`R*ZD,!R*Z2`) | ⚠️ 取胜后强制死亡方向正确 |
| 魔翳 (XJ506) | 锁魂 | JN60601 | ON_DEATH + 2 事件 (`!G0ZW,!R*PD,!G0OJ`) | ⚠️ 收集死亡角色为傀儡方向正确 |
| 魔翳 (XJ506) | 底牌 | JN60602 | ON_DEATH (`!G0ZW`) | ⚠️ 变身为湮世穹兵方向正确 |
| 湮世穹兵 (XJ507) | 侵略如火 | JN60701 | COMBAT_START_SELF (`!R#Z1`) | ⚠️ 战斗+2 战力方向正确 |
| 湮世穹兵 (XJ507) | 毁天灭地 | JN60702 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ 掷骰+全体伤害方向正确 |
| 欧阳慧 (XJ508) | 雷灵 | JN60801 | COMBAT_END_PREP + OBJECT_JOIN (`?R*Z2,!G0OJ`) | ⚠️ 雷灵标记方向正确 |
| 欧阳慧 (XJ508) | 雷屏 | JN60802 | ON_HP_DAMAGE (`G0OH`) | ⚠️ 雷灵抵消伤害方向正确 |
| 欧阳慧 (XJ508) | 雳天击 | JN60803 | SKILL_PHASE_SELF (`R#GR`) | ⚠️ TokenAwake 方向正确 |

---

## 五、缺失的关键功能

| 缺失项 | 说明 | 优先级 |
|--------|------|--------|
| **效果逻辑补全** | 72 个技能的效果函数为简化/桩代码，需按 C# 源码实现完整逻辑 | P2 |
| **玩家选择机制** | 可选技能应提示玩家确认，当前所有可选技能要么自动触发要么仅设标志位 | P2 |
| **G 中的技能状态追踪** | 解析器引用 `G.skillInstances`，但 GameState 类型中未定义此字段 | P2 |
| **变身系统深度集成** | 梦蛇、生命献祭、底牌等变身技能需验证与 transform.ts 的正确交互 | P2 |
| **优先级排序** | 解析器遍历匹配技能时未按 `priority` 排序 | P3 |
| **CODE-ID 映射** | skills.json CODE（JN10101）与实现 ID（xj101_skill1）无映射关系 | P3 |

---

## 六、修复优先级（剩余工作）

| 优先级 | 内容 | 预计时间 | 状态 |
|--------|------|----------|------|
| ~~P0~~ | ~~修复语法错误 + require() + heroCode~~ | 0.5 天 | ✅ 已完成 |
| ~~P1~~ | ~~OCCURS→SkillTrigger 映射 + 触发器修正~~ | 2-3 天 | ✅ 已完成 |
| ~~P1~~ | ~~console.log 清除 + 多触发器支持~~ | 1 天 | ✅ 已完成 |
| **P2** | 补全 72 个技能的效果逻辑 | 5-7 天 | 待做 |
| **P2** | 实现可选技能的玩家确认机制 | 1 天 | 待做 |
| **P2** | GameState 补充 `skillInstances` 字段 | 0.5 天 | 待做 |
| **P3** | 建立 CODE-ID 映射关系 | 0.5 天 | 待做 |

### 工作量估算

| 阶段 | 内容 | 工作量 | 状态 |
|------|------|--------|------|
| Phase 4a | 语法错误 + require() + heroCode | 0.5 天 | ✅ 已完成 |
| Phase 4b | OCCURS→SkillTrigger 映射 | 2-3 天 | ✅ 已完成 |
| Phase 4c | 多触发器支持 + 类型更新 | 0.5 天 | ✅ 已完成 |
| Phase 4d | 效果逻辑补全（72 技能） | 5-7 天 | 待做 |
| Phase 4e | 玩家确认机制 + 测试 | 1-2 天 | 待做 |
| **总计** | | **4-6.5 天** | |

---

## 七、结论

Phase 4 的**骨架层**已全部完成：

- ✅ 类型系统完整（SkillTrigger 90+ 值，SkillDefinition 支持多触发器）
- ✅ OCCURS 解析器可用（`occurs.ts`）
- ✅ 76 个技能的触发器全部正确映射
- ✅ 所有编译错误已修复
- ✅ heroCode 映射正确

**剩余工作**集中在效果逻辑补全（Phase 4d），这是纯实现工作，不涉及架构变更。建议按仙剑系列分批实现，优先处理变身技能（梦蛇、生命献祭、底牌）和战斗核心技能。
