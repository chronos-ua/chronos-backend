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
import { EmailModule } from "./common/email/email.module";
import { EmailService } from "./common/email/email.service";
import { RequestsLogMiddleware } from "./common/middlewares/requests-log.middleware";
import { EventModule } from "./modules/events/event.module";
import { CalendarService } from "./modules/calendar/calendar.service";
import { ChatModule } from "./modules/chat/chat.module";
import { AiModule } from "./common/ai/ai.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { DEV } from "./common/consts/env";
import { HolidaysModule } from "./modules/holidays/holidays.module";

@Module({
  imports: [
    MongooseModule.forRoot("mongodb://localhost/nest", {}),
    AuthModule.forRootAsync({
      imports: [MongooseModule, RedisModule, EmailModule, CalendarModule],
      inject: [
        getConnectionToken(),
        IOREDIS_CLIENT,
        EmailService,
        CalendarService
      ],
      useFactory: (
        connection: Connection,
        redis: Redis,
        emailService: EmailService,
        calendarService: CalendarService
      ) => {
        if (!connection.db) {
          throw new Error("Database connection is not established");
        }

        return {
          auth: createAuth(connection.db, redis, emailService, calendarService),
          disableBodyParser: true
        };
      }
    }),
    WeatherModule,
    RedisModule,
    EmailModule,
    CalendarModule,
    UsersModule,
    EventModule,
    ChatModule,
    AiModule,
    NotificationModule,
    HolidaysModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  private readonly logger = new Logger(AppModule.name);

  configure(consumer: MiddlewareConsumer) {
    if (!DEV) return;
    this.logger.log("RequestsLogMiddleware enabled");
    consumer.apply(RequestsLogMiddleware).forRoutes("*");
  }
}
