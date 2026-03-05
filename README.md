# 碳蛋脂管理助手（微信小程序 MVP）

一个可运行的微信小程序 MVP，用于记录食物摄入并计算每日/每餐碳水、蛋白、脂肪目标。

## 功能覆盖
- 微信云开发架构：`miniprogram + cloudfunctions + cloud database`
- 登录与档案：保存性别、年龄、身高、体重、目标、训练/休息、有氧 d、力量 c、proteinPerKg、模板等
- 食物记录：
  - 拍照识别（`foodRecognize`，MVP 默认 mock，可替换真实 API）
  - 手动搜索（`foodNutrition`）
  - 手动录入每100g营养（找不到食物时降级）
- 目标计算（`calcTargets`）：实现题述 Excel 逻辑
- 每餐分配：通过训练模板比例 JSON 分配
- 统计：今日概览、每餐目标 vs 实际、历史按天聚合 + 详情

## 项目结构
- `miniprogram/` 小程序前端
  - `pages/index` 今日概览
  - `pages/record` 记录（拍照/搜索/手动）
  - `pages/settings` 目标设置
  - `pages/history` 历史与趋势
  - `utils/calc.js` 公式实现（前端同构校验用途）
- `cloudfunctions/`
  - `foodRecognize` 图片识别 -> 食物名（MVP mock）
  - `foodNutrition` 食物查询
  - `logMeal` 写入记录
  - `calcTargets` 计算目标并写入 `users/dailyTargets`
- `database/`
  - `initFoods.json` 内置食物库
  - `init.js` 初始化脚本

## 数据库集合设计
- `users`: `{ openid, profile, createdAt }`
- `foods`: `{ name, aliases[], per100:{kcal,carb,protein,fat}, source }`
- `logs`: `{ openid, date, mealType, foodName, weightG, intake:{kcal,carb,protein,fat}, createdAt }`
- `dailyTargets`: `{ openid, date, target:{kcal,carb,protein,fat}, perMealTargets:{...}, createdAt/updatedAt }`

## 本地运行（微信开发者工具）
1. 导入本项目根目录。
2. 在工具中开通并绑定云开发环境。
3. 创建集合：`users`, `foods`, `logs`, `dailyTargets`。
4. 在每个云函数目录执行依赖安装（或开发者工具里“云函数-安装依赖”）：
   - `cd cloudfunctions/calcTargets && npm i`
   - `cd cloudfunctions/foodNutrition && npm i`
   - `cd cloudfunctions/foodRecognize && npm i`
   - `cd cloudfunctions/logMeal && npm i`
5. 上传并部署全部云函数。
6. 导入基础食物库：
   - 方法 A：在云开发数据库控制台导入 `database/initFoods.json` 到 `foods`
   - 方法 B：在可访问云环境的 Node 环境执行 `node database/init.js`
7. 编译运行。

## 说明与后续扩展
- 当前 `foodRecognize` 为可运行的 mock，失败时前端可直接手动录入。
- 真实识别可接腾讯云图像识别 API：云函数内读取 `fileID` 临时 URL 后请求第三方服务。
- `targetMode=custom` 已预留，可在设置页继续扩展自定义目标输入 UI。
- 历史趋势图（7/30天折线）在 MVP 中已提供数据基础，可接入 `ec-canvas` 渲染。
