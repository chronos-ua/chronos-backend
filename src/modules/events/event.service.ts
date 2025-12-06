import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Document, Model, Types } from "mongoose";
import { Event } from "./schemas/event.schema";
import { CalendarService } from "../calendar/calendar.service";
import {
  Calendar,
  ECalendarInviteStatus,
  ECalendarRole
} from "../calendar/schemas/calendar.schema";

@Injectable()
export class EventService {
  constructor(
    @InjectModel("Event") private eventModel: Model<Event>,
    private readonly calendarService: CalendarService
  ) {}

  // TODO: contribute fix to mongoose typings
  private findById(
    eventId: string,
    customId: boolean,
    lean: true
  ): Promise<Event | null>;
  private findById(
    eventId: string,
    customId: boolean,
    lean: false
  ): Promise<(Event & Document) | null>;
  private findById(
    eventId: string,
    customId: boolean,
    lean: boolean
  ): Promise<Event | (Event & Document) | null> {
    if (customId) {
      return this.eventModel
        .findOne({
          $or: [{ customId: eventId }, { _id: new Types.ObjectId(eventId) }]
        })
        .lean(lean)
        .exec() as Promise<Event | (Event & Document) | null>;
    } else {
      return this.eventModel
        .findById(new Types.ObjectId(eventId))
        .lean(lean)
        .exec() as Promise<Event | (Event & Document) | null>;
    }
  }

  private async hasCalendarAccess(
    calendarId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const calendar = await this.calendarService.findOne(calendarId, userId);
      if (!calendar) return false;

      const userObjectId = new Types.ObjectId(userId);
      const isOwner = calendar.owner.equals(userObjectId);
      const isMember =
        calendar.members?.some(
          (member) =>
            member.status === ECalendarInviteStatus.ACCEPTED &&
            member.user?.equals(userObjectId)
        ) ?? false;

      return isOwner || isMember;
    } catch {
      return false;
    }
  }

  private async canEditCalendar(
    calendarId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const calendar = await this.calendarService.findOne(calendarId, userId);
      if (!calendar) return false;

      const userObjectId = new Types.ObjectId(userId);
      const isOwner = calendar.owner.equals(userObjectId);
      const isEditor =
        calendar.members?.some(
          (member) =>
            member.status === ECalendarInviteStatus.ACCEPTED &&
            member.user?.equals(userObjectId) &&
            member.role === ECalendarRole.EDITOR
        ) ?? false;

      return isOwner || isEditor;
    } catch {
      return false;
    }
  }

  async getUserEvents(userId: string, calendarId?: string) {
    const userObjectId = new Types.ObjectId(userId);
    const calendars = await this.calendarService.getUserCalendars(userId);
    const calendarIds = calendars.map((cal) => cal._id);

    if (calendarId) {
      const targetCalendarId = calendarIds.find(
        (id) => id.toString() === calendarId
      );
      if (!targetCalendarId) {
        throw new ForbiddenException("Access denied to calendar");
      }

      return await this.eventModel
        .find({
          calendarId: targetCalendarId
        })
        .lean()
        .exec();
    }

    return await this.eventModel
      .find({
        creatorId: userObjectId
      })
      .lean()
      .exec();
  }

  async create(userId: string, createEventDto: CreateEventDto) {
    if (new Date(createEventDto.end) < new Date(createEventDto.start)) {
      throw new BadRequestException("End date must be after start date");
    }

    const event = await this.eventModel.create({
      ...createEventDto,
      creatorId: new Types.ObjectId(userId)
    });

    // TODO: implement notifications - send event creation notifications to cal members
    // TODO: implement notifications - schedule reminder notifications based on reminders array
    // TODO: notification service itself, lol

    return event;
  }

  async findOne(eventId: string, userId: string) {
    const event = await this.findById(eventId, false, true);
    if (!event) throw new NotFoundException("Event not found");

    const userObjectId = new Types.ObjectId(userId);
    // Quick check: creator always has access
    if (event.creatorId?.equals(userObjectId)) {
      return event;
    }

    const hasAccess = await this.hasCalendarAccess(
      event.calendarId.toString(),
      userId
    );
    if (!hasAccess) {
      throw new ForbiddenException("Access denied to event");
    }

    return event;
  }

  async update(
    userId: string,
    eventId: string,
    updateEventDto: UpdateEventDto
  ) {
    const event = await this.findById(eventId, false, false);
    if (!event) throw new NotFoundException("Event not found");

    const userObjectId = new Types.ObjectId(userId);
    // Creator or calendar editor can edit
    const isCreator = event.creatorId?.equals(userObjectId);
    const canEdit = isCreator
      ? true
      : await this.canEditCalendar(event.calendarId.toString(), userId);

    if (!canEdit) {
      throw new ForbiddenException("No permission to edit this event");
    }

    const startDate =
      updateEventDto.start || (event.start ? new Date(event.start) : null);
    const endDate =
      updateEventDto.end || (event.end ? new Date(event.end) : null);

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException("End date must be after start date");
    }

    if (updateEventDto.calendarId) {
      const canEditNewCalendar = await this.canEditCalendar(
        updateEventDto.calendarId,
        userId
      );
      if (!canEditNewCalendar) {
        throw new ForbiddenException(
          "No permission to move event to this calendar"
        );
      }
      updateEventDto.calendarId = new Types.ObjectId(
        updateEventDto.calendarId
      ) as any;
    }

    Object.assign(event, updateEventDto);
    const updatedEvent = await event.save();

    // TODO: implement notifications - send event update notifications to calendar members
    // TODO: implement notifications - update scheduled reminder notifications

    return updatedEvent;
  }

  async remove(eventId: string, userId: string) {
    const event = await this.findById(eventId, false, false);
    if (!event) throw new NotFoundException("Event not found");

    const userObjectId = new Types.ObjectId(userId);
    // Creator or calendar editor can delete
    const isCreator = event.creatorId?.equals(userObjectId);
    const canEdit = isCreator
      ? true
      : await this.canEditCalendar(event.calendarId.toString(), userId);

    if (!canEdit) {
      throw new ForbiddenException("No permission to delete this event");
    }

    await event.deleteOne();

    // TODO: implement notifications - send event deletion notifications to calendar members
    // TODO: implement notifications - cancel scheduled reminder notifications
  }

  async getEventsByCalendar(calendarId: string, userId: string) {
    const hasAccess = await this.hasCalendarAccess(calendarId, userId);
    if (!hasAccess) {
      throw new ForbiddenException("Access denied to calendar");
    }

    const calendarObjectId = new Types.ObjectId(calendarId);
    return await this.eventModel
      .find({
        $or: [{ calendarId: calendarObjectId }, { calendarId: calendarId }]
      })
      .lean()
      .exec();
  }

  async getEventsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    calendarId?: string
  ) {
    const calendars = await this.calendarService.getUserCalendars(userId);
    const calendarIds = calendars.map((cal) => cal._id);

    if (calendarId) {
      const targetCalendarId = calendarIds.find(
        (id) => id.toString() === calendarId
      );
      if (!targetCalendarId) {
        throw new ForbiddenException("Access denied to calendar");
      }
      return await this.eventModel
        .find({
          calendarId: targetCalendarId,
          start: { $lte: endDate },
          end: { $gte: startDate }
        })
        .lean()
        .exec();
    }

    return await this.eventModel
      .find({
        calendarId: { $in: calendarIds },
        start: { $lte: endDate },
        end: { $gte: startDate }
      })
      .lean()
      .exec();
  }
}
