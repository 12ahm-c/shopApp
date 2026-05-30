import {
  accessTokenExpiresAt,
  generateAccessToken,
  generateRefreshToken,
  refreshTokenExpiresAt,
  verifyAccessToken,
  verifyRefreshToken
} from "../src/utils/jwt.util";

describe("jwt utilities", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  });

  it("generates verifiable access tokens with the user role", () => {
    const token = generateAccessToken("65f2a1b3c4d5e6f7a8b9c0d1", "admin");
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe("65f2a1b3c4d5e6f7a8b9c0d1");
    expect(payload.role).toBe("admin");
  });

  it("generates verifiable refresh tokens with a jti", () => {
    const refresh = generateRefreshToken("65f2a1b3c4d5e6f7a8b9c0d1", "employee");
    const payload = verifyRefreshToken(refresh.token);

    expect(payload.sub).toBe("65f2a1b3c4d5e6f7a8b9c0d1");
    expect(payload.role).toBe("employee");
    expect(payload.jti).toBe(refresh.jti);
  });

  it("uses 24 hour access and 7 day refresh expirations", () => {
    const accessDelta = accessTokenExpiresAt().getTime() - Date.now();
    const refreshDelta = refreshTokenExpiresAt().getTime() - Date.now();

    expect(accessDelta).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(accessDelta).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
    expect(refreshDelta).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
    expect(refreshDelta).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000 + 1000);
  });
});
