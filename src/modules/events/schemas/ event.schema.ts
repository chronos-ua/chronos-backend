import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export enum EventType {
  ARRANGEMENT = "arrangement",
  TASK = "task",
  REMINDER = "reminder"
}

export type IEventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, type: Types.ObjectId, ref: "Calendar", index: true })
  calendarId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String, enum: EventType, default: EventType.ARRANGEMENT })
  type: EventType;

  @Prop({ required: true })
  /** UTC */
  start: Date;

  @Prop({ required: true })
  /** UTC */
  end: Date;

  @Prop({ default: false })
  isAllDay: boolean;

  // Task specific
  @Prop({ default: false })
  isCompleted?: boolean;

  @Prop()
  /** Phisical location or URL */
  location?: string;

  @Prop([
    {
      method: { type: String, enum: ["email", "push", "telegram"] },
      minutesBefore: Number
    }
  ])
  reminders: Array<{ method: string; minutesBefore: number }>;

  // TODO: Integrations
  // @Prop()
  // googleEventId?: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
