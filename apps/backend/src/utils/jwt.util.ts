import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { JwtPayload, UserRole } from "../types";

const ACCESS_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export const accessTokenExpiresAt = (): Date =>
  new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);

export const refreshTokenExpiresAt = (): Date =>
  new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

export const generateAccessToken = (userId: string, role: UserRole): string =>
  jwt.sign({ role }, env.jwtSecret(), {
    subject: userId,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS
  });

export const generateRefreshToken = (
  userId: string,
  role: UserRole
): { token: string; jti: string; expiresAt: Date } => {
  const jti = crypto.randomUUID();
  const expiresAt = refreshTokenExpiresAt();
  const token = jwt.sign({ role }, env.jwtRefreshSecret(), {
    subject: userId,
    jwtid: jti,
    expiresIn: REFRESH_TOKEN_TTL_SECONDS
  });

  return { token, jti, expiresAt };
};

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, env.jwtSecret()) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, env.jwtRefreshSecret()) as JwtPayload;

export const decodeToken = (token: string): JwtPayload | null =>
  jwt.decode(token) as JwtPayload | null;
