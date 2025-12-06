import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export enum EEventType {
  ARRANGEMENT = "arrangement",
  TASK = "task",
  REMINDER = "reminder",
  EVENT = "event",
  HOLIDAY = "holiday"
}

export enum EReminderMethod {
  EMAIL = "email",
  PUSH = "push",
  TELEGRAM = "telegram"
}

export enum EEventRole {
  OWNER = "owner",
  EDITOR = "editor",
  VIEWER = "viewer"
}

export enum EEventInviteStatus {
  PENDING = "pending",
  ACCEPTED = "accepted"
}

export type IEventDocument = HydratedDocument<Event>;
export type IEventWithId = Event & { _id: Types.ObjectId };
@Schema({ timestamps: true, collection: "event" })
export class Event {
  @Prop({ required: true, type: Types.ObjectId, ref: "Calendar", index: true })
  calendarId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "User", index: true })
  creatorId: Types.ObjectId;

  // TODO: premium feature?
  @Prop()
  customId?: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: String, enum: EEventType, default: EEventType.ARRANGEMENT })
  type: EEventType;

  @Prop({ required: true })
  /** UTC */
  start: Date;

  @Prop({ required: true })
  /** UTC */
  end: Date;

  @Prop({ default: false })
  isAllDay: boolean;

  // TODO: weather notification
  @Prop()
  isOutdoor?: boolean;

  // Task specific
  @Prop({ default: false })
  isCompleted?: boolean;

  @Prop()
  address?: string;

  @Prop()
  externalUrl?: string;

  @Prop()
  imageUrl?: string;

  @Prop([
    {
      method: { type: String, enum: EReminderMethod },
      minutesBefore: Number
    }
  ])
  reminders: Array<{ method: EReminderMethod; minutesBefore: number }>;

  // TODO: Integrations
  @Prop()
  googleEventId?: string;

  @Prop({ default: true })
  isPrivate?: boolean;

  @Prop([
    {
      user: { type: Types.ObjectId, ref: "User" },
      role: { type: String, enum: EEventRole },
      status: {
        type: String,
        enum: EEventInviteStatus,
        default: EEventInviteStatus.PENDING
      },
      email: String // For invitations to users not yet registered
    }
  ])
  members: Array<{
    user?: Types.ObjectId;
    role: EEventRole;
    status: string;
    email?: string;
  }>;
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.set("strict", true);
EventSchema.index({ start: 1, end: 1 });
