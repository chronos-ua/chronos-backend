import { ECalendarRole } from "./schemas/calendar.schema";
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
import { ApiOperation } from "@nestjs/swagger";
import { InviteMemberDto } from "./dto/invite-member.dto";

@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @ApiOperation({ summary: "Get all user calendars" })
  @Get()
  async getUserCalendars(@Session() session: IUserSession) {
    return await this.calendarService.getUserCalendars(session.user.id);
  }

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
  findOne(@Param("id") calendarId: string, @Session() session: IUserSession) {
    return this.calendarService.findOne(calendarId, session.user.id);
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
  remove(@Param("id") id: string, @Session() session: IUserSession) {
    return this.calendarService.remove(id, session.user.id);
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

  @ApiOperation({ summary: "Send calendar invite" })
  @Post("invite/:calendarId")
  async sendInvite(
    @Param("calendarId") calendarId: string,
    @Body() dto: InviteMemberDto,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.sendInvite(calendarId, session, dto);
  }

  @ApiOperation({ summary: "Accept calendar invite" })
  @Get("/invite/:id")
  async acceptInvite(
    @Param("id") calendarId: string,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.acceptInvite(
      calendarId,
      session.user.id,
      session.user.email
    );
  }

  @ApiOperation({ summary: "Decline calendar invite" })
  @Delete("/invite/:id")
  async declineInvite(
    @Param("id") calendarId: string,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.declineInvite(
      calendarId,
      session.user.id,
      session.user.email
    );
  }

  @ApiOperation({ summary: "Leave calendar" })
  @Post("/leave/:id")
  async leaveCalendar(
    @Param("id") calendarId: string,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.leaveCalendar(
      calendarId,
      session.user.id
    );
  }

  @ApiOperation({
    summary: "Save public calendar",
    description: "Subscribe to public calendar"
  })
  @Post("/subscribe/:id")
  async subscribeCalendar(
    @Param("id") calendarId: string,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.subscribeCalendar(
      calendarId,
      session.user.id
    );
  }

  @ApiOperation({
    summary: "Remove public calendar",
    description: "Unsubscribe from public calendar"
  })
  @Post("/unsubscribe/:id")
  async unsubscribeCalendar(
    @Param("id") calendarId: string,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.unsubscribeCalendar(
      calendarId,
      session.user.id
    );
  }

  @ApiOperation({ summary: "Get saved public calendars" })
  @Get("/subscriptions")
  async getSubscriptions(@Session() session: IUserSession) {
    return await this.calendarService.getSubscriptions(session.user.id);
  }
}
