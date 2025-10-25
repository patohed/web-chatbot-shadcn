import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiter: 10 requests por minuto por IP
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000') / 1000,
});

export async function checkRateLimit(identifier: string): Promise<boolean> {
  try {
    await rateLimiter.consume(identifier);
    return true;
  } catch {
    return false;
  }
}

export async function getRateLimitInfo(identifier: string) {
  try {
    const res = await rateLimiter.get(identifier);
    return {
      remainingPoints: res ? res.remainingPoints : 10,
      msBeforeNext: res ? res.msBeforeNext : 0,
    };
  } catch {
    return { remainingPoints: 10, msBeforeNext: 0 };
  }
}
