import { Injectable } from "@nestjs/common";
import { CreateCalendarDto } from "./dto/create-calendar.dto";
import { UpdateCalendarDto } from "./dto/update-calendar.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Calendar } from "./schemas/ calendar.schema";

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel("Calendar") private calendarModel: Model<Calendar>
  ) {}
  async create(ownerId: string, createCalendarDto: CreateCalendarDto) {
    return await this.calendarModel.create({
      owner: ownerId,
      ...createCalendarDto
    });
  }

  async createDefault(userId: string) {
    await this.calendarModel.create({
      owner: userId,
      title: "Main",
      isDefault: true,
      events: []
    });
  }

  findAll() {
    return `This action returns all calendar`;
  }

  async findOne(id: string) {
    return await this.calendarModel.findById(id).lean().exec();
  }

  update(id: number, updateCalendarDto: UpdateCalendarDto) {
    return `This action updates a #${id} calendar`;
  }

  remove(id: number) {
    return `This action removes a #${id} calendar`;
  }
}
