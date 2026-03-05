const MEAL_TEMPLATES = {
  breakfast_after_training_early: {
    name: '早饭后练（早起版）',
    ratios: { breakfast: 0.2, postWorkout: 0.35, lunch: 0.25, dinner: 0.2 }
  },
  breakfast_after_training_late: {
    name: '早饭后练（晚起版）',
    ratios: { breakfast: 0, lunch: 0.4, dinner: 0.3, snack: 0.3 }
  },
  pre_lunch_training: {
    name: '午饭前练',
    ratios: { breakfast: 0.2, preWorkout: 0.15, lunch: 0.35, dinner: 0.3 }
  },
  post_lunch_training: {
    name: '午饭后练',
    ratios: { breakfast: 0.2, lunch: 0.15, postWorkout: 0.35, dinner: 0.3 }
  },
  pre_dinner_training: {
    name: '晚饭前练',
    ratios: { breakfast: 0.2, lunch: 0.25, preWorkout: 0.15, dinner: 0.4 }
  },
  post_dinner_training: {
    name: '晚饭后练',
    ratios: { breakfast: 0.2, lunch: 0.25, dinner: 0.15, postWorkout: 0.4 }
  },
  night_training: {
    name: '夜里练',
    ratios: { breakfast: 0.25, lunch: 0.3, dinner: 0.25, postWorkout: 0.2 }
  },
  no_strength: {
    name: '无力训者',
    ratios: { breakfast: 0.3, lunch: 0.35, dinner: 0.35 }
  }
};

module.exports = {
  MEAL_TEMPLATES
};
