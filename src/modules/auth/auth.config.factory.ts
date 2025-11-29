import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import Redis from "ioredis";
import { EmailService } from "../../common/services/email.service";

export function createAuth(db: any, redis: Redis, emailService: EmailService) {
  return betterAuth({
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    database: mongodbAdapter(db),
    // Use Redis as secondary storage for things like session cookies, rate limiting, etc.
    secondaryStorage: {
      get: async (key) => await redis.get(key),
      set: async (key, value, ttl) => {
        if (ttl) await redis.set(key, JSON.stringify(value), "EX", ttl);
        else await redis.set(key, JSON.stringify(value));
      },
      delete: async (key) => void (await redis.del(key))
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url, token }, request) => {
        if (user?.email && token) {
          await emailService.sendPasswordResetEmail(user.email, url, token);
        }
      },
      onPasswordReset: async ({ user }, request) => {
        if (process.env.NODE_ENV !== "production") {
          console.log(`Password reset for user ${user?.email}`);
        } else {
          throw new Error("onPasswordReset not implemented");
        }
      }
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url, token }) => {
        if (user?.email && token) {
          await emailService.sendEmailVerification(user.email, url, token);
        }
      }
    },
    session: {
      expiresIn: Number(process.env.SESSION_TTL) || 60 * 60 * 24 * 14, // 14 days
      cookieCache: {
        enabled: true,
        maxAge: 60 * 15, // 15 minutes,
        strategy: "compact"
      }
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
      }
    },
    // Speed up relational queries
    // https://www.better-auth.com/docs/adapters/sqlite#joins-experimental
    experimental: {
      joins: true
    },
    account: {
      accountLinking: {
        enabled: true
      }
    }
  });
}
