import { Injectable } from "@nestjs/common";
import {
  IUserSettings,
  User,
  USER_SETTINGS_BOOLEAN_KEYS
} from "./schemas/user.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class UsersService {
  constructor(@InjectModel("User") private userModel: Model<User>) {}
  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: string) {
    return await this.userModel.findById(id).lean().exec();
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async getSettings(userId: string) {
    return await this.userModel
      .findById(userId)
      .select("preferences -_id")
      .lean()
      .exec();
  }

  async toggleSetting(
    setting: (typeof USER_SETTINGS_BOOLEAN_KEYS)[number],
    userId: string
  ) {
    return await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { [`settings.${setting}`]: { $not: `$settings.${setting}` } } },
      { new: true }
    );
  }

  async updateSetting(
    setting: keyof IUserSettings,
    value: unknown,
    userId: string
  ) {
    return await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { [`settings.${setting}`]: value } },
        { new: true }
      )
      .lean()
      .exec();
  }
}
