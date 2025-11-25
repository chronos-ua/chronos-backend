import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./modules/auth/auth.instance";
import { WeatherModule } from "./modules/weather/weather.module";
import { RedisModule } from "./common/redis/redis.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forRoot("mongodb://localhost/nest", {}),
    AuthModule.forRoot({ auth }),
    WeatherModule,
    RedisModule,
    CalendarModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
