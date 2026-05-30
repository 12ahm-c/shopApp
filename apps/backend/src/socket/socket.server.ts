import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.util";
import { log } from "../utils/logger";

export let io: Server;

export const setupSocket = (httpServer: HTTPServer): void => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      next(new Error("AUTH_REQUIRED"));
      return;
    }

    try {
      const payload = verifyAccessToken(token as string);
      (socket as any).user = { userId: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error("TOKEN_INVALID"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    socket.join(`user:${user.userId}`);
    if (user.role === "admin") {
      socket.join("admin");
    }
    log("info", "Socket connected", { userId: user.userId, role: user.role });

    socket.on("disconnect", () => {
      log("info", "Socket disconnected", { userId: user.userId });
    });
  });

  log("info", "Socket.IO initialized");
};
