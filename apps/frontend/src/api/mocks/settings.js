// src/api/mocks/settings.js

let mockSettings = {
  _id: "65f2a1b3c4d5e6f7a8b9c0d1",
  storeName: "ShopManager Store",
  storeAddress: "Nouakchott, Mauritanie",
  storePhone: "36123456",
  logoUrl: "",
  currency: "MRU",
  invoiceFooter: "Merci de votre visite !",
  invoiceSignature: "",
  theme: "light",
  language: "fr"
};

export const mockSettingsApi = {
  getSettings: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      data: mockSettings,
      error: null,
      meta: null
    };
  },
  
  updateSettings: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    mockSettings = {
      ...mockSettings,
      ...data
    };
    return {
      success: true,
      data: mockSettings,
      error: null,
      meta: null
    };
  }
};
