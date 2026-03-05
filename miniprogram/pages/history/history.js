Page({
  data: {
    days: [],
    selectedDate: '',
    detailLogs: []
  },

  onShow() {
    this.loadHistory();
  },

  async loadHistory() {
    const db = wx.cloud.database();
    const openid = await this.getOpenid();
    const res = await db.collection('logs').where({ openid }).orderBy('date', 'desc').limit(300).get();
    const map = {};
    res.data.forEach((item) => {
      if (!map[item.date]) map[item.date] = { date: item.date, kcal: 0, carb: 0, protein: 0, fat: 0, weightKg: item.weightSnapshot || null };
      map[item.date].kcal += item.intake.kcal;
      map[item.date].carb += item.intake.carb;
      map[item.date].protein += item.intake.protein;
      map[item.date].fat += item.intake.fat;
    });
    this.setData({ days: Object.values(map).sort((a, b) => (a.date < b.date ? 1 : -1)) });
  },

  async viewDay(e) {
    const date = e.currentTarget.dataset.date;
    const db = wx.cloud.database();
    const openid = await this.getOpenid();
    const res = await db.collection('logs').where({ openid, date }).orderBy('createdAt', 'asc').get();
    this.setData({ selectedDate: date, detailLogs: res.data });
  },

  async getOpenid() {
    if (getApp().globalData.openid) return getApp().globalData.openid;
    const res = await wx.cloud.callFunction({ name: 'login' }).catch(() => ({ result: {} }));
    const openid = res.result.openid || 'mock-openid';
    getApp().globalData.openid = openid;
    return openid;
  }
});
