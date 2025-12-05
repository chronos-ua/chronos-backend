import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import Redis from "ioredis";
import { EmailService } from "../../common/services/email.service";
import { Logger } from "@nestjs/common";
import { magicLink, oneTap, openAPI, twoFactor } from "better-auth/plugins";
import { CalendarService } from "../calendar/calendar.service";

export function createAuth(
  db: Parameters<typeof mongodbAdapter>[0],
  redis: Redis,
  emailService: EmailService,
  calendarService: CalendarService
) {
  const logger = new Logger("Auth");

  return betterAuth({
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    database: mongodbAdapter(db),
    // Use Redis as secondary storage for things like session cookies, rate limiting, etc.
    secondaryStorage: {
      get: async (key) => {
        const value = await redis.get(key);
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch (e) {
          logger.error(`Failed to parse Redis value for key ${key}:`, e);
          return null;
        }
      },
      set: async (key, value, ttl) => {
        const serialized = JSON.stringify(value);
        if (ttl) await redis.set(key, serialized, "EX", ttl);
        else await redis.set(key, serialized);
      },
      delete: async (key) => void (await redis.del(key))
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url, token }, request) => {
        if (user?.email && token) {
          await emailService.sendPasswordResetEmail(user.email, url, token);
          if (process.env.NODE_ENV !== "production") {
            logger.log(`Sent password reset email to ${user.email} ${url}`);
          }
        } else {
          logger.warn(
            "Cannot send password reset email: missing user email or token"
          );
        }
      }
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        if (user?.email && token) {
          await emailService.sendEmailVerification(user.email, url, token);
          if (process.env.NODE_ENV !== "production") {
            logger.log(`Sent verification email to ${user.email} ${url}`);
          }
        } else {
          logger.warn(
            "Cannot send verification email: missing user email or token"
          );
        }
      },
      afterEmailVerification: async (user) => {
        if (process.env.NODE_ENV !== "production") {
          logger.log(`User ${user.id} has verified their email ${user.email}`);
        }
      }
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            // Create default calendar for a new user
            try {
              await calendarService.createDefault(user.id);
              if (process.env.NODE_ENV !== "production") {
                logger.log(`Created default calendar for new user ${user.id}`);
              }
            } catch (error) {
              logger.error(
                `Failed to create default calendar for user ${user.id}: ${error}`
              );
            }
          }
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
        clientId: process.env.SMTP_CLIENT_ID as string,
        clientSecret: process.env.SMTP_CLIENT_SECRET as string
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
    },
    advanced: {
      // TODO: why is this needed? investigate and fix
      disableCSRFCheck: true
    },
    plugins: [
      openAPI(),
      magicLink({
        sendMagicLink: async ({ email, token, url }, ctx) => {
          await emailService.sendMagicLink(email, url, token);
          if (process.env.NODE_ENV !== "production") {
            logger.log(`Sent magic link email to ${email} ${url}`);
          }
        }
      }),
      twoFactor({
        issuer: "Chronos App",
        otpOptions: {
          period: 5,
          sendOTP: async ({ user, otp }, ctx) => {
            await emailService.sendOTP(user.email, otp);
          }
        }
      }),
      oneTap()
    ]
  });
}
