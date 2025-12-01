import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User, USER_SETTINGS_BOOLEAN_KEYS } from "./schemas/user.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class UsersService {
  constructor(@InjectModel("User") private userModel: Model<User>) {}
  create(createUserDto: CreateUserDto) {
    return "This action adds a new user";
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
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
}
