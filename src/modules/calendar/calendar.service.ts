import { Injectable } from "@nestjs/common";
import { CreateCalendarDto } from "./dto/create-calendar.dto";
import { UpdateCalendarDto } from "./dto/update-calendar.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Calendar } from "./schemas/ calendar.schema";

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel("Calendar") private calendarModel: Model<Calendar>
  ) {}
  async create(ownerId: string, createCalendarDto: CreateCalendarDto) {
    return await this.calendarModel.create({
      owner: new Types.ObjectId(ownerId),
      ...createCalendarDto
    });
  }

  async createDefault(userId: string) {
    await this.calendarModel.create({
      owner: new Types.ObjectId(userId),
      title: "Main",
      isDefault: true
    });
  }

  async findOne(id: string) {
    return await this.calendarModel
      .findById(new Types.ObjectId(id))
      .lean()
      .exec();
  }

  async update(
    ownerId: string,
    calendarId: string,
    updateCalendarDto: UpdateCalendarDto
  ) {
    const calendar = await this.calendarModel
      .findOne({
        _id: new Types.ObjectId(calendarId),
        owner: new Types.ObjectId(ownerId)
      })
      .exec();
    if (!calendar) {
      throw new Error("Calendar not found or you are not the owner");
    }
    Object.assign(calendar, updateCalendarDto);
    return await calendar.save();
  }

  async remove(calendarId: string, ownerId: string) {
    const calendar = await this.calendarModel.findOne({
      _id: new Types.ObjectId(calendarId),
      owner: new Types.ObjectId(ownerId)
    });

    if (!calendar) {
      throw new Error("Calendar not found or you are not the owner");
    }

    if (calendar.isDefault) {
      throw new Error("Cannot delete the main calendar");
    }

    await calendar.deleteOne();
  }

  async transferOwnership(
    calendarId: string,
    newOwnerId: string,
    currentOwnerId: string
  ) {
    const calendar = await this.calendarModel
      .findOne({
        _id: new Types.ObjectId(calendarId),
        owner: new Types.ObjectId(currentOwnerId)
      })
      .exec();
    if (!calendar) {
      throw new Error("Calendar not found or you are not the owner");
    }
    calendar.owner = new Types.ObjectId(newOwnerId);
    await calendar.save();
  }
}
