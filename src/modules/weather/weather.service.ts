import { IOREDIS_CLIENT } from "./../../common/redis/redis.module";
import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { getOrSet } from "src/common/utils/cache.util";

@Injectable()
export class WeatherService {
  private readonly GLOBAL_CACHE_PREFIX = "weather:v1:";
  private readonly TTL_SECONDS = 1800; // 30m

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

  private async fetchFromProvider(city: string) {
    console.warn(
      "[WeatherService] fetchFromProvider is not implemented, returning mock data"
    );
    return { city, temp: 20, condition: "cloudy", timestamp: Date.now() };
  }
}
