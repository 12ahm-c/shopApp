import { StoreSettings } from "../modules/storeSettings/settings.model";

let cachedLang: string | null = null;
let cacheTime = 0;

export const getStoreLanguage = async (): Promise<string> => {
  const now = Date.now();
  if (cachedLang && now - cacheTime < 5 * 60 * 1000) {
    return cachedLang;
  }
  const settings = await StoreSettings.findOne().lean();
  cachedLang = settings?.language || "fr";
  cacheTime = now;
  return cachedLang;
};

export const notifText = async () => {
  const lang = await getStoreLanguage();
  const isAr = lang === "ar";

  return {
    // Morning greeting
    morningTitle: (name: string) =>
      isAr ? `صباح الخير، ${name}! ☀️` : `Bonjour, ${name}! ☀️`,
    morningBody: (storeName: string) =>
      isAr
        ? `مرحباً بك في ${storeName}. نتمنى لك يوماً موفقاً. استخدم التطبيق لإدارة مبيعاتك ومشترياتك بسهولة.`
        : `Bienvenue dans ${storeName}. Passez une bonne journée. Utilisez l'application pour gérer vos ventes et achats.`,

    // Low stock
    lowStockTitle: (count: number) =>
      isAr ? `⚠️ منتجات قاربت النفاد (${count})` : `⚠️ Produits bientôt en rupture (${count})`,
    lowStockItemTitle: (name: string) =>
      isAr ? `⚠️ مخزون منخفض: ${name}` : `⚠️ Stock faible : ${name}`,
    lowStockItemBody: (name: string, qty: number, threshold: number) =>
      isAr
        ? `بقي ${qty} وحدة فقط من "${name}". الحد الأدنى: ${threshold}.`
        : `Il reste ${qty} unité(s) de "${name}". Seuil: ${threshold}.`,
    lowStockPushBody: (productList: string, more: string) =>
      `${productList}${more}`,

    // Out of stock
    outOfStockTitle: (name: string) =>
      isAr ? `🚫 نفاد المخزون: ${name}` : `🚫 Rupture de stock : ${name}`,
    outOfStockBody: (name: string) =>
      isAr
        ? `المنتج "${name}" نفد بالكامل. يرجى إعادة التخزين ASAP.`
        : `Le produit "${name}" est en rupture totale. Réapprovisionnez au plus vite.`,

    // Daily summary (21:00)
    dailySummaryTitle: () =>
      isAr ? `📊 تقرير اليوم` : `📊 Rapport du jour`,
    dailySummaryBody: (totalSales: number, orderCount: number, topProduct: string, expenses: number) =>
      isAr
        ? [
            `💰 إجمالي المبيعات: ${totalSales} MRU`,
            `🧾 عدد الفواتير: ${orderCount}`,
            `🏆 أكثر منتج مبيعاً: ${topProduct}`,
            `💸 المصروفات: ${expenses} MRU`
          ].join("\n")
        : [
            `💰 Ventes totales : ${totalSales} MRU`,
            `🧾 Nombre de factures : ${orderCount}`,
            `🏆 Produit le plus vendu : ${topProduct}`,
            `💸 Dépenses : ${expenses} MRU`
          ].join("\n"),

    // Stagnant products
    stagnantTitle: (count: number) =>
      isAr ? `📦 منتجات راكدة (${count})` : `📦 Produits stagnants (${count})`,
    stagnantBody: (productList: string, more: string) =>
      isAr
        ? `لم تُبع خلال 30 يوماً: ${productList}${more}. يُنصح بمراجعة الأسعار أو الترويج لها.`
        : `Non vendus depuis 30 jours : ${productList}${more}. Envisagez de revoir les prix ou la promotion.`,
  };
};
