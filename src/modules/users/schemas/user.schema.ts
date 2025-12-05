import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { BooleanKeys } from "src/common/utils/booleanKeys.util";

export type IUserSettings = typeof User.prototype.preferences;
export type IUserSettingsBoolean = Pick<
  IUserSettings,
  BooleanKeys<IUserSettings>
>;
export type IUserDocument = HydratedDocument<User>;

export const USER_SETTINGS_BOOLEAN_KEYS = Object.freeze([
  "emailNotifications",
  "telegramNotifications"
] satisfies (keyof IUserSettingsBoolean)[]);

@Schema({ timestamps: true, collection: "user" })
export class User {
  // Better Auth fields
  // https://www.better-auth.com/docs/concepts/database#user

  @Prop()
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  emailVerified: boolean;

  @Prop()
  image?: string;

  // --- Custom fields ---

  @Prop({
    type: Object,
    default: {
      region: "UA",
      startOfWeek: "monday",
      timeFormat: "24h",
      telegramNotifications: false,
      emailNotifications: false,
      allowInvites: true
    }
  })
  preferences: {
    city: string;
    region: string;
    startOfWeek: "monday" | "sunday";
    timeFormat: "12h" | "24h";
    telegramNotifications: boolean;
    emailNotifications: boolean;
    allowInvites: boolean;
  };

  @Prop()
  telegramChatId?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: "Calendar" }], default: [] })
  subscriptions: Types.ObjectId[];

  // @Prop({ type: String, ref: "Company" })
  // companyId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set("strict", true);
