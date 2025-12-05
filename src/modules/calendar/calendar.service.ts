import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { CreateCalendarDto } from "./dto/create-calendar.dto";
import { UpdateCalendarDto } from "./dto/update-calendar.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Document, Model, Types } from "mongoose";
import { Calendar, ECalendarInviteStatus } from "./schemas/ calendar.schema";

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel("Calendar") private calendarModel: Model<Calendar>
  ) {}

  // TODO: contribute fix to mongoose typings
  private findById(
    calendarId: string,
    customId: boolean,
    lean: true
  ): Promise<Calendar | null>;
  private findById(
    calendarId: string,
    customId: boolean,
    lean: false
  ): Promise<(Calendar & Document) | null>;
  private findById(
    calendarId: string,
    customId: boolean,
    lean: boolean
  ): Promise<Calendar | (Calendar & Document) | null> {
    if (customId) {
      return this.calendarModel
        .findOne({
          $or: [
            { customId: calendarId },
            { _id: new Types.ObjectId(calendarId) }
          ]
        })
        .lean(lean)
        .exec() as Promise<Calendar | (Calendar & Document) | null>;
    } else {
      return this.calendarModel
        .findById(new Types.ObjectId(calendarId))
        .lean(lean)
        .exec() as Promise<Calendar | (Calendar & Document) | null>;
    }
  }

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

    const calendar = await this.findById(calendarId, false, true);
    if (!calendar) throw new NotFoundException();
    if (
      !calendar.owner.equals(userObjectId) &&
      !calendar.members?.some((member) => member.user?.equals(userObjectId))
    ) {
      throw new ForbiddenException();
    }

    return calendar;
  }

  async update(
    ownerId: string,
    calendarId: string,
    updateCalendarDto: UpdateCalendarDto
  ) {
    const calendar = await this.findById(calendarId, false, false);
    if (!calendar) throw new NotFoundException();
    if (!calendar.owner.equals(new Types.ObjectId(ownerId)))
      throw new ForbiddenException();
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

      member.user = user; // In case of email-only invitation
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
