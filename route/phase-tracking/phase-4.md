# Phase 4：角色技能引擎

> 目标：实现所有 34 个角色的技能。
> 预计耗时：5-7 天
> 状态：⬜ 未开始
> 前置依赖：Phase 3 完成

## 任务清单

### 4.1 技能系统框架

- [ ] `src/game/skills/types.ts` - 技能接口定义
- [ ] `src/game/skills/index.ts` - 技能注册表（按触发时机索引）
- [ ] `src/game/skills/resolver.ts` - 技能解析器（遍历 → 检查 → 执行）

### 4.2 仙剑一（7 角色，14 技能）

- [ ] `src/game/skills/xianjian1.ts`
- [ ] 李逍遥：侠骨柔肠[!]、飞龙探云手[!]
- [ ] 赵灵儿：双剑、梦蛇[!]
- [ ] 赵灵儿·梦蛇：双剑、女娲[!]、变身[!]
- [ ] 林月如：林家剑法[!]、嫉恶如仇[!]
- [ ] 阿奴：鬼灵精、万蛊蚀天[!]
- [ ] 酒剑仙：御剑术[!]、醉仙望月步
- [ ] 拜月教主：水魔兽合体[!]、召唤水魔兽

### 4.3 仙剑二（5 角色，10 技能）

- [ ] `src/game/skills/xianjian2.ts`
- [ ] 王小虎：发挥不稳定[!]、不屈不挠
- [ ] 苏媚：狡猾、拒绝
- [ ] 沈欺霜：仙霞五奇[!]、元灵归心术
- [ ] 孔璘：辣手摧花、生命献祭[!]
- [ ] 魔尊：蓄势待发[!]、崩坏[!]

### 4.4 仙剑三+外传（7 角色，16 技能）

- [ ] `src/game/skills/xianjian3.ts`
- [ ] 唐雪见：追打、连击、好胜
- [ ] 龙葵：变身、熔铸、剑灵
- [ ] 龙葵鬼：变身、控剑、剑魂
- [ ] 紫萱：关爱[!]、神圣[!]
- [ ] 重楼：决斗、手下留情[!]、降临[!]
- [ ] 南宫煌：占卜、摄灵法阵
- [ ] 温慧：阵法[!]、蛮横
- [ ] 星璇：烹饪、兄弟
- [ ] 王蓬絮：饕餮、合成饰品[!]、敏感

### 4.5 仙剑四（5 角色，11 技能）

- [ ] `src/game/skills/xianjian4.ts`
- [ ] 云天河：天河剑[!]、后羿射日弓
- [ ] 韩菱纱：搜囊探宝、劫富济贫、盗墓[!]
- [ ] 柳梦璃：妖王[!]、梦傀儡[!]
- [ ] 慕容紫英：赠剑、剑匣[!]
- [ ] 玄霄：凝冰焚炎[!]、结拜[!]

### 4.6 仙剑五（2 角色，5 技能）

- [ ] `src/game/skills/xianjian5.ts`
- [ ] 龙幽：越行之术[!]、表现欲[!]
- [ ] 小蛮：无法无天、活力[!]、炼药

### 4.7 凤鸣玉誓扩展（8 角色，16 技能）

- [ ] `src/game/skills/fengming.ts`
- [ ] 姜云凡：狂龙迅影斩、山贼
- [ ] 唐雨柔：咏圣调、逆天阵
- [ ] 姜世离：魔君[!]、牺牲
- [ ] 魔翳：锁魂[!]、底牌[!]
- [ ] 湮世穹兵：侵略如火[!]、毁天灭地
- [ ] 欧阳慧：雷灵、雷屏[!]、雳天击

### 4.8 变身系统

- [ ] `src/game/engine/transform.ts`
- [ ] 赵灵儿 ↔ 赵灵儿·梦蛇（条件触发）
- [ ] 龙葵 ↔ 龙葵鬼（主动选择）
- [ ] 孔璘 → 魔尊（死亡时）
- [ ] 魔翳 → 湮世穹兵（队友全灭时）

## 产出物

| 产出 | 路径 | 状态 |
|------|------|------|
| 技能接口 | `src/game/skills/types.ts` | ⬜ |
| 技能注册表 | `src/game/skills/index.ts` | ⬜ |
| 技能解析器 | `src/game/skills/resolver.ts` | ⬜ |
| 仙剑一技能 | `src/game/skills/xianjian1.ts` | ⬜ |
| 仙剑二技能 | `src/game/skills/xianjian2.ts` | ⬜ |
| 仙剑三技能 | `src/game/skills/xianjian3.ts` | ⬜ |
| 仙剑四技能 | `src/game/skills/xianjian4.ts` | ⬜ |
| 仙剑五技能 | `src/game/skills/xianjian5.ts` | ⬜ |
| 凤鸣玉誓技能 | `src/game/skills/fengming.ts` | ⬜ |
| 变身系统 | `src/game/engine/transform.ts` | ⬜ |

## 技能实现规范

### 技能接口

```typescript
interface Skill {
  id: string;
  heroId: string;
  name: string;
  trigger: SkillTrigger;
  isForced: boolean;  // [!] 标记
  condition: (G: GameState, context: SkillContext) => boolean;
  effect: (G: GameState, context: SkillContext) => void;
}
```

### 技能解析器

```typescript
function resolveSkills(G: GameState, trigger: SkillTrigger, context: SkillContext) {
  const skills = skillRegistry.getByTrigger(trigger);

  for (const skill of skills) {
    if (skill.condition(G, context)) {
      if (skill.isForced) {
        skill.effect(G, context);  // 强制发动
      } else {
        // 可选技能，等待玩家确认
        promptPlayerForSkillActivation(skill, context);
      }
    }
  }
}
```

## 测试验证

- [ ] 每个角色的技能按正确时机触发
- [ ] 强制技能[!]自动发动
- [ ] 可选技能等待玩家确认
- [ ] 变身时保留 HP/装备/手牌
- [ ] 多技能同时触发时按正确顺序结算

## 备注

_在此记录开发过程中的发现、问题、决策。_
