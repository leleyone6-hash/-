const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function fmt(dateObj) {
  const m = `${dateObj.getMonth() + 1}`.padStart(2, '0');
  const d = `${dateObj.getDate()}`.padStart(2, '0');
  return `${dateObj.getFullYear()}-${m}-${d}`;
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const weightG = Number(event.weightG || 0);
  const per100 = event.per100 || { kcal: 0, carb: 0, protein: 0, fat: 0 };
  const factor = weightG / 100;
  const intake = {
    kcal: Math.round(per100.kcal * factor),
    carb: Math.round(per100.carb * factor),
    protein: Math.round(per100.protein * factor),
    fat: Math.round(per100.fat * factor)
  };

  await db.collection('logs').add({
    data: {
      openid: OPENID,
      date: event.date || fmt(new Date()),
      mealType: event.mealType || 'breakfast',
      foodName: event.foodName,
      weightG,
      intake,
      createdAt: db.serverDate()
    }
  });

  return { ok: true, intake };
};
