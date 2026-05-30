// Contract-matching mock data for docs/API-Contract.md section 2.
const MOCK_ADMIN = {
  _id: "60d5ecb8b392d20000000001",
  name: "Admin User",
  phone: "33445566",
  role: "admin",
  salary: 0,
  attendance: [
    { date: "2025-06-16T00:00:00.000Z", status: "present" }
  ],
  createdAt: "2025-06-01T10:00:00.000Z",
  lastActiveAt: "2025-06-16T14:30:00.000Z"
};

const MOCK_EMPLOYEE = {
  _id: "60d5ecb8b392d20000000002",
  name: "Employee User",
  phone: "11223344",
  role: "employee",
  salary: 10000,
  attendance: [
    { date: "2025-06-16T00:00:00.000Z", status: "present" }
  ],
  createdAt: "2025-06-02T10:00:00.000Z",
  lastActiveAt: "2025-06-16T09:15:00.000Z"
};

const authEnvelope = (user, tokenLabel) => ({
  success: true,
  data: {
    user,
    accessToken: `mock-access-token-${tokenLabel}`,
    refreshToken: `mock-refresh-token-${tokenLabel}`,
    accessTokenExpiresAt: "2025-06-17T14:32:11.000Z",
    refreshTokenExpiresAt: "2025-06-23T14:32:11.000Z"
  },
  error: null,
  meta: null
});

export const mockAuthApi = {
  login: async (phone, password) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const localPhone = phone.replace(/^\+222/, '');

    if (localPhone === '33445566' && password === 'admin') {
      return authEnvelope(MOCK_ADMIN, 'admin');
    }

    if (localPhone === '11223344' && password === 'employe') {
      return authEnvelope(MOCK_EMPLOYEE, 'employee');
    }

    throw {
      code: "AUTH_REQUIRED",
      message: "Numero ou mot de passe incorrect.",
      fields: {}
    };
  },

  getMe: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      data: MOCK_ADMIN,
      error: null,
      meta: null
    };
  }
};
