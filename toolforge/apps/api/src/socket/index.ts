import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { authService } from '../services/index.js';
import { config } from '../config/index.js';

let io: Server | null = null;

export function setupSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
    path: '/socket.io',
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const user = await authService.getUserFromToken(token);
      if (!user) {
        return next(new Error('Invalid token'));
      }

      // Attach user to socket
      (socket as Socket & { user: typeof user }).user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as Socket & { user: { _id: { toString: () => string }; email: string } }).user;
    console.log(`User connected: ${user.email}`);

    // Join user's personal room
    socket.join(`user:${user._id.toString()}`);

    // Subscribe to tool updates
    socket.on('subscribe:tool', (toolId: string) => {
      socket.join(`tool:${toolId}`);
      console.log(`User ${user.email} subscribed to tool: ${toolId}`);
    });

    // Unsubscribe from tool updates
    socket.on('unsubscribe:tool', (toolId: string) => {
      socket.leave(`tool:${toolId}`);
      console.log(`User ${user.email} unsubscribed from tool: ${toolId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email}`);
    });
  });

  return io;
}

export function getSocketServer(): Server | null {
  return io;
}

export function emitToTool(toolId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`tool:${toolId}`).emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}
