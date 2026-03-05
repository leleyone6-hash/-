/**
 * 云开发数据库初始化脚本（在云函数环境或 Node 环境执行）
 * 用途：将内置食物库导入 foods 集合。
 */
const fs = require('fs');
const path = require('path');
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function run() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'initFoods.json'), 'utf8'));
  for (const item of data) {
    await db.collection('foods').add({ data: item });
  }
  console.log(`Imported ${data.length} foods`);
}

run();
