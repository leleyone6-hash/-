const { MEAL_TEMPLATES } = require('../../utils/mealTemplates');

Page({
  data: {
    profile: {
      gender: 'male',
      age: 28,
      heightCm: 175,
      weightKg: 70,
      goal: 'cut',
      dayType: 'training',
      cardioDailyKcal: 0,
      strengthDailyKcal: 250,
      proteinPerKg: 2.0,
      threshold: 0.05,
      mealTemplate: 'no_strength',
      targetMode: 'auto',
      customTarget: { kcal: 2000, carb: 200, protein: 140, fat: 60 }
    },
    genderOptions: ['male', 'female'],
    goalOptions: ['cut', 'bulk'],
    dayTypeOptions: ['training', 'rest'],
    mealTemplateKeys: Object.keys(MEAL_TEMPLATES),
    mealTemplateNames: Object.values(MEAL_TEMPLATES).map((t) => t.name),
    calcResult: null
  },

  async onShow() {
    await this.loadProfile();
  },

  async loadProfile() {
    const db = wx.cloud.database();
    const openid = await this.getOpenid();
    const res = await db.collection('users').where({ openid }).get();
    if (res.data[0]) {
      this.setData({ profile: { ...this.data.profile, ...res.data[0].profile } });
    }
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`profile.${key}`]: e.detail.value });
  },

  onPicker(e) {
    const key = e.currentTarget.dataset.key;
    const optionsKey = e.currentTarget.dataset.optionsKey;
    const options = this.data[optionsKey] || [];
    const val = options[Number(e.detail.value)];
    this.setData({ [`profile.${key}`]: val });
  },

  onMealTemplateChange(e) {
    const idx = Number(e.detail.value);
    this.setData({ 'profile.mealTemplate': this.data.mealTemplateKeys[idx] });
  },

  async calculateAndSave() {
    const profile = {
      ...this.data.profile,
      age: Number(this.data.profile.age),
      heightCm: Number(this.data.profile.heightCm),
      weightKg: Number(this.data.profile.weightKg),
      cardioDailyKcal: Number(this.data.profile.cardioDailyKcal || 0),
      strengthDailyKcal: Number(this.data.profile.strengthDailyKcal || 0),
      proteinPerKg: Number(this.data.profile.proteinPerKg || 0)
    };

    const res = await wx.cloud.callFunction({ name: 'calcTargets', data: { profile } });
    if (res.result.ok) {
      this.setData({ calcResult: res.result.dailyTarget });
      wx.showToast({ title: '已保存并更新目标' });
    }
  },

  async getOpenid() {
    if (getApp().globalData.openid) return getApp().globalData.openid;
    const res = await wx.cloud.callFunction({ name: 'login' }).catch(() => ({ result: {} }));
    const openid = res.result.openid || 'mock-openid';
    getApp().globalData.openid = openid;
    return openid;
  }
});
