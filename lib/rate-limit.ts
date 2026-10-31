import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory token store for rate limiting with bounded capacity
const MAX_STORE_SIZE = 10000;
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Prunes expired and excess entries from the store to prevent memory leakage.
 */
function pruneRateLimitStore(now: number = Date.now()): void {
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  // If store still exceeds MAX_STORE_SIZE under extreme loads, evict oldest entries
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const excess = rateLimitStore.size - MAX_STORE_SIZE;
    let evicted = 0;
    for (const key of rateLimitStore.keys()) {
      rateLimitStore.delete(key);
      evicted++;
      if (evicted >= excess) break;
    }
  }
}

// Clean up expired records periodically (every 5 minutes) to conserve system memory
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    pruneRateLimitStore();
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window (default: 60) */
  maxRequests?: number;
  /** Window size in seconds (default: 60 seconds) */
  windowSeconds?: number;
  /** Custom key prefix to differentiate endpoint rate buckets */
  bucketPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  response?: NextResponse;
}

/**
 * Extracts a client IP from Next.js request headers.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Applies sliding-window rate limiting to an incoming HTTP request.
 * Returns { allowed: true } or a 429 Too Many Requests response if limit is exceeded.
 */
export function checkRateLimit(
  request: Request,
  options: RateLimitOptions = {}
): RateLimitResult {
  const {
    maxRequests = 60,
    windowSeconds = 60,
    bucketPrefix = "global",
  } = options;

  const clientIp = getClientIp(request);
  const key = `${bucketPrefix}:${clientIp}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    if (rateLimitStore.size >= MAX_STORE_SIZE) {
      pruneRateLimitStore(now);
    }

    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, record);

    return {
      allowed: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - 1),
      reset: Math.ceil(record.resetTime / 1000),
    };
  }

  record.count += 1;
  const remaining = Math.max(0, maxRequests - record.count);
  const resetSeconds = Math.ceil(record.resetTime / 1000);

  if (record.count > maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    const headers = new Headers({
      "Content-Type": "application/json",
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(resetSeconds),
      "Retry-After": String(retryAfter),
    });

    const response = new NextResponse(
      JSON.stringify({
        success: false,
        message: `Too many requests. Please slow down and try again in ${retryAfter} seconds.`,
      }),
      { status: 429, headers }
    );

    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      reset: resetSeconds,
      response,
    };
  }

  return {
    allowed: true,
    limit: maxRequests,
    remaining,
    reset: resetSeconds,
  };
}

