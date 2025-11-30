import { Logger, MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { createAuth } from "./modules/auth/auth.config.factory";
import { WeatherModule } from "./modules/weather/weather.module";
import { IOREDIS_CLIENT, RedisModule } from "./common/redis/redis.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { MongooseModule, getConnectionToken } from "@nestjs/mongoose";
import { UsersModule } from "./modules/users/users.module";
import { Connection } from "mongoose";
import Redis from "ioredis";
import { EmailModule } from "./common/services/email.module";
import { EmailService } from "./common/services/email.service";
import { RequestsLogMiddleware } from "./common/middlewares/requests-log.middleware";

@Module({
  imports: [
    MongooseModule.forRoot("mongodb://localhost/nest", {}),
    AuthModule.forRootAsync({
      imports: [MongooseModule, RedisModule, EmailModule],
      inject: [getConnectionToken(), IOREDIS_CLIENT, EmailService],
      useFactory: (
        connection: Connection,
        redis: Redis,
        emailService: EmailService
      ) => {
        return {
          auth: createAuth(connection.db, redis, emailService),
          disableBodyParser: true
        };
      }
    }),
    WeatherModule,
    RedisModule,
    EmailModule,
    CalendarModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  private readonly logger = new Logger(AppModule.name);

  configure(consumer: MiddlewareConsumer) {
    if (process.env.NODE_ENV !== "production") {
      this.logger.log("RequestsLogMiddleware enabled");
      consumer.apply(RequestsLogMiddleware).forRoutes("*");
    }
  }
}
