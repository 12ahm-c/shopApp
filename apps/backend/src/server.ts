import { createServer } from "http";
import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { setupSocket } from "./socket/socket.server";
import { startScheduler } from "./jobs/scheduler";
import { log } from "./utils/logger";

const start = async (): Promise<void> => {
  await connectDatabase();
  const app = createApp();
  const httpServer = createServer(app);

  setupSocket(httpServer);
  startScheduler();

  httpServer.listen(env.port, () => {
    log("info", "Backend API listening", { port: env.port });
  });
};

start().catch((error) => {
  log("error", "Backend startup failed", { message: error.message });
  process.exit(1);
});
