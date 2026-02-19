import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { initializeSocket } from '../config/socket.js';
import { registerPresenceHandlers } from './handlers/presence.handler.js';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = initializeSocket(httpServer);

  io.on('connection', (socket) => {
    registerPresenceHandlers(io!, socket);
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
