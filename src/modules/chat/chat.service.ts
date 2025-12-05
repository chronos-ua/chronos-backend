import { Injectable } from "@nestjs/common";
import { CalendarService } from "../calendar/calendar.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ChatMessage, EChatContext } from "./schemas/chatMessage.schema";

@Injectable()
export class ChatService {
  constructor(
    private readonly calendarService: CalendarService,
    @InjectModel("ChatMessage")
    private readonly chatMessageModel: Model<ChatMessage>
  ) {}

  async handleMessage(
    contextId: string,
    contextType: EChatContext,
    senderId: string,
    content: string
  ) {
    switch (contextType) {
      case EChatContext.CALENDAR:
        // Allowing to join room only if user is member of calendar
        // So no additional checks are needed here
        break;
      //TODO: event
      default:
        throw new Error("Unsupported chat context type.");
    }

    const chatMessage = new this.chatMessageModel({
      contextId,
      contextType,
      senderId,
      content,
      readBy: [new Types.ObjectId(senderId)]
    });
    return await chatMessage.save();
  }

  public async markAsRead(
    messageId: string,
    userId: string
  ): Promise<ChatMessage | null> {
    return await this.chatMessageModel.findByIdAndUpdate(
      messageId,
      {
        $addToSet: { readBy: new Types.ObjectId(userId) }
      },
      { new: true }
    );
  }

  public async getMessagesByContext(
    contextId: string,
    contextType: EChatContext
  ): Promise<ChatMessage[]> {
    return await this.chatMessageModel
      .find({
        contextId: new Types.ObjectId(contextId),
        contextType: contextType
      })
      .sort({ createdAt: 1 })
      .exec();
  }

  public async isAllowedToAccess(
    contextId: string,
    contextType: EChatContext,
    userId: string
  ): Promise<boolean> {
    switch (contextType) {
      case EChatContext.CALENDAR:
        const calendar = await this.calendarService.isMember(contextId, userId);
        return !!calendar;
      default:
        return false;
    }
  }
}
