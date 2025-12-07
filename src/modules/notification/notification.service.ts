import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy
} from "@nestjs/common";
import { EmailService } from "../../common/email/email.service";
import { ChatService } from "../chat/chat.service";
import { SseService } from "./sse.service";
import { PushNotificationService } from "./pushNotification.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Notification } from "./schemas/notification.schema";
import { User } from "../users/schemas/user.schema";
import { DEV } from "src/common/consts/env";
import { Event, EReminderMethod } from "../events/schemas/event.schema";
import { OnEvent } from "@nestjs/event-emitter";
import { Calendar } from "../calendar/schemas/calendar.schema";

interface ReminderQueueItem {
  eventId: string;
  userId: string;
  eventTitle: string;
  eventStart: Date;
  method: EReminderMethod;
  minutesBefore: number;
  notifyAt: Date;
  timeoutId?: NodeJS.Timeout;
}

// Peak production shitcode
// Probably needs a total rewrite to the event emitters

// TODO:
// - Throttle email reminders to avoid spamming
// - Batching

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private reminderQueue: Map<string, ReminderQueueItem> = new Map();
  private fetchInterval: NodeJS.Timeout;
  private readonly FETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly SCHEDULE_WINDOW_MS = 60 * 60 * 1000; // Schedule reminders up to 1 hour in advance

  constructor(
    private readonly emailService: EmailService,
    private readonly socketService: ChatService,
    private readonly sseService: SseService,
    private readonly pushNotificationService: PushNotificationService,
    @InjectModel("Notification") private notificationModel: Model<Notification>,
    @InjectModel("User") private userModel: Model<User>,
    @InjectModel("Event") private eventModel: Model<Event>
  ) {}

  async onModuleInit() {
    await this.loadUpcomingReminders();
    this.fetchInterval = setInterval(() => {
      this.loadUpcomingReminders();
    }, this.FETCH_INTERVAL_MS);
    DEV && this.logger.log("Reminder system initialized");
  }

  onModuleDestroy() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
    }
    // Clear all scheduled timeouts
    for (const item of this.reminderQueue.values()) {
      if (item.timeoutId) {
        clearTimeout(item.timeoutId);
      }
    }
    this.reminderQueue.clear();
    DEV && this.logger.log("Reminder system destroyed");
  }

  public async handleNotification() {}

  /**
   * Load upcoming reminders from database and schedule them
   */
  private async loadUpcomingReminders() {
    try {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + this.SCHEDULE_WINDOW_MS);

      const events = await this.eventModel
        .find({
          start: { $gt: now },
          reminders: { $exists: true, $ne: [] }
        })
        .lean()
        .exec();

      let scheduled = 0;
      for (const event of events) {
        if (!event.reminders || event.reminders.length === 0) continue;

        for (const reminder of event.reminders) {
          const notifyAt = new Date(
            new Date(event.start).getTime() - reminder.minutesBefore * 60 * 1000
          );

          // Only schedule if within our window and not in the past
          if (notifyAt > now && notifyAt <= windowEnd) {
            // Add reminder for event creator
            this.scheduleReminder(
              event._id.toString(),
              event.creatorId.toString(),
              event.title,
              event.start,
              reminder.method,
              reminder.minutesBefore
            );
            scheduled++;

            // Add reminders for accepted members
            if (event.members) {
              for (const member of event.members) {
                if (member.user && member.status === "accepted") {
                  this.scheduleReminder(
                    event._id.toString(),
                    member.user.toString(),
                    event.title,
                    event.start,
                    reminder.method,
                    reminder.minutesBefore
                  );
                  scheduled++;
                }
              }
            }
          }
        }
      }

      DEV && this.logger.log(`Scheduled ${scheduled} reminders from database`);
    } catch (error) {
      this.logger.error("Failed to load upcoming reminders", error);
    }
  }

  /**
   * Schedule a single reminder
   */
  public scheduleReminder(
    eventId: string,
    userId: string,
    eventTitle: string,
    eventStart: Date,
    method: EReminderMethod,
    minutesBefore: number
  ) {
    const notifyAt = new Date(
      new Date(eventStart).getTime() - minutesBefore * 60 * 1000
    );
    const now = new Date();
    if (notifyAt <= now) return;

    const queueKey = `${eventId}-${userId}-${minutesBefore}-${method}`;

    if (this.reminderQueue.has(queueKey)) return;

    const delayMs = notifyAt.getTime() - now.getTime();

    const queueItem: ReminderQueueItem = {
      eventId,
      userId,
      eventTitle,
      eventStart: new Date(eventStart),
      method,
      minutesBefore,
      notifyAt
    };

    if (delayMs <= this.SCHEDULE_WINDOW_MS) {
      queueItem.timeoutId = setTimeout(() => {
        this.sendReminderNotification(queueItem);
        this.reminderQueue.delete(queueKey);
      }, delayMs);
    }

    this.reminderQueue.set(queueKey, queueItem);
    DEV &&
      this.logger.debug(
        `Scheduled reminder for event ${eventId} to user ${userId} at ${notifyAt.toISOString()}`
      );
  }

  public scheduleEventReminders(event: {
    _id: Types.ObjectId | string;
    title: string;
    start: Date;
    creatorId: Types.ObjectId | string;
    reminders?: Array<{ method: EReminderMethod; minutesBefore: number }>;
    members?: Array<{ user?: Types.ObjectId | string; status: string }>;
  }) {
    if (!event.reminders || event.reminders.length === 0) return;

    const eventId = event._id.toString();
    const creatorId = event.creatorId.toString();

    for (const reminder of event.reminders) {
      this.scheduleReminder(
        eventId,
        creatorId,
        event.title,
        event.start,
        reminder.method,
        reminder.minutesBefore
      );

      if (event.members) {
        for (const member of event.members) {
          if (member.user && member.status === "accepted") {
            this.scheduleReminder(
              eventId,
              member.user.toString(),
              event.title,
              event.start,
              reminder.method,
              reminder.minutesBefore
            );
          }
        }
      }
    }
  }

  public cancelEventReminders(eventId: string) {
    let cancelled = 0;
    for (const [key, item] of this.reminderQueue.entries()) {
      if (item.eventId === eventId) {
        if (item.timeoutId) {
          clearTimeout(item.timeoutId);
        }
        this.reminderQueue.delete(key);
        cancelled++;
      }
    }
    DEV &&
      cancelled > 0 &&
      this.logger.log(`Cancelled ${cancelled} reminders for event ${eventId}`);
  }

  private async sendReminderNotification(reminder: ReminderQueueItem) {
    try {
      const timeUntilEvent = Math.round(
        (reminder.eventStart.getTime() - Date.now()) / 60000
      );
      const timeText =
        timeUntilEvent < 60
          ? `in ${timeUntilEvent} minutes`
          : `in ${Math.round(timeUntilEvent / 60)} hours`;

      const notification = {
        title: `Reminder: ${reminder.eventTitle}`,
        message: `Event starts ${timeText}`,
        url: `/events/${reminder.eventId}`
      };

      switch (reminder.method) {
        case EReminderMethod.EMAIL:
          const user = await this.userModel
            .findById(reminder.userId)
            .lean()
            .exec();
          if (user?.email && user.preferences?.emailNotifications) {
            await this.emailService.sendGenericNotification(
              user.email,
              notification.title,
              notification.message,
              notification.url
            );
            DEV &&
              this.logger.log(`Email reminder sent to user ${reminder.userId}`);
          }
          break;
        case EReminderMethod.PUSH:
        case EReminderMethod.TELEGRAM:
          await this.sendNotification(reminder.userId, notification);
          break;
      }

      DEV &&
        this.logger.log(
          `Reminder sent for event ${reminder.eventId} to user ${reminder.userId}`
        );
    } catch (error) {
      this.logger.error(
        `Failed to send reminder for event ${reminder.eventId}`,
        error
      );
    }
  }

  public async sendNotification(
    userId: string,
    notification: {
      title: string;
      message?: string;
      url?: string;
    },
    skipFlags: {
      ws?: boolean;
      sse?: boolean;
      push?: boolean;
      email?: boolean;
    } = {}
  ) {
    // Priority 1: WS
    let isSent =
      !skipFlags.ws &&
      this.socketService.sendNotification(userId, notification);

    if (isSent) {
      DEV && this.logger.log(`Sent via WS to ${userId}`);
      return isSent;
    }

    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) {
      this.logger.warn(`User ${userId} not found`);
      return isSent;
    }

    const hasSSE = !skipFlags.sse && this.sseService.hasSubscription(userId);
    const hasPushSubs =
      !skipFlags.push &&
      user.pushSubscriptions &&
      user.pushSubscriptions.length > 0;
    const emailEnabled =
      !skipFlags.email && user.email && user.preferences?.emailNotifications;

    // SSE fallback

    if (hasSSE) {
      this.sseService.emit(`user:${userId}`, notification);
      DEV && this.logger.log(`Notification sent via SSE to user ${userId}`);
      return true;
    }

    // Priority 2: Web Push & Email

    if (hasPushSubs) {
      const result =
        await this.pushNotificationService.sendToMultipleSubscriptions(
          user.pushSubscriptions,
          notification
        );

      if (result.succeeded > 0) {
        DEV &&
          this.logger.log(
            `Notification sent via Web Push to ${result.succeeded} devices for user ${userId}`
          );
        isSent = true;
      }

      // Clean up failed subscriptions
      if (result.failed.length > 0) {
        await this.userModel.findByIdAndUpdate(userId, {
          $pull: { pushSubscriptions: { endpoint: { $in: result.failed } } }
        });
        DEV &&
          this.logger.log(
            `Removed ${result.failed.length} expired push subscriptions for user ${userId}`
          );
      }
    }

    // Email

    if (emailEnabled) {
      await this.emailService.sendGenericNotification(
        user.email,
        notification.title,
        notification.message,
        notification.url
      );
      DEV && this.logger.log(`Notification sent via Email to user ${userId}`);
      return;
    }

    if (!isSent) {
      DEV &&
        this.logger.warn(
          `No notification channel available for user ${userId}`
        );
    }
  }

  @OnEvent("event.invite.sent")
  async handleEventInvite(payload: {
    eventId: string;
    eventTitle: string;
    inviteeEmail: string;
    inviteeName?: string;
  }) {
    try {
      const user = await this.userModel
        .findOne({ email: payload.inviteeEmail })
        .lean()
        .exec();

      if (user) {
        await this.sendNotification(
          user._id.toString(),
          {
            title: "Event Invitation",
            message: `You've been invited to: ${payload.eventTitle}`,
            url: `/events/${payload.eventId}`
          },
          { email: true }
        );
      }

      DEV &&
        this.logger.log(
          `Event invite notification sent to ${payload.inviteeEmail}`
        );
    } catch (error) {
      this.logger.error("Failed to send event invite notification", error);
    }
  }

  @OnEvent("calendar.invite.sent")
  async handleCalendarInvite(payload: {
    calendarId: string;
    calendarTitle: string;
    inviteeEmail: string;
    inviteeName?: string;
  }) {
    try {
      const user = await this.userModel
        .findOne({ email: payload.inviteeEmail })
        .lean()
        .exec();

      if (user) {
        await this.sendNotification(
          user._id.toString(),
          {
            title: "Calendar Invitation",
            message: `You've been invited to calendar: ${payload.calendarTitle}`,
            url: `/calendars/${payload.calendarId}`
          },
          { email: true }
        );
      }

      DEV &&
        this.logger.log(
          `Calendar invite notification sent to ${payload.inviteeEmail}`
        );
    } catch (error) {
      this.logger.error("Failed to send calendar invite notification", error);
    }
  }
}
