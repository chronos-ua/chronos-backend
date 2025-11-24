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
  // Speed up relational queries
  // https://www.better-auth.com/docs/adapters/sqlite#joins-experimental
  experimental: {
    joins: true
  }
});
