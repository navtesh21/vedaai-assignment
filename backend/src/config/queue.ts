import { Queue } from 'bullmq';
import { getRedis } from '../config/redis';

let generationQueue: Queue;

export function getGenerationQueue(): Queue {
  if (!generationQueue) {
    generationQueue = new Queue('generation', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return generationQueue;
}
