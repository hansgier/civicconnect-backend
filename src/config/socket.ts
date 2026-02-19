import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './env.js';
import { verifyAccessToken } from '../shared/utils/jwt.js';
import { UnauthorizedError } from '../shared/errors/errors.js';

export function initializeSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket, next) => {
    try {
      // Extract token from handshake auth or cookies
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.cookie
          ?.split('; ')
          .find((c) => c.startsWith('access_token='))
          ?.split('=')[1];

      if (!token) {
        return next(new UnauthorizedError('Authentication required'));
      }

      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  });

  return io;
}
