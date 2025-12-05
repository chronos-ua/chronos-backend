import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { CalendarModule } from "../calendar/calendar.module";

@Module({
  imports: [CalendarModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: []
})
export class ChatModule {}
