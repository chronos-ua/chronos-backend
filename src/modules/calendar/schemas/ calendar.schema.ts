import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export enum CalendarRole {
  OWNER = "owner",
  EDITOR = "editor",
  READER = "reader"
}

@Schema({ timestamps: true })
export class Calendar {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: "#4F46E5" })
  color: string;

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop([
    {
      userId: { type: Types.ObjectId, ref: "User" },
      role: { type: String, enum: CalendarRole },
      status: {
        type: String,
        enum: ["pending", "accepted"],
        default: "pending"
      },
      email: String // For invitations to users not yet registered
    }
  ])
  members: Array<{
    userId?: Types.ObjectId;
    role: CalendarRole;
    status: string;
    email?: string;
  }>;
}

export const CalendarSchema = SchemaFactory.createForClass(Calendar);
