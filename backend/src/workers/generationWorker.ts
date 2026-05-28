import 'dotenv/config';
import { Worker } from 'bullmq';
import { connectDB } from '../config/db';
import { connectRedis, getRedis } from '../config/redis';
import { Assignment } from '../models/Assignment';
import { generateQuestionPaper } from '../services/llm';
import { cacheSet, paperCacheKey } from '../services/cache';
import { broadcastToAssignment } from '../websocket/wsManager';

async function startWorker() {
  await connectDB();
  await connectRedis();

  const worker = new Worker(
    'generation',
    async (job) => {
      const { assignmentId } = job.data as { assignmentId: string };
      console.log(`🔧 Processing job ${job.id} for assignment ${assignmentId}`);

      // Update status to processing
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });

      // Notify frontend
      broadcastToAssignment(assignmentId, {
        type: 'processing',
        assignmentId,
        message: 'Generating your question paper...',
      });

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

      // Generate question paper
      const paper = await generateQuestionPaper(assignment);

      // Save to DB
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'complete',
        result: paper,
      });

      // Cache the result
      await cacheSet(paperCacheKey(assignmentId), JSON.stringify(paper));

      // Notify frontend with result
      broadcastToAssignment(assignmentId, {
        type: 'complete',
        assignmentId,
        paper,
      });

      console.log(`✅ Job ${job.id} completed for assignment ${assignmentId}`);
      return paper;
    },
    {
      connection: getRedis(),
      concurrency: 3,
    }
  );

  worker.on('failed', async (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
    if (job?.data?.assignmentId) {
      await Assignment.findByIdAndUpdate(job.data.assignmentId, { status: 'failed' });
      broadcastToAssignment(job.data.assignmentId, {
        type: 'failed',
        assignmentId: job.data.assignmentId,
        message: 'Generation failed. Please try again.',
      });
    }
  });

  console.log('🔧 Generation worker started');
}

startWorker().catch(console.error);
