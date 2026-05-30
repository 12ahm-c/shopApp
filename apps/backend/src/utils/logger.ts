import pino from "pino";
import { env } from "../config/env";

const pinoLogger = pino({
  level: env.nodeEnv === "production" ? "info" : "debug",
  redact: {
    paths: ["password", "token", "refreshToken", "accessToken", "authorization"],
    censor: "[REDACTED]"
  },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, requestId: req.requestId }),
    res: (res) => ({ statusCode: res.statusCode })
  },
  transport: env.nodeEnv !== "production"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined
});

type LogLevel = "info" | "warn" | "error" | "debug";

export const log = (level: LogLevel, message: string, meta: Record<string, unknown> = {}): void => {
  const safeMeta = { ...meta };
  delete safeMeta.password;
  delete safeMeta.token;
  delete safeMeta.refreshToken;
  delete safeMeta.accessToken;

  pinoLogger[level](safeMeta, message);
};

export const logger = pinoLogger;
