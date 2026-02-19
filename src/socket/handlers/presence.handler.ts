import { Server, Socket } from 'socket.io';

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map<string, Set<string>>();

export const registerPresenceHandlers = (io: Server, socket: Socket) => {
  const user = socket.data.user;
  const userId = user.id;
  const socketId = socket.id;

  // Add socket to user's set
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
    // If first socket for this user, broadcast online status
    io.emit('user:online', { userId });
  }
  onlineUsers.get(userId)!.add(socketId);

  // getOnlineUsers event
  socket.on('getOnlineUsers', () => {
    socket.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      // If no more sockets for this user, broadcast offline status
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit('user:offline', { userId });
      }
    }
  });
};

export const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};
