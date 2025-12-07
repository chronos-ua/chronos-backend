import { Module } from "@nestjs/common";
import { EventService } from "./event.service";
import { EventController } from "./event.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { EventSchema } from "./schemas/event.schema";
import { CalendarModule } from "../calendar/calendar.module";
import { UserSchema } from "../users/schemas/user.schema";
import { EmailModule } from "src/common/email/email.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Event", schema: EventSchema }]),
    MongooseModule.forFeature([{ name: "User", schema: UserSchema }]),
    CalendarModule,
    EmailModule,
    NotificationModule
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService]
})
export class EventModule {}
