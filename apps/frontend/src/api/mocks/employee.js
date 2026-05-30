// src/api/mocks/employee.js

let mockEmployees = [
  {
    _id: "60d5ecb8b392d20000000001",
    name: "Admin User",
    phone: "+22233445566",
    role: "admin",
    salary: 0,
    createdAt: "2025-06-01T10:00:00.000Z"
  },
  {
    _id: "60d5ecb8b392d20000000002",
    name: "Employee User",
    phone: "+22211223344",
    role: "employee",
    salary: 10000,
    createdAt: "2025-06-02T10:00:00.000Z"
  }
];

export const mockEmployeeApi = {
  getEmployees: async (page = 1, limit = 10) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      data: mockEmployees,
      meta: {
        total: mockEmployees.length,
        page,
        limit
      }
    };
  },
  
  createEmployee: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newEmployee = {
      _id: "60d5ecb8b392d2000000000" + (mockEmployees.length + 1),
      ...data,
      createdAt: new Date().toISOString()
    };
    mockEmployees.push(newEmployee);
    return {
      success: true,
      data: newEmployee
    };
  }
};
