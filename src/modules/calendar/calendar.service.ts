import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { CreateCalendarDto } from "./dto/create-calendar.dto";
import { UpdateCalendarDto } from "./dto/update-calendar.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Document, Model, Types } from "mongoose";
import {
  Calendar,
  ECalendarInviteStatus,
  ECalendarRole
} from "./schemas/calendar.schema";
import { IUserSession } from "../auth/auth.interfaces";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { User } from "../users/schemas/user.schema";
import { EmailService } from "src/common/services/email.service";

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel("Calendar") private calendarModel: Model<Calendar>,
    @InjectModel("User") private userModel: Model<User>,
    private readonly emailService: EmailService
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

  async getUserCalendars(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    return await this.calendarModel
      .find({
        $or: [{ owner: userObjectId }, { "members.user": userObjectId }]
      })
      .lean()
      .exec();
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
    const calendar = await this.findById(calendarId, false, false);
    if (!calendar) throw new NotFoundException();
    if (!calendar.owner.equals(new Types.ObjectId(ownerId)))
      throw new ForbiddenException();
    await calendar.deleteOne();
  }

  async transferOwnership(
    calendarId: string,
    newOwnerId: string,
    currentOwnerId: string
  ) {
    const calendar = await this.findById(calendarId, false, false);
    if (!calendar) throw new NotFoundException();
    if (!calendar.owner.equals(new Types.ObjectId(currentOwnerId)))
      throw new ForbiddenException();
    calendar.owner = new Types.ObjectId(newOwnerId);
    await calendar.save();
  }

  async acceptInvite(calendarId: string, userId: string, userEmail: string) {
    const calendar = await this.findById(calendarId, true, false);
    if (!calendar) throw new NotFoundException();
    calendar.members ??= [];
    const user = new Types.ObjectId(userId);

    for (let member of calendar.members) {
      if (member.status !== ECalendarInviteStatus.PENDING) continue;
      if (!(member.email === userEmail || member.user?.equals(user))) continue;
      member.user = user; // In case of email-only invitation
      member.status = ECalendarInviteStatus.ACCEPTED;
      await calendar.save();
      return;
    }

    throw new ForbiddenException();
  }

  async declineInvite(calendarId: string, userId: string, userEmail: string) {
    const calendar = await this.findById(calendarId, true, false);
    if (!calendar) throw new NotFoundException();
    calendar.members ??= [];
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

  async leaveCalendar(calendarId: string, userId: string) {
    const calendar = await this.findById(calendarId, false, false);
    if (!calendar) throw new NotFoundException();
    calendar.members ??= [];
    const userObjectId = new Types.ObjectId(userId);

    for (let i = 0; i < calendar.members.length; i++) {
      if (calendar.members[i].user?.equals(userObjectId)) {
        calendar.members.splice(i, 1);
        await calendar.save();
        break;
      }
    }
  }

  async sendInvite(
    calendarId: string,
    sender: IUserSession,
    dto: InviteMemberDto
  ) {
    if (sender.user.email === dto.email)
      throw new ForbiddenException("Cannot invite yourself");

    const [calendar, user] = await Promise.all([
      this.findById(calendarId, false, false),
      this.userModel.findOne({ email: dto.email })
    ]);
    if (!calendar) throw new NotFoundException("Calendar not found");

    const senderId = new Types.ObjectId(sender.user.id);
    if (!calendar.owner.equals(senderId))
      throw new ForbiddenException("Only owner can send invites");

    calendar.members ??= [];
    if (calendar.members.some((m) => m.email === dto.email))
      throw new ForbiddenException("User already invited");

    const member = { ...dto } as Calendar["members"][0];
    member.status = ECalendarInviteStatus.PENDING;
    user && (member.user = user._id);
    calendar.members.push(member);

    const email =
      user?.preferences.emailNotifications &&
      this.emailService.sendCalendarInvite(dto.email, calendar);
    await Promise.all([calendar.save(), email]);
  }

  async subscribeCalendar(calendarId: string, userId: string) {
    const [calendar, user] = await Promise.all([
      this.findById(calendarId, true, false),
      this.userModel.findById(new Types.ObjectId(userId))
    ]);
    if (!calendar || !user) throw new NotFoundException();

    user.subscriptions ??= [];
    if (user.subscriptions.some((sub) => sub.equals(calendar._id)))
      throw new ForbiddenException("Already subscribed to this calendar");

    user.subscriptions.push(calendar._id);
    await user.save();

    return calendar;
  }

  async unsubscribeCalendar(calendarId: string, userId: string) {
    const [calendar, user] = await Promise.all([
      this.findById(calendarId, true, false),
      this.userModel.findById(new Types.ObjectId(userId))
    ]);
    if (!calendar || !user) throw new NotFoundException();

    user.subscriptions ??= [];
    const index = user.subscriptions.findIndex((sub) =>
      sub.equals(calendar._id)
    );
    if (index === -1) return; // Not subscribed

    user.subscriptions.splice(index, 1);
    await user.save();
  }

  async getSubscriptions(userId: string) {
    const user = await this.userModel
      .findById(new Types.ObjectId(userId))
      .lean()
      .populate("subscriptions")
      .exec();
    if (!user) throw new NotFoundException();

    return user.subscriptions;
  }
}
