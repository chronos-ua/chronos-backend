import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { SseService } from "./sse.service";
import { PushNotificationService } from "./pushNotification.service";
import { EmailModule } from "src/common/email/email.module";
import { ChatModule } from "../chat/chat.module";
import { NotificationSchema } from "./schemas/notification.schema";
import { UserSchema } from "../users/schemas/user.schema";
import { EventSchema } from "../events/schemas/event.schema";

@Module({
  imports: [
    EmailModule,
    ChatModule,
    MongooseModule.forFeature([
      { name: "Notification", schema: NotificationSchema },
      { name: "User", schema: UserSchema },
      { name: "Event", schema: EventSchema }
    ])
  ],
  controllers: [NotificationController],
  providers: [NotificationService, SseService, PushNotificationService],
  exports: [NotificationService, SseService]
})
export class NotificationModule {}
