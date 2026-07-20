import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  clientName: process.env.CLIENT_NAME ?? "default",
  mongodbUri: () => getRequiredEnv("MONGODB_URI"),
  jwtSecret: () => getRequiredEnv("JWT_SECRET"),
  jwtRefreshSecret: () => getRequiredEnv("JWT_REFRESH_SECRET"),
  firebaseServiceAccountJson: (): Record<string, string> | null => {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw || raw === "{}") return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
};
