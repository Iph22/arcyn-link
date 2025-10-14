import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient, Team } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    username: string;
    team: string;
  };
}

export const setupSocketHandlers = (io: Server, prisma: PrismaClient) => {
  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          team: true
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.username} connected`);

    // Join user to their team room
    if (socket.user) {
      socket.join(`team:${socket.user.team}`);
      
      // Notify team members that user is online
      socket.to(`team:${socket.user.team}`).emit('user:online', {
        userId: socket.user.id,
        username: socket.user.username
      });
    }

    // Join channel
    socket.on('channel:join', async (channelId: string) => {
      try {
        if (!socket.user) return;

        // Verify user has access to this channel
        const channel = await prisma.channel.findFirst({
          where: {
            id: channelId,
            team: socket.user.team as Team
          }
        });

        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        socket.join(`channel:${channelId}`);
        socket.emit('channel:joined', { channelId });
        
        console.log(`User ${socket.user.username} joined channel ${channel.name}`);
      } catch (error) {
        console.error('Channel join error:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // Leave channel
    socket.on('channel:leave', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      socket.emit('channel:left', { channelId });
    });

    // Send message
    socket.on('message:send', async (data: {
      content: string;
      channelId: string;
      threadId?: string;
    }) => {
      try {
        if (!socket.user) return;

        const { content, channelId, threadId } = data;

        // Verify user has access to this channel
        const channel = await prisma.channel.findFirst({
          where: {
            id: channelId,
            team: socket.user.team as Team
          }
        });

        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            content,
            userId: socket.user.id,
            channelId,
            threadId
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            reactions: true
          }
        });

        // Update thread's updatedAt if this is a thread message
        if (threadId) {
          await prisma.thread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() }
          });
        }

        // Emit to all users in the channel
        io.to(`channel:${channelId}`).emit('message:new', message);
        
        console.log(`Message sent by ${socket.user.username} in channel ${channel.name}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Add reaction
    socket.on('reaction:add', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        if (!socket.user) return;

        const { messageId, emoji } = data;

        // Verify message exists and user has access
        const message = await prisma.message.findFirst({
          where: { id: messageId },
          include: {
            channel: true
          }
        });

        if (!message || message.channel.team !== (socket.user.team as Team)) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user already reacted with this emoji
        const existingReaction = await prisma.reaction.findUnique({
          where: {
            userId_messageId_emoji: {
              userId: socket.user.id,
              messageId,
              emoji
            }
          }
        });

        if (existingReaction) {
          // Remove reaction if it exists
          await prisma.reaction.delete({
            where: { id: existingReaction.id }
          });

          io.to(`channel:${message.channelId}`).emit('reaction:removed', {
            messageId,
            emoji,
            userId: socket.user.id
          });
        } else {
          // Add new reaction
          const reaction = await prisma.reaction.create({
            data: {
              emoji,
              userId: socket.user.id,
              messageId
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          });

          io.to(`channel:${message.channelId}`).emit('reaction:added', reaction);
        }
      } catch (error) {
        console.error('Add reaction error:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    // Typing indicators
    socket.on('typing:start', (data: { channelId: string }) => {
      if (!socket.user) return;
      
      socket.to(`channel:${data.channelId}`).emit('typing:start', {
        userId: socket.user.id,
        username: socket.user.username,
        channelId: data.channelId
      });
    });

    socket.on('typing:stop', (data: { channelId: string }) => {
      if (!socket.user) return;
      
      socket.to(`channel:${data.channelId}`).emit('typing:stop', {
        userId: socket.user.id,
        channelId: data.channelId
      });
    });

    // AI summary completed
    socket.on('ai:summary:completed', (data: {
      threadId: string;
      summary: any;
    }) => {
      // Emit to all users in the thread's channel
      socket.broadcast.emit('ai:summary:new', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.username} disconnected`);
      
      if (socket.user) {
        // Notify team members that user is offline
        socket.to(`team:${socket.user.team}`).emit('user:offline', {
          userId: socket.user.id,
          username: socket.user.username
        });
      }
    });
  });
};
