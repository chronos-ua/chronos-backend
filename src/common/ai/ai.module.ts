import { Module } from "@nestjs/common";
import { CalendarModule } from "src/modules/calendar/calendar.module";
import { EventModule } from "src/modules/events/event.module";
import { AiController } from "./ai.controller";
import { AIService } from "./ai.service";

@Module({
  imports: [CalendarModule, EventModule],
  controllers: [AiController],
  providers: [AIService],
  exports: [AIService]
})
export class AiModule {}
