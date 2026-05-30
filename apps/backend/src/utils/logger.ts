type LogLevel = "info" | "warn" | "error";

export const log = (level: LogLevel, message: string, meta: Record<string, unknown> = {}): void => {
  const safeMeta = { ...meta };
  delete safeMeta.password;
  delete safeMeta.token;
  delete safeMeta.refreshToken;
  delete safeMeta.accessToken;

  console.log(
    JSON.stringify({
      level,
      message,
      ...safeMeta,
      timestamp: new Date().toISOString()
    })
  );
};
