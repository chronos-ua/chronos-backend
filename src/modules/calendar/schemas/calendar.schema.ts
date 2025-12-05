import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export enum ECalendarRole {
  OWNER = "owner",
  EDITOR = "editor",
  READER = "reader"
}

export enum ECalendarInviteStatus {
  PENDING = "pending",
  ACCEPTED = "accepted"
}

export type ICalendarDocument = HydratedDocument<Calendar>;

@Schema({ timestamps: true, collection: "calendar" })
export class Calendar {
  @Prop({ required: true })
  title: string;

  // TODO: premium feature?
  @Prop()
  customId?: string;

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

  @Prop({ required: true, index: true, type: Types.ObjectId, ref: "User" })
  owner: Types.ObjectId;

  @Prop()
  holidaysCountryCode?: string;

  @Prop()
  isHolidaysEnabled?: boolean;

  @Prop([
    {
      user: { type: Types.ObjectId, ref: "User" },
      role: { type: String, enum: ECalendarRole },
      status: {
        type: String,
        enum: ECalendarInviteStatus,
        default: ECalendarInviteStatus.PENDING
      },
      email: String // For invitations to users not yet registered
    }
  ])
  members: Array<{
    user?: Types.ObjectId;
    role: ECalendarRole;
    status: string;
    email?: string;
  }>;
}

export const CalendarSchema = SchemaFactory.createForClass(Calendar);
CalendarSchema.set("strict", true);
