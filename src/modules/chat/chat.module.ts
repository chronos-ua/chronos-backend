import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { CalendarModule } from "../calendar/calendar.module";
import { ChatGateway } from "./chat.gateway";

@Module({
  imports: [CalendarModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: []
})
export class ChatModule {}
