import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateCalendarDto } from "./dto/create-calendar.dto";
import { UpdateCalendarDto } from "./dto/update-calendar.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Calendar, ECalendarInviteStatus } from "./schemas/ calendar.schema";

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

  async findOne(calendarId: string, userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    return await this.calendarModel
      .findOne({
        _id: new Types.ObjectId(calendarId),
        $or: [
          { owner: userObjectId },
          {
            "members.user": userObjectId
          }
        ]
      })
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

  async acceptInvite(calendarId: string, userId: string, userEmail: string) {
    const calendar = await this.calendarModel
      .findOne({
        $or: [{ _id: new Types.ObjectId(calendarId) }, { customId: calendarId }]
      })
      .exec();

    if (!calendar) throw new NotFoundException();

    if (!calendar.members) calendar.members = [];

    const user = new Types.ObjectId(userId);

    for (let member of calendar.members) {
      if (member.status !== ECalendarInviteStatus.PENDING) continue;
      if (!(member.email === userEmail || member.user?.equals(user))) continue;

      member.status = ECalendarInviteStatus.ACCEPTED;
      await calendar.save();
      return;
    }

    throw new NotFoundException();
  }

  async declineInvite(calendarId: string, userId: string, userEmail: string) {
    const calendar = await this.calendarModel
      .findOne({
        $or: [{ _id: new Types.ObjectId(calendarId) }, { customId: calendarId }]
      })
      .exec();

    if (!calendar) throw new NotFoundException();

    if (!calendar.members) calendar.members = [];

    const user = new Types.ObjectId(userId);

    let member: Calendar["members"][0];
    for (let i = 0; i < calendar.members.length; i++) {
      member = calendar.members[i];
      if (member.status !== ECalendarInviteStatus.PENDING) continue;
      if (!(member.email === userEmail || member.user?.equals(user))) continue;

      calendar.members.splice(i, 1);
      await calendar.save();
      return;
    }

    throw new NotFoundException();
  }
}
