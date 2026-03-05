const { MEAL_TEMPLATES } = require('./mealTemplates');

const DEFAULT_THRESHOLD = 0.05;

/**
 * 根据性别、体重、身高、年龄计算 BMR（Mifflin-St Jeor）
 */
function calcBMR(profile) {
  const base = profile.weightKg * 9.99 + profile.heightCm * 6.25 - profile.age * 4.92;
  return profile.gender === 'male' ? base + 5 : base - 161;
}

/**
 * 按需求中的 Excel 公式计算每日目标：
 * 1) b = BMR / 0.7
 * 2) e1 = b + c + d（力训日）; e2 = b + d（休息日）
 * 3) 减脂：f=0.64*e; 增肌：f=0.84*e
 * 4) fat 默认值根据目标/性别/体重
 * 5) protein 默认按 proteinPerKg
 * 6) carbs = (kcal - protein*4 - fat*9)/4，四舍五入且 >=0
 */
function calcDailyTargets(profile, dayType = 'training') {
  const bmr = calcBMR(profile);
  const b = bmr / 0.7;
  const d = Number(profile.cardioDailyKcal || 0);
  const c = Number(profile.strengthDailyKcal || 0);
  const isTraining = dayType === 'training';
  const e = isTraining ? b + c + d : b + d;
  const factor = profile.goal === 'cut' ? 0.64 : 0.84;
  const targetKcal = Math.round(e * factor);

  let fat = 0;
  if (profile.goal === 'cut') {
    if (profile.gender === 'male') {
      fat = profile.weightKg >= 120 ? 70 : 60;
    } else {
      fat = 50;
    }
  } else {
    fat = profile.gender === 'male' ? 80 : 70;
  }

  const proteinPerKg = Number(profile.proteinPerKg || (profile.goal === 'cut' ? 2.0 : 1.8));
  const protein = Math.round(profile.weightKg * proteinPerKg);
  const carbs = Math.max(0, Math.round((targetKcal - protein * 4 - fat * 9) / 4));

  return {
    kcal: targetKcal,
    carb: carbs,
    protein,
    fat,
    bmr: Math.round(bmr),
    meta: { b: Math.round(b), e: Math.round(e), factor, proteinPerKg }
  };
}

function splitPerMeal(dailyTarget, templateKey) {
  const template = MEAL_TEMPLATES[templateKey] || MEAL_TEMPLATES.no_strength;
  const result = {};
  Object.keys(template.ratios).forEach((mealType) => {
    const ratio = template.ratios[mealType];
    result[mealType] = {
      kcal: Math.round(dailyTarget.kcal * ratio),
      carb: Math.round(dailyTarget.carb * ratio),
      protein: Math.round(dailyTarget.protein * ratio),
      fat: Math.round(dailyTarget.fat * ratio),
      ratio
    };
  });
  return result;
}

function statusByProgress(intake, target, threshold = DEFAULT_THRESHOLD) {
  if (!target || target <= 0) return '无目标';
  const ratio = intake / target;
  if (Math.abs(ratio - 1) <= threshold) return '达标';
  return ratio < 1 ? '偏低' : '偏高';
}

module.exports = {
  calcBMR,
  calcDailyTargets,
  splitPerMeal,
  statusByProgress,
  DEFAULT_THRESHOLD
};
