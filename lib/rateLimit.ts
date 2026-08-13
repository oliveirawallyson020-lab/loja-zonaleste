import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

function getClientIdentifier(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const [first] = xff.split(",");
    if (first) return first.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  try {
    const url = new URL(request.url);
    return url.hostname;
  } catch {
    return "unknown";
  }
}

let redisClient: Redis | null = null;
const ratelimitByKey = new Map<string, Ratelimit>();

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

function getLimiter(
  keyPrefix: string,
  options: RateLimitOptions
): Ratelimit | null {
  const cacheKey = `${keyPrefix}:${options.windowMs}:${options.max}`;
  const cached = ratelimitByKey.get(cacheKey);
  if (cached) return cached;

  const client = getRedisClient();
  if (!client) return null;

  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.fixedWindow(options.max, `${options.windowMs} ms`)
  });

  ratelimitByKey.set(cacheKey, limiter);
  return limiter;
}

export async function isRateLimited(
  request: Request,
  options: RateLimitOptions,
  keyPrefix: string
): Promise<boolean> {
  const id = getClientIdentifier(request);
  const limiter = getLimiter(keyPrefix, options);

  if (!limiter) {
    // Se o Redis não estiver configurado, não aplicar rate limit distribuído.
    return false;
  }

  const result = await limiter.limit(id);
  return !result.success;
}


