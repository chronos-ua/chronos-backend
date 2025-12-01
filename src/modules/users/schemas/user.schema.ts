import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class User extends Document {
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

  @Prop()
  city?: string;

  @Prop({
    type: Object,
    default: {
      region: "UA",
      startOfWeek: "monday",
      timeFormat: "24h",
      telegramNotifications: false,
      emailNotifications: false
    }
  })
  preferences: {
    region: string;
    startOfWeek: "monday" | "sunday";
    timeFormat: "12h" | "24h";
    telegramNotifications: boolean;
    emailNotifications: boolean;
  };

  @Prop()
  telegramChatId?: string;

  // @Prop({ type: String, ref: "Company" })
  // companyId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
