import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { CalendarModule } from "../calendar/calendar.module";
import { ChatGateway } from "./chat.gateway";
import { MongooseModule } from "@nestjs/mongoose";
import { ChatMessageSchema } from "./schemas/chatMessage.schema";

@Module({
  imports: [
    CalendarModule,
    MongooseModule.forFeature([
      { name: "ChatMessage", schema: ChatMessageSchema }
    ])
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService]
})
export class ChatModule {}
