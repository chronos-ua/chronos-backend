import { Controller, Get, Patch, Param } from "@nestjs/common";
import { UsersService } from "./users.service";
import { Session } from "@thallesp/nestjs-better-auth";
import type { IUserSession } from "../auth/auth.interfaces";
import { IUserSettings, IUserSettingsBoolean } from "./schemas/user.schema";
import { ToggleSettingUserDto } from "./dto/toggle-setting-user.dto";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get(":id")
  findOne(@Param("id") id: string) {
    // return this.usersService.findOne(+id);
  }

  @Get("/settings")
  getSettings(@Session() session: IUserSession) {
    return this.usersService.getSettings(session.user.id);
  }

  @Patch("/settings/toggle/:setting")
  async toggleSetting(
    @Param("setting") setting: keyof IUserSettingsBoolean,
    @Session() session: IUserSession
  ) {
    const dto = plainToInstance(ToggleSettingUserDto, { setting });
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw errors;
    }

    return this.usersService.toggleSetting(setting, session.user.id);
  }

  @Patch("/settings/set/:setting/:value")
  updateSetting(
    @Param("setting") setting: keyof IUserSettings,
    @Param("value") value: string,
    @Session() session: IUserSession
  ) {
    // TODO: dto validation
    return this.usersService.updateSetting(setting, value, session.user.id);
  }
}
