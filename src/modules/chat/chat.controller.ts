import { BadRequestException, Controller, Get, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import type { IUserSession } from "../auth/auth.interfaces";
import { GetMessagesDto, GetMessagesResponseDto } from "./dto/get-messages.dto";
import { Session } from "@thallesp/nestjs-better-auth";
import { EChatContext } from "./schemas/chatMessage.schema";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import type { Request } from "express";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({ summary: "Get chat messages" })
  @ApiOkResponse({
    description: "List of chat messages",
    type: GetMessagesResponseDto,
    isArray: true
  })
  @ApiQuery({ name: "contextId", required: false, type: String })
  @ApiQuery({ name: "contextType", required: false, enum: EChatContext })
  @Get("messages")
  async getMessages(@Session() session: IUserSession, @Req() request: Request) {
    const contextId =
      (request.query?.contextId as string) || request.body?.contextId;
    const contextType =
      (request.query?.contextType as EChatContext) || request.body?.contextType;

    if (!contextId || !contextType) {
      throw new BadRequestException(
        "Either body or query parameters must be provided"
      );
    }

    const dto = { contextId, contextType };
    const dtoInstance = plainToInstance(GetMessagesDto, dto);

    const errors = await validate(dtoInstance);
    if (errors.length > 0) {
      throw new BadRequestException(`Validation failed: ${errors}`);
    }

    return await this.chatService.getMessagesByContext(
      dtoInstance.contextId,
      dtoInstance.contextType,
      session.user.id
    );
  }
}
