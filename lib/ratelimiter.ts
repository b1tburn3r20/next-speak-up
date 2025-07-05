// lib/ratelimiter.ts
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

// Define rate limits for different endpoints and roles
export const RATE_LIMITS = {
  chatbot: {
    unauthenticated: { requests: 5, window: "1 d" }, // 3 per day for guests
    Member: { requests: 15, window: "1 d" }, // 10 per day
    Supporter: { requests: 70, window: "1 d" }, // 30 per day
    Admin: null, // Unlimited
    "Super Admin": null, // Unlimited
  },
  tts: {
    unauthenticated: { requests: 2, window: "1 h" }, // 2 per hour for guests
    Member: { requests: 5, window: "1 h" }, // 50 per hour
    Supporter: { requests: 30, window: "1 h" }, // 200 per hour
    Admin: null, // Unlimited
    "Super Admin": null, // Unlimited
  },
  general: {
    unauthenticated: { requests: 3, window: "10 s" },
    Member: { requests: 10, window: "10 s" },
    Supporter: { requests: 20, window: "10 s" },
    Admin: null, // Unlimited
    "Super Admin": null, // Unlimited
  },
} as const;

// Cache for rate limiter instances
const rateLimiterCache = new Map<string, Ratelimit>();

function createRateLimiter(requests: number, window: string): Ratelimit {
  const cacheKey = `${requests}-${window}`;

  if (!rateLimiterCache.has(cacheKey)) {
    rateLimiterCache.set(
      cacheKey,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, window as any),
        analytics: true,
        timeout: 10000,
      })
    );
  }

  return rateLimiterCache.get(cacheKey)!;
}

export type RateLimitEndpoint = keyof typeof RATE_LIMITS;
export type UserRole =
  | "unauthenticated"
  | "Member"
  | "Supporter"
  | "Admin"
  | "Super Admin";

export async function checkRateLimit(
  endpoint: RateLimitEndpoint,
  userRole: UserRole,
  identifier: string
): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  error?: string;
}> {
  const limits = RATE_LIMITS[endpoint];
  const roleLimit = limits[userRole];

  // If no limit defined (null), allow unlimited access
  if (roleLimit === null) {
    return { success: true };
  }

  // If role limit is undefined, deny access
  if (roleLimit === undefined) {
    return {
      success: false,
      error: `Access denied for role: ${userRole}`,
    };
  }

  const rateLimiter = createRateLimiter(roleLimit.requests, roleLimit.window);
  const result = await rateLimiter.limit(`${endpoint}:${identifier}`);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// Helper function to get user role from session
export function getUserRole(session: any): UserRole {
  if (!session?.user?.id) return "unauthenticated";

  const roleName = session.user.role?.name;
  switch (roleName) {
    case "Member":
      return "Member";
    case "Supporter":
      return "Supporter";
    case "Admin":
      return "Admin";
    case "Super Admin":
      return "Super Admin";
    default:
      return "Member"; // Default to member if role is unclear
  }
}
