// Infrastructure Layer - Rate Limiting
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { RateLimitInfo } from '@/types/domain';
import { config } from '../config';

export class RateLimitService {
  private limiter: RateLimiterMemory;

  constructor() {
    this.limiter = new RateLimiterMemory({
      points: config.rateLimit.maxRequests,
      duration: config.rateLimit.windowMs / 1000,
    });
  }

  async checkLimit(identifier: string): Promise<RateLimitInfo> {
    try {
      const result = await this.limiter.consume(identifier);
      return {
        remainingPoints: result.remainingPoints,
        msBeforeNext: result.msBeforeNext,
        isAllowed: true,
      };
    } catch (error) {
      const rateLimitError = error as { msBeforeNext: number };
      return {
        remainingPoints: 0,
        msBeforeNext: rateLimitError.msBeforeNext || 60000,
        isAllowed: false,
      };
    }
  }

  async getRemainingPoints(identifier: string): Promise<number> {
    try {
      const res = await this.limiter.get(identifier);
      return res ? res.remainingPoints : config.rateLimit.maxRequests;
    } catch {
      return config.rateLimit.maxRequests;
    }
  }
}
