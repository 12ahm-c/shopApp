import { createEmployeeSchema } from "../src/modules/employee/employee.validation";
import { loginSchema } from "../src/modules/auth/auth.validation";

describe("validation schemas", () => {
  it("normalizes login phones", () => {
    const result = loginSchema.parse({ phone: "36123456", password: "secret1" });

    expect(result.phone).toBe("+22236123456");
  });

  it("requires employee role when creating employees", () => {
    expect(() =>
      createEmployeeSchema.parse({
        name: "Ahmed Sidi",
        phone: "+22236123456",
        password: "secret1",
        role: "admin"
      })
    ).toThrow();
  });
});
