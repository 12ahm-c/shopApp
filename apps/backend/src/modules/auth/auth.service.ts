import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";
import { User } from "../user/user.model";
import { AppError } from "../../utils/AppError";
import {
  accessTokenExpiresAt,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "../../utils/jwt.util";
import {
  compareRefreshToken,
  hashRefreshToken
} from "../../utils/password.util";
import { serializeUser } from "../../utils/serializer";
import { log } from "../../utils/logger";

const issueTokenPair = async (user: Awaited<ReturnType<typeof User.findOne>>) => {
  if (!user) {
    throw new AppError(401, "AUTH_REQUIRED", "Phone or password wrong");
  }

  const accessExpiresAt = accessTokenExpiresAt();
  const refresh = generateRefreshToken(user._id.toString(), user.role);
  const tokenHash = await hashRefreshToken(refresh.token);

  user.refreshTokens.push({
    tokenHash,
    jti: refresh.jti,
    expiresAt: refresh.expiresAt,
    createdAt: new Date()
  });
  user.lastActiveAt = new Date();
  await user.save();

  return {
    user: serializeUser(user, { includeEmployment: user.role === "employee" }),
    accessToken: generateAccessToken(user._id.toString(), user.role),
    refreshToken: refresh.token,
    accessTokenExpiresAt: accessExpiresAt.toISOString(),
    refreshTokenExpiresAt: refresh.expiresAt.toISOString()
  };
};

export const authService = {
  async login(phone: string, password: string) {
    const user = await User.findOne({ phone }).select("+passwordHash +refreshTokens");
    if (!user || !(await user.validatePassword(password))) {
      log("warn", "Login failed", { phone });
      throw new AppError(401, "AUTH_REQUIRED", "Phone or password wrong");
    }

    log("info", "Login succeeded", { userId: user._id.toString(), role: user.role });
    await mongoose.connection.collection("activity_logs").insertOne({
      userId: user._id,
      userName: user.name,
      action: "login",
      details: "Connexion",
      amount: null,
      timestamp: new Date()
    });
    return issueTokenPair(user);
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      const code = error instanceof jwt.TokenExpiredError ? "TOKEN_INVALID" : "TOKEN_INVALID";
      throw new AppError(401, code, "Refresh token revoked or expired");
    }

    const user = await User.findById(payload.sub).select("+refreshTokens");
    if (!user || !payload.jti) {
      throw new AppError(401, "TOKEN_INVALID", "Refresh token revoked or expired");
    }

    const storedToken = user.refreshTokens.find(
      (entry) => entry.jti === payload.jti && !entry.revokedAt && entry.expiresAt > new Date()
    );
    if (!storedToken || !(await compareRefreshToken(refreshToken, storedToken.tokenHash))) {
      throw new AppError(401, "TOKEN_INVALID", "Refresh token revoked or expired");
    }

    storedToken.revokedAt = new Date();
    log("info", "Refresh token rotated", { userId: user._id.toString() });
    return issueTokenPair(user);
  },

  async logout(userId: string) {
    await User.updateOne(
      { _id: userId },
      { $set: { "refreshTokens.$[token].revokedAt": new Date() } },
      { arrayFilters: [{ "token.revokedAt": { $exists: false } }] }
    );
    const user = await User.findById(userId).lean();
    await mongoose.connection.collection("activity_logs").insertOne({
      userId: new Types.ObjectId(userId),
      userName: user?.name ?? "Unknown",
      action: "logout",
      details: "Déconnexion",
      amount: null,
      timestamp: new Date()
    });
    log("info", "Logout succeeded", { userId });
  },

  async me(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User does not exist");
    }
    return serializeUser(user, { includeEmployment: user.role === "employee" });
  }
};
