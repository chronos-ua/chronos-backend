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
import { EEventInviteStatus, Event } from "./schemas/event.schema";
import { CalendarService } from "../calendar/calendar.service";
import {
  Calendar,
  ECalendarInviteStatus,
  ECalendarRole
} from "../calendar/schemas/calendar.schema";
import { IUserSession } from "../auth/auth.interfaces";
import { EmailService } from "src/common/email/email.service";
import { NotificationService } from "../notification/notification.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class EventService {
  constructor(
    @InjectModel("Event") private eventModel: Model<Event>,
    private readonly calendarService: CalendarService,
    @InjectModel("User") private userModel: Model<any>,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2
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

      return isOwner || isMember || !calendar.isPrivate;
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
          creatorId: userObjectId,
          calendarId: targetCalendarId
        })
        .lean()
        .exec();
    }

    // Created & subscribed events
    return await this.eventModel
      .find({
        $or: [{ creatorId: userObjectId }, { "members.user": userObjectId }]
      })
      .lean()
      .exec();
  }

  // Events the user is subscribed to (invited and accepted)
  async getSubscribedEvents(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    return await this.eventModel
      .find({
        members: {
          $elemMatch: {
            user: userObjectId,
            status: EEventInviteStatus.ACCEPTED
          }
        }
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
      calendarId: new Types.ObjectId(createEventDto.calendarId),
      creatorId: new Types.ObjectId(userId)
    });

    if (event.reminders && event.reminders.length > 0) {
      this.notificationService.scheduleEventReminders(event);
    }

    return event;
  }

  async findOne(eventId: string, userId: string) {
    // const event = await this.findById(eventId, false, true);
    const eventWithCalendar = await this.eventModel
      .findById(new Types.ObjectId(eventId))
      .populate("calendarId")
      .lean()
      .exec();

    if (!eventWithCalendar) throw new NotFoundException("Event not found");

    const userObjectId = new Types.ObjectId(userId);

    if (!eventWithCalendar.isPrivate) {
      return eventWithCalendar;
    }

    if (!(<Calendar>(<unknown>eventWithCalendar.calendarId)).isPrivate) {
      return eventWithCalendar;
    }

    if (eventWithCalendar.creatorId?.equals(userObjectId)) {
      return eventWithCalendar;
    }

    throw new ForbiddenException("Access denied to event");
  }

  async cloneEventToCalendar(
    eventId: string,
    targetCalendarId: string,
    userId: string
  ) {
    const event = await this.eventModel
      .findById(new Types.ObjectId(eventId))
      .populate("calendarId")
      .lean()
      .exec();
    if (!event) throw new NotFoundException("Event not found");
    const isPublicEvent = !event.isPrivate;
    const isPublicCalendar = !(<Calendar>(<unknown>event.calendarId)).isPrivate;
    if (!isPublicEvent && !isPublicCalendar) {
      throw new ForbiddenException("Cannot clone private event");
    }
    const canEditTargetCalendar = await this.canEditCalendar(
      targetCalendarId,
      userId
    );

    if (!canEditTargetCalendar) {
      throw new ForbiddenException(
        "No permission to add event to target calendar"
      );
    }

    const clone = {
      ...event,
      calendarId: new Types.ObjectId(targetCalendarId),
      creatorId: new Types.ObjectId(userId)
    };
    delete (<any>clone)._id;

    return await this.eventModel.create(clone);
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

    if (
      updateEventDto.reminders ||
      updateEventDto.start ||
      updateEventDto.end
    ) {
      this.notificationService.cancelEventReminders(eventId);
      if (updatedEvent.reminders && updatedEvent.reminders.length > 0) {
        this.notificationService.scheduleEventReminders(updatedEvent);
      }
    }

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

    this.notificationService.cancelEventReminders(eventId);
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
    let userCalendars: (Calendar & { _id: Types.ObjectId })[] = [];
    if (calendarId)
      userCalendars[0] = await this.calendarService.findOne(calendarId, userId);
    if (!userCalendars[0])
      userCalendars = await this.calendarService.getUserCalendars(userId);

    const calendarIds = userCalendars.map((cal) => cal._id);

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

  async sendInvite(eventId: string, sender: IUserSession, dto: any) {
    if (sender.user.email === dto.email)
      throw new ForbiddenException("Cannot invite yourself");

    const [event, user] = await Promise.all([
      this.findById(eventId, false, false),
      this.userModel.findOne({ email: dto.email })
    ]);
    if (!event) throw new NotFoundException("Event not found");

    const senderId = new Types.ObjectId(sender.user.id);
    if (!event.creatorId?.equals(senderId))
      throw new ForbiddenException("Only owner can send invites");

    event.members ??= [];
    if (event.members.some((m) => m.email === dto.email))
      throw new ForbiddenException("User already invited");

    const member = { ...dto } as Event["members"][0];
    member.status = EEventInviteStatus.PENDING;
    user && (member.user = user._id);
    event.members.push(member);

    const email =
      // user?.preferences.emailNotifications &&
      this.emailService.sendEventInvite(dto.email, event);
    await Promise.all([event.save(), email]);

    // Emit event for notification
    this.eventEmitter.emit("event.invite.sent", {
      eventId: event._id.toString(),
      eventTitle: event.title,
      inviteeEmail: dto.email,
      inviteeName: user?.name
    });
  }

  async acceptInvite(
    eventId: string,
    calendarId: string | undefined,
    userId: string,
    userEmail: string
  ) {
    const event = await this.findById(eventId, true, false);
    if (!event) throw new NotFoundException("Event not found");
    event.members ??= [];
    const user = new Types.ObjectId(userId);

    for (let member of event.members) {
      if (member.status !== EEventInviteStatus.PENDING) continue;
      if (!(member.email === userEmail || member.user?.equals(user))) continue;
      member.user = user; // In case of email-only invitation
      member.status = EEventInviteStatus.ACCEPTED;
      await event.save();

      // If calendarId provided, clone event to user's calendar
      if (calendarId) {
        const isMember = await this.calendarService.isMember(
          calendarId,
          userId
        );
        if (!isMember) {
          throw new ForbiddenException(
            "User does not have access to the specified calendar"
          );
        }

        // Clone the event to the user's calendar
        const eventData = event.toObject();
        delete eventData._id;
        await this.eventModel.create({
          ...eventData,
          calendarId: new Types.ObjectId(calendarId),
          creatorId: new Types.ObjectId(userId),
          members: [] // New event instance doesn't inherit members
        });
      }

      return;
    }

    throw new ForbiddenException("No pending invite found for this user");
  }

  async declineInvite(eventId: string, userId: string, userEmail: string) {
    const event = await this.findById(eventId, true, false);
    if (!event) throw new NotFoundException("Event not found");
    event.members ??= [];
    const user = new Types.ObjectId(userId);

    let member: Event["members"][0];
    for (let i = 0; i < event.members.length; i++) {
      member = event.members[i];
      if (member.status !== EEventInviteStatus.PENDING) continue;
      if (!(member.email === userEmail || member.user?.equals(user))) continue;
      event.members.splice(i, 1);
      await event.save();
      return;
    }

    throw new NotFoundException("No pending invite found for this user");
  }

  async leaveEvent(eventId: string, userId: string) {
    const event = await this.findById(eventId, false, false);
    if (!event) throw new NotFoundException("Event not found");
    event.members ??= [];
    const userObjectId = new Types.ObjectId(userId);

    for (let i = 0; i < event.members.length; i++) {
      if (event.members[i].user?.equals(userObjectId)) {
        event.members.splice(i, 1);
        await event.save();
        break;
      }
    }
  }
}
