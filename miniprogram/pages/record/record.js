Page({
  data: {
    mode: 'manual',
    mealType: 'breakfast',
    foodName: '',
    weightG: 100,
    foods: [],
    selectedFood: null,
    intakePreview: null,
    customPer100: { kcal: '', carb: '', protein: '', fat: '' }
  },

  async onShow() {
    await this.loadFoods();
  },

  async loadFoods(keyword = '') {
    const res = await wx.cloud.callFunction({ name: 'foodNutrition', data: { keyword } });
    this.setData({ foods: res.result.list || [] });
  },

  onKeywordInput(e) {
    this.loadFoods(e.detail.value.trim());
  },

  onSelectFood(e) {
    const idx = e.currentTarget.dataset.idx;
    const food = this.data.foods[idx];
    this.setData({ selectedFood: food, foodName: food.name });
    this.calcPreview();
  },

  onWeightInput(e) {
    this.setData({ weightG: Number(e.detail.value || 0) });
    this.calcPreview();
  },

  onMealChange(e) {
    this.setData({ mealType: e.detail.value });
  },

  onCustomInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`customPer100.${key}`]: e.detail.value });
  },

  calcPreview() {
    const food = this.data.selectedFood;
    if (!food) return;
    const factor = (this.data.weightG || 0) / 100;
    const intake = {
      kcal: Math.round(food.per100.kcal * factor),
      carb: Math.round(food.per100.carb * factor),
      protein: Math.round(food.per100.protein * factor),
      fat: Math.round(food.per100.fat * factor)
    };
    this.setData({ intakePreview: intake });
  },

  async recognizePhoto() {
    const choose = await wx.chooseMedia({ count: 1, mediaType: ['image'] });
    const tempFilePath = choose.tempFiles[0].tempFilePath;
    const upload = await wx.cloud.uploadFile({
      cloudPath: `food-images/${Date.now()}.jpg`,
      filePath: tempFilePath
    });
    const recog = await wx.cloud.callFunction({ name: 'foodRecognize', data: { fileID: upload.fileID } });
    const foodName = recog.result.foodName;
    this.setData({ foodName });
    await this.loadFoods(foodName);
    if (!recog.result.found) {
      wx.showToast({ icon: 'none', title: '识别失败，请手动选择或录入' });
    }
  },

  async saveLog() {
    let selectedFood = this.data.selectedFood;
    if (!selectedFood) {
      const p = this.data.customPer100;
      if (!this.data.foodName || !p.kcal) {
        wx.showToast({ icon: 'none', title: '请选择食物或填写自定义营养' });
        return;
      }
      selectedFood = {
        name: this.data.foodName,
        per100: {
          kcal: Number(p.kcal),
          carb: Number(p.carb || 0),
          protein: Number(p.protein || 0),
          fat: Number(p.fat || 0)
        },
        source: 'custom'
      };
    }

    const res = await wx.cloud.callFunction({
      name: 'logMeal',
      data: {
        mealType: this.data.mealType,
        foodName: selectedFood.name,
        weightG: Number(this.data.weightG),
        per100: selectedFood.per100
      }
    });

    if (res.result && res.result.ok) {
      wx.showToast({ title: '记录成功' });
      this.setData({ selectedFood: null, intakePreview: null, foodName: '', weightG: 100 });
      await this.loadFoods();
    }
  }
});
