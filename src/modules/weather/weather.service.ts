import { IOREDIS_CLIENT } from "./../../common/redis/redis.module";
import { Inject, Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { getOrSet } from "src/common/utils/cache.util";

@Injectable()
export class WeatherService {
  private readonly GLOBAL_CACHE_PREFIX = "weather:v1:";
  private readonly TTL_SECONDS = 3 * 60 * 60; // 3h
  private readonly logger = new Logger(WeatherService.name);

  constructor(@Inject(IOREDIS_CLIENT) private readonly redis: Redis) {}

  async getWeather(city: string) {
    return await getOrSet(
      this.redis,
      // weather:v1:<day of week>:<city>
      `${this.GLOBAL_CACHE_PREFIX}${new Date().getDay()}:${city.toLowerCase()}`,
      this.TTL_SECONDS,
      () => this.fetchFromProvider(city)
    );
  }

  private async fetchFromProvider(query: string) {
    if (!process.env.WEATHER_API_KEY) {
      this.logger.warn("WEATHER_API_KEY is not set");
      return { query, data: null };
    }

    const data = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?q=${query}&days=3&aqi=no&key=${process.env.WEATHER_API_KEY}`
    );
    return { query, data: await data.json() };
  }
}
