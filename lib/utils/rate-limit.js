import { LRUCache } from 'lru-cache';

// ── Rate limiter factory ──────────────────────────────────────
export function rateLimit({ interval, uniqueTokenPerInterval = 500 }) {
  const tokenCache = new LRUCache({
    max: uniqueTokenPerInterval,
    ttl: interval,
  });

  return {
    check: (limit, token) =>
      new Promise((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) tokenCache.set(token, tokenCount);
        tokenCount[0] += 1;
        const currentUsage  = tokenCount[0];
        const isRateLimited = currentUsage > limit;
        return isRateLimited
          ? reject({ currentUsage, limit })
          : resolve({ currentUsage, limit });
      }),
  };
}

// ── Pre-configured limiters ───────────────────────────────────

// Auth routes — strict (5 per minute per IP)
export const authLimiter = rateLimit({
  interval:               60 * 1000,
  uniqueTokenPerInterval: 500,
});

// Admin API routes — moderate (60 per minute per user)
export const adminLimiter = rateLimit({
  interval:               60 * 1000,
  uniqueTokenPerInterval: 200,
});

// Member API routes — moderate (45 per minute per user)
export const memberLimiter = rateLimit({
  interval:               60 * 1000,
  uniqueTokenPerInterval: 500,
});

// Trainer API routes — moderate (45 per minute per user)
export const trainerLimiter = rateLimit({
  interval:               60 * 1000,
  uniqueTokenPerInterval: 200,
});

// Search — moderate (30 per minute per user)
export const searchLimiter = rateLimit({
  interval:               60 * 1000,
  uniqueTokenPerInterval: 200,
});

// Invite/email routes — strict (10 per hour per user)
export const inviteLimiter = rateLimit({
  interval:               60 * 60 * 1000,
  uniqueTokenPerInterval: 100,
});

// Public routes — lenient (100 per minute per IP)
export const publicLimiter = rateLimit({
  interval:               60 * 1000,
  uniqueTokenPerInterval: 1000,
});

// ── Helper — get client IP ────────────────────────────────────
export function getIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip        = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

// ── Helper — rate limit response ─────────────────────────────
export function rateLimitResponse(limit) {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status:  429,
      headers: {
        'Content-Type':      'application/json',
        'Retry-After':       '60',
        'X-RateLimit-Limit': String(limit),
      },
    }
  );
}
