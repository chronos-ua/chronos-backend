import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./modules/auth/auth.instance";
import { WeatherModule } from "./modules/weather/weather.module";
import { RedisModule } from "./common/redis/redis.module";

@Module({
  imports: [AuthModule.forRoot({ auth }), WeatherModule, RedisModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
