import { Module } from "@nestjs/common";
import { EventService } from "./event.service";
import { EventController } from "./event.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { EventSchema } from "./schemas/event.schema";
import { CalendarModule } from "../calendar/calendar.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Event", schema: EventSchema }]),
    CalendarModule
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService]
})
export class EventModule {}
