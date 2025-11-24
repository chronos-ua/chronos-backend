import { betterAuth } from "better-auth";
import sqlite from "node:sqlite";

// TODO: Redis?
// import Redis from "ioredis";
// const redis = new Redis();

export const auth = betterAuth({
  database: new sqlite.DatabaseSync("auth.sqlite")
});
