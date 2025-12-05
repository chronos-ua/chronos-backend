import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export enum EEventType {
  ARRANGEMENT = "arrangement",
  TASK = "task",
  REMINDER = "reminder",
  EVENT = "event"
}

export enum EReminderMethod {
  EMAIL = "email",
  PUSH = "push",
  TELEGRAM = "telegram"
}

export type IEventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true, collection: "event" })
export class Event {
  @Prop({ required: true, type: Types.ObjectId, ref: "Calendar", index: true })
  calendarId: Types.ObjectId;

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
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.set("strict", true);
