// Contract-matching mock data for docs/API-Contract.md section 10.
const mockActivityLogs = [
  {
    _id: "70d5ecb8b392d20000000001",
    userId: "60d5ecb8b392d20000000002",
    userName: "Employee User",
    action: "sale",
    details: "Vente #1042 - 980 MRU",
    amount: 980,
    timestamp: "2025-06-16T14:32:11.000Z"
  },
  {
    _id: "70d5ecb8b392d20000000002",
    userId: "60d5ecb8b392d20000000001",
    userName: "Admin User",
    action: "delete_invoice",
    details: "Suppression facture #1039",
    amount: 450,
    timestamp: "2025-06-16T12:10:00.000Z"
  },
  {
    _id: "70d5ecb8b392d20000000003",
    userId: "60d5ecb8b392d20000000003",
    userName: "Cashier User",
    action: "login",
    details: "Connexion utilisateur",
    amount: null,
    timestamp: "2025-06-16T08:05:00.000Z"
  },
  {
    _id: "70d5ecb8b392d20000000004",
    userId: "60d5ecb8b392d20000000002",
    userName: "Employee User",
    action: "logout",
    details: "Deconnexion utilisateur",
    amount: null,
    timestamp: "2025-06-15T18:05:00.000Z"
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockActivityLogApi = {
  getActivityLogs: async (params = {}, currentUser = null) => {
    await delay(300);

    const page = Number(params.page || 1);
    const limit = Number(params.limit || 20);
    const roleScopedLogs = currentUser?.role === 'employee'
      ? mockActivityLogs.filter((log) => log.userId === currentUser._id)
      : mockActivityLogs;

    const filteredLogs = roleScopedLogs.filter((log) => {
      if (params.action && log.action !== params.action) return false;
      if (params.userId && log.userId !== params.userId) return false;
      if (params.from && log.timestamp < params.from) return false;
      if (params.to && log.timestamp > params.to) return false;
      return true;
    });

    return {
      success: true,
      data: filteredLogs,
      error: null,
      meta: {
        page,
        limit,
        total: filteredLogs.length
      }
    };
  }
};
