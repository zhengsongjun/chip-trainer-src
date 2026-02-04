# Lowball A-5 模式牌力比较修复

## 问题描述
在 Lowball A-5 模式中，当比较对子、三条、四条等牌型时，系统存在错误的判断逻辑：
1. 一对7（7d7c6h9d5d） vs 一对J（9sjsjh2d3s） - 系统判定J对获胜，但应该是7对获胜
2. 一对6（7d9s6c6s3d） vs 一对A（thqhas6hac） - 系统判定6对获胜，但应该是A对获胜

## 修复方案

### 1. 牌型处理逻辑优化
在 `src/utils/PokerHandReader.ts` 和 `src/pages/BoardAnalysis/Index.vue` 中的 `getLowballA5Score` 函数中：
- 对于一对牌型：先找到对子的点数，然后将其他牌从大到小排列
- 对于两对牌型：先比较大的对子，然后小的对子，然后单张
- 对于三条牌型：先比较三条的点数，然后是单张
- 对于葫芦牌型：先比较三条的点数，然后是对子的点数
- 对于四条牌型：先比较四条的点数，然后是单张

### 2. 分数计算位权修正
将高牌值编码到分数中时，位权顺序从高位到低位进行调整，确保更小的点数获得更低的分数：
```javascript
// 修复前（错误）
highCardValue += card * Math.pow(16, index)

// 修复后（正确）
highCardValue += card * Math.pow(16, highCards.length - 1 - index)
```

## 修复文件
1. `src/utils/PokerHandReader.ts` - 主要牌力计算函数
2. `src/pages/BoardAnalysis/Index.vue` - 页面内部的牌力计算函数

## 验证结果
- 一对7 vs 一对J：现在正确判定7对获胜
- 一对A vs 一对6：现在正确判定A对获胜

项目构建成功，所有修复已生效。