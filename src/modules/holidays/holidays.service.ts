import { Injectable } from "@nestjs/common";
import { EEventType, Event } from "../events/schemas/event.schema";

@Injectable()
export class HolidaysService {
  private readonly API_BASE_URL = "https://date.nager.at/api/v3/publicholidays";

  async getHolidays(countryCode: string, year?: number) {
    const targetYear = year || new Date().getFullYear();
    const response = await fetch(
      `${this.API_BASE_URL}/${targetYear}/${countryCode}`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch holidays for ${countryCode} in ${targetYear}`
      );
    }

    const res = await response.json();

    const holidays: Pick<
      Event,
      "title" | "start" | "end" | "isAllDay" | "type"
    >[] = Object.entries(res).map(([_, holiday]: [string, any]) => ({
      title: holiday.localName,
      start: new Date(holiday.date),
      end: new Date(holiday.date),
      isAllDay: true,
      type: EEventType.HOLIDAY
    }));

    return holidays;
  }

  async getAvailableCountries(): Promise<any[]> {
    const response = await fetch(
      "https://date.nager.at/api/v3/AvailableCountries"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch available countries for holidays");
    }
    return await response.json();
  }
}
