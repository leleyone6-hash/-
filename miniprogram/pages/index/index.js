Page({
  data: {
    date: '',
    totals: { kcal: 0, carb: 0, protein: 0, fat: 0 },
    target: { kcal: 0, carb: 0, protein: 0, fat: 0 },
    status: { carb: '无目标', protein: '无目标', fat: '无目标' },
    perMealTargets: {},
    perMealActual: {},
    mealKeys: []
  },

  onShow() {
    this.loadToday();
  },

  async loadToday() {
    const date = this.formatDate(new Date());
    this.setData({ date });
    try {
      const db = wx.cloud.database();
      const openid = await this.getOpenid();
      const [targetRes, logsRes] = await Promise.all([
        db.collection('dailyTargets').where({ openid, date }).get(),
        db.collection('logs').where({ openid, date }).get()
      ]);

      const targetDoc = targetRes.data[0] || { target: {}, perMealTargets: {} };
      const totals = { kcal: 0, carb: 0, protein: 0, fat: 0 };
      const perMealActual = {};
      logsRes.data.forEach((item) => {
        totals.kcal += item.intake.kcal;
        totals.carb += item.intake.carb;
        totals.protein += item.intake.protein;
        totals.fat += item.intake.fat;
        if (!perMealActual[item.mealType]) perMealActual[item.mealType] = { kcal: 0, carb: 0, protein: 0, fat: 0 };
        perMealActual[item.mealType].kcal += item.intake.kcal;
        perMealActual[item.mealType].carb += item.intake.carb;
        perMealActual[item.mealType].protein += item.intake.protein;
        perMealActual[item.mealType].fat += item.intake.fat;
      });

      const status = {
        carb: this.judge(totals.carb, targetDoc.target.carb),
        protein: this.judge(totals.protein, targetDoc.target.protein),
        fat: this.judge(totals.fat, targetDoc.target.fat)
      };

      const perMealTargets = targetDoc.perMealTargets || {};
      const mealKeys = Object.keys(perMealTargets);
      this.setData({ totals, target: targetDoc.target || {}, status, perMealTargets, perMealActual, mealKeys });
    } catch (e) {
      wx.showToast({ icon: 'none', title: '加载失败，请检查云环境' });
    }
  },

  judge(intake, target) {
    if (!target) return '无目标';
    const ratio = intake / target;
    if (Math.abs(ratio - 1) <= 0.05) return '达标';
    return ratio < 1 ? '偏低' : '偏高';
  },

  async getOpenid() {
    if (getApp().globalData.openid) return getApp().globalData.openid;
    const res = await wx.cloud.callFunction({ name: 'login' }).catch(() => ({ result: {} }));
    const openid = res.result.openid || 'mock-openid';
    getApp().globalData.openid = openid;
    return openid;
  },

  formatDate(d) {
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }
});
