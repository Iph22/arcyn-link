import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import { Team } from '@prisma/client';

const router = express.Router();

// Validation schemas
const createChannelSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false)
});

// Get channels for user's team
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    
    const channels = await prisma.channel.findMany({
      where: { team: user.team as Team },
      include: {
        _count: {
          select: {
            messages: true,
            channelUsers: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ channels });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific channel with messages
router.get('/:channelId', async (req: AuthenticatedRequest, res) => {
  try {
    const { channelId } = req.params;
    const user = req.user!;

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        team: user.team as Team
      },
      include: {
        messages: {
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
          orderBy: { createdAt: 'asc' },
          take: 50 // Limit to last 50 messages
        },
        threads: {
          include: {
            messages: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            },
            summaries: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ channel });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new channel
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, isPrivate } = createChannelSchema.parse(req.body);
    const user = req.user!;

    // Check if channel name already exists in team
    const existingChannel = await prisma.channel.findFirst({
      where: {
        name,
        team: user.team as Team
      }
    });

    if (existingChannel) {
      return res.status(400).json({ error: 'Channel name already exists' });
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        description,
        isPrivate,
        team: user.team as Team
      }
    });

    // Auto-join the creator to the channel
    await prisma.channelUser.create({
      data: {
        userId: user.id,
        channelId: channel.id
      }
    });

    res.status(201).json({ channel });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join channel
router.post('/:channelId/join', async (req: AuthenticatedRequest, res) => {
  try {
    const { channelId } = req.params;
    const user = req.user!;

    // Check if channel exists and belongs to user's team
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        team: user.team as Team
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Check if user is already in channel
    const existingMembership = await prisma.channelUser.findUnique({
      where: {
        userId_channelId: {
          userId: user.id,
          channelId
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'Already a member of this channel' });
    }

    await prisma.channelUser.create({
      data: {
        userId: user.id,
        channelId
      }
    });

    res.json({ message: 'Successfully joined channel' });
  } catch (error) {
    console.error('Join channel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave channel
router.post('/:channelId/leave', async (req: AuthenticatedRequest, res) => {
  try {
    const { channelId } = req.params;
    const user = req.user!;

    await prisma.channelUser.deleteMany({
      where: {
        userId: user.id,
        channelId
      }
    });

    res.json({ message: 'Successfully left channel' });
  } catch (error) {
    console.error('Leave channel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
