const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const MEAL_TEMPLATES = {
  breakfast_after_training_early: { breakfast: 0.2, postWorkout: 0.35, lunch: 0.25, dinner: 0.2 },
  breakfast_after_training_late: { breakfast: 0, lunch: 0.4, dinner: 0.3, snack: 0.3 },
  pre_lunch_training: { breakfast: 0.2, preWorkout: 0.15, lunch: 0.35, dinner: 0.3 },
  post_lunch_training: { breakfast: 0.2, lunch: 0.15, postWorkout: 0.35, dinner: 0.3 },
  pre_dinner_training: { breakfast: 0.2, lunch: 0.25, preWorkout: 0.15, dinner: 0.4 },
  post_dinner_training: { breakfast: 0.2, lunch: 0.25, dinner: 0.15, postWorkout: 0.4 },
  night_training: { breakfast: 0.25, lunch: 0.3, dinner: 0.25, postWorkout: 0.2 },
  no_strength: { breakfast: 0.3, lunch: 0.35, dinner: 0.35 }
};

function calc(profile) {
  const base = profile.weightKg * 9.99 + profile.heightCm * 6.25 - profile.age * 4.92;
  const bmr = profile.gender === 'male' ? base + 5 : base - 161;
  const b = bmr / 0.7;
  const c = Number(profile.strengthDailyKcal || 0);
  const d = Number(profile.cardioDailyKcal || 0);
  const e = profile.dayType === 'training' ? b + c + d : b + d;
  const factor = profile.goal === 'cut' ? 0.64 : 0.84;
  const kcal = Math.round(e * factor);

  let fat = 0;
  if (profile.goal === 'cut') fat = profile.gender === 'male' ? (profile.weightKg >= 120 ? 70 : 60) : 50;
  else fat = profile.gender === 'male' ? 80 : 70;

  const proteinPerKg = Number(profile.proteinPerKg || (profile.goal === 'cut' ? 2.0 : 1.8));
  const protein = Math.round(profile.weightKg * proteinPerKg);
  const carb = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, carb, protein, fat, bmr: Math.round(bmr) };
}

function splitMeals(target, key) {
  const ratios = MEAL_TEMPLATES[key] || MEAL_TEMPLATES.no_strength;
  const out = {};
  Object.keys(ratios).forEach((k) => {
    out[k] = {
      kcal: Math.round(target.kcal * ratios[k]),
      carb: Math.round(target.carb * ratios[k]),
      protein: Math.round(target.protein * ratios[k]),
      fat: Math.round(target.fat * ratios[k]),
      ratio: ratios[k]
    };
  });
  return out;
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const profile = event.profile || {};
  const date = event.date || new Date().toISOString().slice(0, 10);

  const dailyTarget = profile.targetMode === 'custom' ? profile.customTarget : calc(profile);
  const perMealTargets = splitMeals(dailyTarget, profile.mealTemplate);

  await db.collection('users').where({ openid: OPENID }).update({ data: { profile } }).catch(async () => {
    await db.collection('users').add({ data: { openid: OPENID, profile, createdAt: db.serverDate() } });
  });

  await db.collection('dailyTargets').where({ openid: OPENID, date }).update({
    data: {
      target: dailyTarget,
      perMealTargets,
      updatedAt: db.serverDate()
    }
  }).catch(async () => {
    await db.collection('dailyTargets').add({
      data: { openid: OPENID, date, target: dailyTarget, perMealTargets, createdAt: db.serverDate() }
    });
  });

  return { ok: true, dailyTarget, perMealTargets };
};
