import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import { Team } from '@prisma/client';

const router = express.Router();

// Validation schemas
const createMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  channelId: z.string(),
  threadId: z.string().optional()
});

const addReactionSchema = z.object({
  emoji: z.string().min(1).max(10)
});

// Get messages for a channel
router.get('/channel/:channelId', async (req: AuthenticatedRequest, res) => {
  try {
    const { channelId } = req.params;
    const { page = '1', limit = '50' } = req.query;
    const user = req.user!;

    // Verify user has access to this channel
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        team: user.team as Team
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        threadId: null // Only get top-level messages
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a thread
router.get('/thread/:threadId', async (req: AuthenticatedRequest, res) => {
  try {
    const { threadId } = req.params;
    const user = req.user!;

    // Verify user has access to this thread's channel
    const thread = await prisma.thread.findFirst({
      where: { id: threadId },
      include: {
        channel: true
      }
    });

    if (!thread || thread.channel.team !== (user.team as Team)) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const messages = await prisma.message.findMany({
      where: { threadId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ messages });
  } catch (error) {
    console.error('Get thread messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new message
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { content, channelId, threadId } = createMessageSchema.parse(req.body);
    const user = req.user!;

    // Verify user has access to this channel
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        team: user.team as Team
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // If threadId is provided, verify it exists and belongs to the channel
    if (threadId) {
      const thread = await prisma.thread.findFirst({
        where: {
          id: threadId,
          channelId
        }
      });

      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        userId: user.id,
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

    res.status(201).json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add reaction to message
router.post('/:messageId/reactions', async (req: AuthenticatedRequest, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = addReactionSchema.parse(req.body);
    const user = req.user!;

    // Verify message exists and user has access
    const message = await prisma.message.findFirst({
      where: { id: messageId },
      include: {
        channel: true
      }
    });

    if (!message || message.channel.team !== user.team) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userId_messageId_emoji: {
          userId: user.id,
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
      res.json({ message: 'Reaction removed' });
    } else {
      // Add new reaction
      const reaction = await prisma.reaction.create({
        data: {
          emoji,
          userId: user.id,
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
      res.status(201).json({ reaction });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new thread from message
router.post('/:messageId/thread', async (req: AuthenticatedRequest, res) => {
  try {
    const { messageId } = req.params;
    const { title } = req.body;
    const user = req.user!;

    // Verify message exists and user has access
    const message = await prisma.message.findFirst({
      where: { id: messageId },
      include: {
        channel: true,
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (!message || message.channel.team !== user.team) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Create thread
    const thread = await prisma.thread.create({
      data: {
        title: title || `Thread from ${message.user.username}`,
        channelId: message.channelId
      }
    });

    // Move the original message to the thread
    await prisma.message.update({
      where: { id: messageId },
      data: { threadId: thread.id }
    });

    res.status(201).json({ thread });
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;