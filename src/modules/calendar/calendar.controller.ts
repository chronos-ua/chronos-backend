import type { IUserSession } from "./../auth/auth.interfaces.d";
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete
} from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { CreateCalendarDto } from "./dto/create-calendar.dto";
import { UpdateCalendarDto } from "./dto/update-calendar.dto";
import { Session } from "@thallesp/nestjs-better-auth";

@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  async create(
    @Session() session: IUserSession,
    @Body() createCalendarDto: CreateCalendarDto
  ) {
    return await this.calendarService.create(
      session.user.id,
      createCalendarDto
    );
  }

  @Get()
  findAll() {
    return this.calendarService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.calendarService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateCalendarDto: UpdateCalendarDto
  ) {
    return this.calendarService.update(+id, updateCalendarDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.calendarService.remove(+id);
  }
}
