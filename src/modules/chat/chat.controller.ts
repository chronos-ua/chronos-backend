import { Body, Controller, Get, Session } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import type { IUserSession } from "../auth/auth.interfaces";
import { GetMessagesDto } from "./dto/get-messages.dto";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({ summary: "Get chat messages" })
  @Get("messages")
  async getMessages(
    @Session() session: IUserSession,
    @Body() dto: GetMessagesDto
  ) {
    return await this.chatService.getMessagesByContext(
      dto.contextId,
      dto.contextType,
      session.user.id
    );
  }
}
