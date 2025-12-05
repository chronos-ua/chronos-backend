import { Body, Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import type { IUserSession } from "../auth/auth.interfaces";
import { GetMessagesDto, GetMessagesResponseDto } from "./dto/get-messages.dto";
import { Session } from "@thallesp/nestjs-better-auth";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({ summary: "Get chat messages" })
  @ApiOkResponse({
    description: "List of chat messages",
    type: GetMessagesResponseDto,
    isArray: true
  })
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
