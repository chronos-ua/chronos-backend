import { Controller, Get, Param } from "@nestjs/common";
import { WeatherService } from "./weather.service";

// TODO: geocoding
// https://developers.google.com/maps/documentation/geocoding/overview
@Controller("weather")
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get(":city")
  getWeather(@Param("city") city: string) {
    return this.weatherService.getWeather(city);
  }
}
