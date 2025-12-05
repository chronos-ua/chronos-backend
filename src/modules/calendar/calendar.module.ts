import { Module } from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { CalendarController } from "./calendar.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { CalendarSchema } from "./schemas/calendar.schema";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Calendar", schema: CalendarSchema }]),
    UsersModule
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService]
})
export class CalendarModule {}
