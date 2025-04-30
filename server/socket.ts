import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

export function setupSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a room for a particular order ID (room = orderId)
    socket.on("join_room", (orderId: string) => {
      socket.join(orderId);
      console.log(`Socket ${socket.id} joined room ${orderId}`);
    });

    // Listen for staff updates to order status
    socket.on("update_order_status", (data: { orderId: string; status: string }) => {
      const { orderId, status } = data;
      console.log(`Received status update for order ${orderId}: ${status}`);
      // Broadcast to clients in that room
      io.to(orderId).emit("order_status_update", { orderId, status });
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
} 