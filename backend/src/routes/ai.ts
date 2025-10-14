import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import { Team } from '@prisma/client';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const router = express.Router();

// Initialize Redis connection for BullMQ
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize AI summary queue
const aiSummaryQueue = new Queue('ai-summary', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
  }
});

// Validation schemas
const summarizeThreadSchema = z.object({
  threadId: z.string()
});

// Get AI summary for a thread
router.get('/summary/:threadId', async (req: AuthenticatedRequest, res) => {
  try {
    const { threadId } = req.params;
    const user = req.user!;

    // Verify user has access to this thread
    const thread = await prisma.thread.findFirst({
      where: { id: threadId },
      include: {
        channel: true,
        summaries: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!thread || thread.channel.team !== (user.team as Team)) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const latestSummary = thread.summaries[0];
    
    if (!latestSummary) {
      return res.status(404).json({ error: 'No summary available for this thread' });
    }

    res.json({ summary: latestSummary });
  } catch (error) {
    console.error('Get AI summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate AI summary for a thread
router.post('/summarize', async (req: AuthenticatedRequest, res) => {
  try {
    const { threadId } = summarizeThreadSchema.parse(req.body);
    const user = req.user!;

    // Verify user has access to this thread
    const thread = await prisma.thread.findFirst({
      where: { id: threadId },
      include: {
        channel: true,
        messages: {
          include: {
            user: {
              select: {
                username: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!thread || thread.channel.team !== (user.team as Team)) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    if (thread.messages.length === 0) {
      return res.status(400).json({ error: 'Cannot summarize empty thread' });
    }

    // Add job to queue for background processing
    const job = await aiSummaryQueue.add('generate-summary', {
      threadId,
      messages: thread.messages,
      channelName: thread.channel.name,
      teamName: thread.channel.team
    });

    res.json({ 
      message: 'Summary generation started',
      jobId: job.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Generate AI summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job status
router.get('/job/:jobId', async (req: AuthenticatedRequest, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await aiSummaryQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    
    res.json({
      id: job.id,
      state,
      progress: job.progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason
    });
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all summaries for a thread
router.get('/summaries/:threadId', async (req: AuthenticatedRequest, res) => {
  try {
    const { threadId } = req.params;
    const user = req.user!;

    // Verify user has access to this thread
    const thread = await prisma.thread.findFirst({
      where: { id: threadId },
      include: {
        channel: true
      }
    });

    if (!thread || thread.channel.team !== (user.team as Team)) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const summaries = await prisma.aiSummary.findMany({
      where: { threadId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ summaries });
  } catch (error) {
    console.error('Get summaries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
