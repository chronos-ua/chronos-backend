import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { createAuth } from "./modules/auth/auth.config.factory";
import { WeatherModule } from "./modules/weather/weather.module";
import { RedisModule } from "./common/redis/redis.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { MongooseModule, getConnectionToken } from "@nestjs/mongoose";
import { UsersModule } from "./modules/users/users.module";
import { Connection } from "mongoose";

@Module({
  imports: [
    MongooseModule.forRoot("mongodb://localhost/nest", {}),
    AuthModule.forRootAsync({
      imports: [MongooseModule],
      inject: [getConnectionToken()],
      useFactory: (connection: Connection) => {
        return { auth: createAuth(connection.db) };
      }
    }),
    WeatherModule,
    RedisModule,
    CalendarModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
