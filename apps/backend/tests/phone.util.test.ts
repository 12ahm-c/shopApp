import { isValidPhone, normalizePhone } from "../src/utils/phone.util";

describe("phone utilities", () => {
  it("normalizes local Mauritanian phone numbers to E.164", () => {
    expect(normalizePhone("36123456")).toBe("+22236123456");
  });

  it("accepts E.164 phone numbers", () => {
    expect(isValidPhone("+22236123456")).toBe(true);
  });

  it("rejects malformed phone numbers", () => {
    expect(isValidPhone("123")).toBe(false);
  });
});
