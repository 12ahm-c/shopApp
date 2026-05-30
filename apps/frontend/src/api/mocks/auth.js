// src/api/mocks/auth.js

// Mock Users
const MOCK_ADMIN = {
  _id: "60d5ecb8b392d20000000001",
  name: "Admin User",
  phone: "+22233445566",
  role: "admin",
  salary: 0,
  createdAt: "2025-06-01T10:00:00.000Z"
};

const MOCK_EMPLOYEE = {
  _id: "60d5ecb8b392d20000000002",
  name: "Employee User",
  phone: "+22211223344",
  role: "employee",
  salary: 10000,
  createdAt: "2025-06-02T10:00:00.000Z"
};

export const mockAuthApi = {
  login: async (phone, password) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (phone === '+22233445566' && password === 'admin') {
      return {
        success: true,
        data: {
          user: MOCK_ADMIN,
          token: "mock-jwt-token-admin"
        }
      };
    }
    
    if (phone === '+22211223344' && password === 'employe') {
      return {
        success: true,
        data: {
          user: MOCK_EMPLOYEE,
          token: "mock-jwt-token-employee"
        }
      };
    }
    
    throw {
      code: "UNAUTHORIZED",
      message: "Numéro ou mot de passe incorrect."
    };
  },
  
  getMe: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      data: MOCK_ADMIN
    };
  }
};
