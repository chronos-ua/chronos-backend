import { IsIn, IsString } from "class-validator";
import { USER_SETTINGS_BOOLEAN_KEYS } from "../schemas/user.schema";

export class ToggleSettingUserDto {
  @IsIn(USER_SETTINGS_BOOLEAN_KEYS)
  @IsString()
  setting: string;
}
