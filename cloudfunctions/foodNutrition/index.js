const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const keyword = (event.keyword || '').trim();
  if (!keyword) {
    const list = await db.collection('foods').limit(30).get();
    return { list: list.data };
  }

  const byName = await db.collection('foods').where({ name: db.RegExp({ regexp: keyword, options: 'i' }) }).get();
  const byAlias = await db.collection('foods').where({ aliases: _.in([keyword]) }).get();
  const map = new Map();
  [...byName.data, ...byAlias.data].forEach((f) => map.set(f.name, f));
  return { list: [...map.values()] };
};
