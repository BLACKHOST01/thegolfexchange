import { NextResponse } from 'next/server';

const rateLimitMap = new Map();

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
};

export function rateLimit(
  handler: Function,
  config: RateLimitConfig = defaultConfig
) {
  return async (req: any, ...args: any[]) => {
    const identifier = req.user?.id || req.ip || 'anonymous';
    const currentTime = Date.now();
    const windowStart = currentTime - config.windowMs;

    // Clean up old entries
    const keysToDelete: string[] = [];
    rateLimitMap.forEach((value, key) => {
      if (value.timestamp < windowStart) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => rateLimitMap.delete(key));

    const record = rateLimitMap.get(identifier);

    if (!record) {
      // First request
      rateLimitMap.set(identifier, {
        count: 1,
        timestamp: currentTime,
      });
    } else {
      if (record.timestamp < windowStart) {
        // Reset counter for new window
        record.count = 1;
        record.timestamp = currentTime;
      } else if (record.count >= config.max) {
        // Rate limit exceeded
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Too many requests',
              code: 'RATE_LIMIT_EXCEEDED',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 429 }
        );
      } else {
        // Increment counter
        record.count++;
      }
    }

    return handler(req, ...args);
  };
}