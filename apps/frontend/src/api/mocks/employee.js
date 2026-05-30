// Contract-matching mock data for docs/API-Contract.md section 9.
let mockEmployees = [
  {
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
  },
  {
    _id: "60d5ecb8b392d20000000002",
    name: "Employee User",
    phone: "11223344",
    role: "employee",
    salary: 10000,
    attendance: [
      { date: "2025-06-16T00:00:00.000Z", status: "present" },
      { date: "2025-06-15T00:00:00.000Z", status: "absent" }
    ],
    createdAt: "2025-06-02T10:00:00.000Z",
    lastActiveAt: "2025-06-16T09:15:00.000Z"
  },
  {
    _id: "60d5ecb8b392d20000000003",
    name: "Cashier User",
    phone: "55667788",
    role: "employee",
    salary: 12000,
    attendance: [
      { date: "2025-06-16T00:00:00.000Z", status: "absent" }
    ],
    createdAt: "2025-06-03T10:00:00.000Z",
    lastActiveAt: "2025-06-15T18:05:00.000Z"
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createEnvelope = (data, meta = null) => ({
  success: true,
  data,
  error: null,
  meta
});

const createMockId = () => {
  const suffix = (mockEmployees.length + 1).toString(16).padStart(2, '0');
  return `60d5ecb8b392d200000000${suffix}`;
};

const normalizeEmployee = (data) => ({
  name: data.name,
  phone: data.phone,
  role: "employee",
  salary: Number(data.salary || 0),
  attendance: data.attendance ?? [],
  createdAt: data.createdAt,
  lastActiveAt: data.lastActiveAt
});

export const mockEmployeeApi = {
  getEmployees: async (params = {}) => {
    await delay(300);
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 20);
    const query = (params.search || '').trim().toLowerCase();
    const filteredEmployees = query
      ? mockEmployees.filter((employee) =>
          employee.name.toLowerCase().includes(query) ||
          employee.phone.includes(query)
        )
      : mockEmployees;

    return createEnvelope(filteredEmployees, {
      page,
      limit,
      total: filteredEmployees.length
    });
  },

  getEmployeeById: async (id) => {
    await delay(250);
    const employee = mockEmployees.find((item) => item._id === id);
    if (!employee) {
      return {
        success: false,
        data: null,
        error: { code: "NOT_FOUND", message: "Employee not found", fields: {} },
        meta: null
      };
    }
    return createEnvelope(employee);
  },
  
  createEmployee: async (data) => {
    await delay(400);
    const newEmployee = {
      _id: createMockId(),
      ...normalizeEmployee(data),
      createdAt: new Date().toISOString()
    };
    mockEmployees.push(newEmployee);
    return createEnvelope(newEmployee);
  },

  updateEmployee: async (id, data) => {
    await delay(400);
    const employee = mockEmployees.find((item) => item._id === id);
    if (!employee) {
      return {
        success: false,
        data: null,
        error: { code: "NOT_FOUND", message: "Employee not found", fields: {} },
        meta: null
      };
    }

    const updatedEmployee = {
      ...employee,
      ...(data.name ? { name: data.name } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
      ...(data.salary !== undefined ? { salary: Number(data.salary || 0) } : {})
    };
    mockEmployees = mockEmployees.map((item) => item._id === id ? updatedEmployee : item);

    return createEnvelope(updatedEmployee);
  },

  updateAttendance: async (id, data) => {
    await delay(350);
    const employee = mockEmployees.find((item) => item._id === id);
    if (!employee) {
      return {
        success: false,
        data: null,
        error: { code: "NOT_FOUND", message: "Employee not found", fields: {} },
        meta: null
      };
    }

    const existingAttendance = employee.attendance.filter((item) => item.date !== data.date);
    const allAttendance = [
      { date: data.date, status: data.status },
      ...existingAttendance
    ];
    const updatedEmployee = { ...employee, attendance: allAttendance };
    mockEmployees = mockEmployees.map((item) => item._id === id ? updatedEmployee : item);

    return createEnvelope({
      userId: id,
      date: data.date,
      status: data.status,
      allAttendance
    });
  }
};
