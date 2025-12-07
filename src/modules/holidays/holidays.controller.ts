import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete
} from "@nestjs/common";
import { HolidaysService } from "./holidays.service";

@Controller("holidays")
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  async getUserHolidays() {
    //
  }

  @Get(":year/:countryCode")
  async getHolidays(
    @Param("countryCode") countryCode: string,
    @Param("year") year: number
  ) {
    return await this.holidaysService.getHolidays(countryCode, year);
  }

  @Get("countries")
  async getAvailableCountries() {
    return await this.holidaysService.getAvailableCountries();
  }
}
