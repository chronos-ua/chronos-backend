import { Injectable, Logger } from "@nestjs/common";
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

  private readonly logger = new Logger(ChatService.name);

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
    contextType: EChatContext,
    userId: string
  ): Promise<ChatMessage[]> {
    if (!(await this.isAllowedToAccess(contextId, contextType, userId))) {
      throw new Error("Access denied to chat messages for this context.");
    }
    const messages = await this.chatMessageModel
      .find({
        contextId: new Types.ObjectId(contextId),
        contextType: contextType
      })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    this.chatMessageModel
      .updateMany(
        {
          contextId: new Types.ObjectId(contextId),
          contextType: contextType,
          readBy: { $ne: new Types.ObjectId(userId) }
        },
        {
          $addToSet: { readBy: new Types.ObjectId(userId) }
        }
      )
      .exec()
      .catch((e) => {
        this.logger.error(`Failed to mark messages as read: ${e.message}`);
      });

    return messages;
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
