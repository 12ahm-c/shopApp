import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

export const hashRefreshToken = (token: string): Promise<string> =>
  bcrypt.hash(token, SALT_ROUNDS);

export const compareRefreshToken = (token: string, hash: string): Promise<boolean> =>
  bcrypt.compare(token, hash);
