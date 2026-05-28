import { getRedis } from '../config/redis';

const CACHE_TTL = 3600; // 1 hour

export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await getRedis().get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string): Promise<void> {
  try {
    await getRedis().set(key, value, 'EX', CACHE_TTL);
  } catch (err) {
    console.warn('Cache set failed:', err);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch (err) {
    console.warn('Cache del failed:', err);
  }
}

export function paperCacheKey(assignmentId: string): string {
  return `paper:${assignmentId}`;
}
