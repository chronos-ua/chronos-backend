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

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.calendarService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateCalendarDto: UpdateCalendarDto,
    @Session() session: IUserSession
  ) {
    return this.calendarService.update(session.user.id, id, updateCalendarDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.calendarService.remove(+id);
  }

  @Post("transfer-ownership/:calendarId/:newOwnerId")
  async transferOwnership(
    @Param("calendarId") calendarId: string,
    @Param("newOwnerId") newOwnerId: string,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.transferOwnership(
      calendarId,
      newOwnerId,
      session.user.id
    );
  }
}
