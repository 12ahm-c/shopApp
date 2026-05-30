import { io } from "./socket.server";

export const emitNotification = (userId: string, notification: Record<string, unknown>): void => {
  if (io) {
    io.to(`user:${userId}`).emit("notification:new", notification);
  }
};

export const emitStockAlert = (notification: Record<string, unknown>): void => {
  if (io) {
    io.to("admin").emit("stock:alert", notification);
  }
};
