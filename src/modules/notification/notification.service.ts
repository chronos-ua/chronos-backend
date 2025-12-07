import { Injectable, Logger } from "@nestjs/common";
import { EmailService } from "../../common/email/email.service";
import { ChatService } from "../chat/chat.service";
import { SseService } from "./sse.service";
import { PushNotificationService } from "./pushNotification.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Notification } from "./schemas/notification.schema";
import { User } from "../users/schemas/user.schema";
import { DEV } from "src/common/consts/env";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly socketService: ChatService,
    private readonly sseService: SseService,
    private readonly pushNotificationService: PushNotificationService,
    @InjectModel("Notification") private notificationModel: Model<Notification>,
    @InjectModel("User") private userModel: Model<User>
  ) {}

  public async handleNotification() {}

  public async sendNotification(
    userId: string,
    notification: {
      title: string;
      message?: string;
      url?: string;
    }
  ) {
    // Priority 1: WS
    let isSent = this.socketService.sendNotification(userId, notification);

    if (isSent) {
      DEV && this.logger.log(`Sent via WS to ${userId}`);
      return isSent;
    }

    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) {
      this.logger.warn(`User ${userId} not found`);
      return isSent;
    }

    const hasSSE = this.sseService.hasSubscription(userId);
    const hasPushSubs =
      user.pushSubscriptions && user.pushSubscriptions.length > 0;
    const emailEnabled = user.email && user.preferences?.emailNotifications;

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
}
