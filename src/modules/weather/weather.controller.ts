import { Controller, Get, Param } from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { DevOnly } from "src/common/decorators/devOnly.decorator";

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
}
