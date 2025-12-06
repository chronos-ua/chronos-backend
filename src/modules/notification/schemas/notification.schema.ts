import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true, collection: "notification" })
export class Notification {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  link: string;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.set("strict", true);
