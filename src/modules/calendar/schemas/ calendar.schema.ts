import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export enum ICalendarRole {
  OWNER = "owner",
  EDITOR = "editor",
  READER = "reader"
}

export type ICalendarDocument = HydratedDocument<Calendar>;

@Schema({ timestamps: true })
export class Calendar {
  @Prop({ required: true })
  title: string;

  // TODO:
  // Ceate default calendar on user registration
  // Restrict deletion of default calendar
  @Prop()
  /** Marks the main calendar of the user */
  isDefault?: boolean;

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
      role: { type: String, enum: ICalendarRole },
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
    role: ICalendarRole;
    status: string;
    email?: string;
  }>;
}

export const CalendarSchema = SchemaFactory.createForClass(Calendar);
