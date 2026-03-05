const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// MVP 降级方案：
// 1) 可接入腾讯云图像识别 / 第三方 API。
// 2) 当前先返回 mock 识别结果，失败时客户端可手动修正。
exports.main = async (event) => {
  if (!event.fileID) return { found: false, foodName: '' };
  const samples = ['米饭', '鸡胸肉', '鸡蛋', '牛奶', '香蕉', '燕麦'];
  const foodName = samples[Math.floor(Math.random() * samples.length)];
  return { found: true, foodName, raw: { fileID: event.fileID } };
};
