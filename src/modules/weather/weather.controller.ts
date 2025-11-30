import { Controller, Get, Param, Req } from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { AllowAnonymous, Session } from "@thallesp/nestjs-better-auth";
import { DevOnly } from "src/common/decorators/devOnly.decorator";
import { type Request } from "express";
import type { IUserSession } from "../auth/auth.interfaces";

// TODO: geocoding
// https://developers.google.com/maps/documentation/geocoding/overview
@Controller("weather")
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get(":city")
  @DevOnly(AllowAnonymous())
  getWeather(@Param("city") city: string) {
    return this.weatherService.getWeather(city);
  }

  @Get()
  @DevOnly(AllowAnonymous())
  getWeatherRoot(@Req() req: Request, @Session() session: IUserSession | null) {
    const city = session?.user?.city;
    let ip = req.ip;
    if (["127.0.0.1", "::1", "localhost"].includes(ip!)) {
      ip = undefined;
    }
    return this.weatherService.getWeather(city ?? ip ?? "Kyiv");
  }
}
