import { Controller, Get, Param, Req } from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { AllowAnonymous, Session } from "@thallesp/nestjs-better-auth";
import { DevOnly } from "src/common/decorators/devOnly.decorator";
import { type Request } from "express";
import type { IUserSession } from "../auth/auth.interfaces";
import { ApiOkResponse } from "@nestjs/swagger";

// TODO: geocoding
// https://developers.google.com/maps/documentation/geocoding/overview
@Controller("weather")
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get(":city")
  @DevOnly(AllowAnonymous())
  @ApiOkResponse({
    description: "Weather information for the specified city",
    type: Object
  })
  getWeather(@Param("city") city: string) {
    return this.weatherService.getWeather(city);
  }

  @Get()
  @DevOnly(AllowAnonymous())
  @ApiOkResponse({
    description: "Weather information for the user's city or by IP",
    type: Object
  })
  getWeatherRoot(@Req() req: Request, @Session() session: IUserSession | null) {
    const city = session?.user?.city;
    let ip = req.ip;
    if (["127.0.0.1", "::1", "localhost"].includes(ip!)) {
      ip = undefined;
    }
    return this.weatherService.getWeather(city ?? ip ?? "Kyiv");
  }
}
