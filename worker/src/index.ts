import { Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { generateAISummary } from './services/aiService';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();

// AI Summary Worker
const aiSummaryWorker = new Worker(
  'ai-summary',
  async (job) => {
    console.log(`Processing AI summary job ${job.id}`);
    
    try {
      const { threadId, messages, channelName, teamName } = job.data;
      
      // Update job progress
      await job.updateProgress(10);
      
      // Generate AI summary using Claude
      const summaryContent = await generateAISummary(messages, channelName, teamName);
      
      await job.updateProgress(80);
      
      // Save summary to database
      const summary = await prisma.aiSummary.create({
        data: {
          content: summaryContent,
          threadId
        }
      });
      
      await job.updateProgress(100);
      
      console.log(`AI summary generated for thread ${threadId}`);
      
      return {
        summaryId: summary.id,
        content: summaryContent,
        threadId
      };
    } catch (error) {
      console.error('AI summary generation failed:', error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3, // Process up to 3 jobs concurrently
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 5 },
  }
);

// Error handling
aiSummaryWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

aiSummaryWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

aiSummaryWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker gracefully...');
  await aiSummaryWorker.close();
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('🤖 AI Worker started and listening for jobs...');
