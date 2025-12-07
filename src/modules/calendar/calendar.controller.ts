import { ECalendarRole } from "./schemas/calendar.schema";
import type { IUserSession } from "./../auth/auth.interfaces.d";
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe
} from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { CreateCalendarDto } from "./dto/create-calendar.dto";
import { UpdateCalendarDto } from "./dto/update-calendar.dto";
import { Session } from "@thallesp/nestjs-better-auth";
import { ApiOperation } from "@nestjs/swagger";
import { InviteCalendarMemberDto } from "./dto/invite-calendar-member.dto";
import { MongoObjectIdStringDto } from "src/common/dto/mongoObjectIdDto";
import { TransferOwnershipParamsDto } from "./dto/transfer-ownership-params.dto";

@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @ApiOperation({ summary: "Create new calendar" })
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

  @ApiOperation({ summary: "Get all user calendars" })
  @Get()
  async getUserCalendars(@Session() session: IUserSession) {
    return await this.calendarService.getUserCalendars(session.user.id);
  }

  @ApiOperation({ summary: "Get calendar by ID" })
  @Get(":id")
  findOne(
    @Param() params: MongoObjectIdStringDto,
    @Session() session: IUserSession
  ) {
    return this.calendarService.findOne(params.id, session.user.id);
  }

  @ApiOperation({ summary: "Update calendar by ID" })
  @Patch(":id")
  update(
    @Param() params: MongoObjectIdStringDto,
    @Body() updateCalendarDto: UpdateCalendarDto,
    @Session() session: IUserSession
  ) {
    return this.calendarService.update(
      session.user.id,
      params.id,
      updateCalendarDto
    );
  }

  @ApiOperation({ summary: "Delete calendar by ID" })
  @Delete(":id")
  remove(
    @Param() params: MongoObjectIdStringDto,
    @Session() session: IUserSession
  ) {
    return this.calendarService.remove(params.id, session.user.id);
  }

  @ApiOperation({
    summary: "Send calendar invite",
    parameters: [
      { name: "id", in: "path", required: true, description: "Calendar ID" }
    ]
  })
  @Post("invite/:id")
  async sendInvite(
    @Param() params: MongoObjectIdStringDto,
    @Body() dto: InviteCalendarMemberDto,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.sendInvite(params.id, session, dto);
  }

  @ApiOperation({ summary: "Accept calendar invite" })
  @Get("/invite/:id")
  async acceptInvite(
    @Param() params: MongoObjectIdStringDto,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.acceptInvite(
      params.id,
      session.user.id,
      session.user.email
    );
  }

  @ApiOperation({ summary: "Decline calendar invite" })
  @Delete("/invite/:id")
  async declineInvite(
    @Param() params: MongoObjectIdStringDto,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.declineInvite(
      params.id,
      session.user.id,
      session.user.email
    );
  }

  @ApiOperation({ summary: "Leave calendar" })
  @Post("/leave/:id")
  async leaveCalendar(
    @Param() params: MongoObjectIdStringDto,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.leaveCalendar(params.id, session.user.id);
  }

  @ApiOperation({
    summary: "Save public calendar",
    description: "Subscribe to public calendar"
  })
  @Post("/subscribe/:id")
  async subscribeCalendar(
    @Param() params: MongoObjectIdStringDto,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.subscribeCalendar(
      params.id,
      session.user.id
    );
  }

  @ApiOperation({ summary: "Get saved public calendars" })
  @Get("/subscriptions")
  async getSubscriptions(@Session() session: IUserSession) {
    return await this.calendarService.getSubscriptions(session.user.id);
  }

  @ApiOperation({
    summary: "Remove public calendar",
    description: "Unsubscribe from public calendar"
  })
  @Post("/unsubscribe/:id")
  async unsubscribeCalendar(
    @Param() params: MongoObjectIdStringDto,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.unsubscribeCalendar(
      params.id,
      session.user.id
    );
  }

  @ApiOperation({ summary: "Transfer calendar ownership to another user" })
  @Patch("/transfer-ownership/:calendarId/:newOwnerId")
  async transferOwnership(
    @Param() params: TransferOwnershipParamsDto,
    @Session() session: IUserSession
  ) {
    return await this.calendarService.transferOwnership(
      params.calendarId,
      params.newOwnerId,
      session.user.id
    );
  }
}
