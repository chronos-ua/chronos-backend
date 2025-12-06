import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException
} from "@nestjs/common";
import { EventService } from "./event.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { Session } from "@thallesp/nestjs-better-auth";
import type { IUserSession } from "../auth/auth.interfaces";
import { ApiOkResponse, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Event } from "./schemas/event.schema";
import { ResponseEventDto } from "./dto/response-event.dto";
import { MongoObjectIdStringDto } from "src/common/dto/mongoObjectIdDto";
import { CloneEventDto } from "./dto/clone-event.dto";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { AcceptEventInviteDto } from "./dto/accept-event-invite.dto";

@Controller("events")
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @ApiOperation({ summary: "Create new event" })
  @Post()
  async create(
    @Session() session: IUserSession,
    @Body() createEventDto: CreateEventDto
  ) {
    return await this.eventService.create(session.user.id, createEventDto);
  }

  @ApiOkResponse({
    description: "List of user events",
    type: ResponseEventDto,
    isArray: true
  })
  @ApiOperation({ summary: "Get all user events" })
  @ApiQuery({
    name: "calendarId",
    required: false,
    description: "Filter events by calendar ID"
  })
  @Get()
  async getUserEvents(
    @Session() session: IUserSession,
    @Query("calendarId") calendarId?: string
  ) {
    return await this.eventService.getUserEvents(session.user.id, calendarId);
  }

  @ApiOkResponse({
    description: "List of user events",
    type: ResponseEventDto,
    isArray: true
  })
  @ApiOperation({ summary: "Get events by calendar ID" })
  @Get("calendar/:id")
  async getEventsByCalendar(
    @Param() params: MongoObjectIdStringDto,
    @Session() session: IUserSession
  ) {
    return await this.eventService.getEventsByCalendar(
      params.id,
      session.user.id
    );
  }

  @ApiOkResponse({
    description: "List of user events",
    type: ResponseEventDto,
    isArray: true
  })
  @ApiOperation({ summary: "Get events by date range" })
  @ApiQuery({
    name: "startDate",
    required: true,
    description: "Start date (ISO 8601 format)"
  })
  @ApiQuery({
    name: "endDate",
    required: true,
    description: "End date (ISO 8601 format)"
  })
  @ApiQuery({
    name: "calendarId",
    required: false,
    description: "Filter events by calendar ID"
  })
  @Get("range")
  async getEventsByDateRange(
    @Session() session: IUserSession,
    @Query("startDate") startDateStr: string,
    @Query("endDate") endDateStr: string,
    @Query("calendarId") calendarId?: string
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime())) {
      throw new BadRequestException(
        "Invalid startDate format. Use ISO 8601 format."
      );
    }
    if (isNaN(endDate.getTime())) {
      throw new BadRequestException(
        "Invalid endDate format. Use ISO 8601 format."
      );
    }

    return await this.eventService.getEventsByDateRange(
      session.user.id,
      startDate,
      endDate,
      calendarId
    );
  }

  @ApiOkResponse({
    description: "List of subscribed events",
    type: ResponseEventDto,
    isArray: true
  })
  @ApiOperation({
    summary: "Get events the user is subscribed to (invited and accepted)"
  })
  @Get("subscribed")
  async getSubscribedEvents(@Session() session: IUserSession) {
    return await this.eventService.getSubscribedEvents(session.user.id);
  }

  @ApiOkResponse({
    description: "Event details",
    type: ResponseEventDto
  })
  @ApiOperation({ summary: "Get event by ID" })
  @Get(":id")
  async findOne(
    @Param("id") eventId: string,
    @Session() session: IUserSession
  ) {
    return await this.eventService.findOne(eventId, session.user.id);
  }

  @ApiOperation({ summary: "Clone event to another calendar" })
  @Post(":eventId/clone/:targetCalendarId")
  async cloneEventToCalendar(
    @Param() params: CloneEventDto,
    @Session() session: IUserSession
  ) {
    return await this.eventService.cloneEventToCalendar(
      params.eventId,
      params.targetCalendarId,
      session.user.id
    );
  }

  @ApiOperation({ summary: "Update event by ID" })
  @Patch(":id")
  async update(
    @Param("id") eventId: string,
    @Body() updateEventDto: UpdateEventDto,
    @Session() session: IUserSession
  ) {
    return await this.eventService.update(
      session.user.id,
      eventId,
      updateEventDto
    );
  }

  @ApiOperation({ summary: "Delete event by ID" })
  @Delete(":id")
  async remove(@Param("id") eventId: string, @Session() session: IUserSession) {
    return await this.eventService.remove(eventId, session.user.id);
  }

  @ApiOperation({
    summary: "Send event invite",
    parameters: [
      { name: "id", in: "path", required: true, description: "Event ID" }
    ]
  })
  @Post("invite/:id")
  async sendInvite(
    @Param() params: MongoObjectIdStringDto,
    @Body() dto: InviteMemberDto,
    @Session() session: IUserSession
  ) {
    return await this.eventService.sendInvite(params.id, session, dto);
  }

  @ApiOperation({
    summary: "Accept event invite",
    parameters: [
      { name: "id", in: "path", required: true, description: "Event ID" },
      {
        name: "calendarId",
        in: "query",
        required: true,
        description: "Calendar ID to clone event to"
      }
    ]
  })
  @Get("/invite/:id")
  async acceptInvite(
    @Param() params: AcceptEventInviteDto,
    @Session() session: IUserSession
  ) {
    return await this.eventService.acceptInvite(
      params.id,
      params.calendarId,
      session.user.id,
      session.user.email
    );
  }

  @ApiOperation({ summary: "Decline event invite" })
  @Delete("/invite/:id")
  async declineInvite(
    @Param() params: MongoObjectIdStringDto,
    @Session() session: IUserSession
  ) {
    return await this.eventService.declineInvite(
      params.id,
      session.user.id,
      session.user.email
    );
  }

  @ApiOperation({ summary: "Leave event" })
  @Post("/leave/:id")
  async leaveEvent(
    @Param() params: MongoObjectIdStringDto,
    @Session() session: IUserSession
  ) {
    return await this.eventService.leaveEvent(params.id, session.user.id);
  }
}
