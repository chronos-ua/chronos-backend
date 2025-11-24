import { betterAuth } from "better-auth";
import sqlite from "node:sqlite";

// TODO: Redis?
// import Redis from "ioredis";
// const redis = new Redis();

export const auth = betterAuth({
  database: new sqlite.DatabaseSync("auth.sqlite"),
  emailAndPassword: {
    enabled: false
  },
  session: {
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
  }
});
