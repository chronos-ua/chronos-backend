import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";

export const IOREDIS_CLIENT = "IOREDIS_CLIENT_69";

@Global()
@Module({
  providers: [
    {
      provide: IOREDIS_CLIENT,
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT)
        });
      }
    }
  ],
  exports: [IOREDIS_CLIENT]
})
export class RedisModule {}
