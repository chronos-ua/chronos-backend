import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export enum EChatContext {
  CALENDAR = "calendar",
  EVENT = "event",
  DIRECT = "direct",
  PROFILE = "profile"
}

@Schema({ timestamps: true, collection: "chatMessage" })
export class ChatMessage extends Document {
  @Prop({ required: true, type: Types.ObjectId, index: true })
  contextId: Types.ObjectId;

  @Prop({ enum: EChatContext, required: true })
  contextType: EChatContext;

  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop([{ type: Types.ObjectId, ref: "User" }])
  readBy: Types.ObjectId[];
}
export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.set("strict", true);
