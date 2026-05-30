// Contract-matching mock data for docs/API-Contract.md section 11.
let mockNotifications = [
  {
    _id: "80d5ecb8b392d20000000001",
    userId: "60d5ecb8b392d20000000001",
    type: "low_stock",
    title: "Stock faible : Sucre 1kg",
    body: "Il reste 3 unites de Sucre 1kg. Seuil: 10.",
    isRead: false,
    readAt: null,
    data: { productId: "65f2a1b3c4d5e6f7a8b9c0d2" },
    createdAt: "2025-06-16T08:00:00.000Z"
  },
  {
    _id: "80d5ecb8b392d20000000002",
    userId: "60d5ecb8b392d20000000001",
    type: "daily_summary",
    title: "Resume quotidien",
    body: "14 factures et 12 800 MRU de ventes aujourd'hui.",
    isRead: false,
    readAt: null,
    data: {},
    createdAt: "2025-06-16T00:00:00.000Z"
  },
  {
    _id: "80d5ecb8b392d20000000003",
    userId: "60d5ecb8b392d20000000002",
    type: "invoice_deleted",
    title: "Facture annulee",
    body: "La facture #1039 a ete annulee par l'administrateur.",
    isRead: true,
    readAt: "2025-06-16T12:12:00.000Z",
    data: { saleId: "65f2a1b3c4d5e6f7a8b9c0d2" },
    createdAt: "2025-06-16T12:10:00.000Z"
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createEnvelope = (data, meta = null) => ({
  success: true,
  data,
  error: null,
  meta
});

export const mockNotificationApi = {
  getNotifications: async (params = {}, currentUser = null) => {
    await delay(300);
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 20);
    const userId = currentUser?._id;
    const scoped = userId
      ? mockNotifications.filter((notification) => notification.userId === userId)
      : mockNotifications;

    const filtered = scoped.filter((notification) => {
      if (params.unreadOnly && notification.isRead) return false;
      if (params.type && notification.type !== params.type) return false;
      return true;
    });

    const unreadCount = scoped.filter((notification) => !notification.isRead).length;
    const startIndex = (page - 1) * limit;

    return createEnvelope(
      filtered.slice(startIndex, startIndex + limit),
      { page, limit, total: filtered.length, unreadCount }
    );
  },

  markAsRead: async (id) => {
    await delay(200);
    const readAt = new Date().toISOString();
    mockNotifications = mockNotifications.map((notification) =>
      notification._id === id
        ? { ...notification, isRead: true, readAt }
        : notification
    );
    return createEnvelope({ _id: id, isRead: true, readAt });
  },

  markAllAsRead: async (currentUser = null) => {
    await delay(250);
    const readAt = new Date().toISOString();
    let updatedCount = 0;
    mockNotifications = mockNotifications.map((notification) => {
      if (notification.isRead) return notification;
      if (currentUser?._id && notification.userId !== currentUser._id) return notification;
      updatedCount += 1;
      return { ...notification, isRead: true, readAt };
    });
    return createEnvelope({ updatedCount });
  }
};
