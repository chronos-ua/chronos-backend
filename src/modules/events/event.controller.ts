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
    description: "List of user events",
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
}
