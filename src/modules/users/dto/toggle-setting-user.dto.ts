import { IsIn, IsString } from "class-validator";
import { USER_SETTINGS_BOOLEAN_KEYS } from "../schemas/user.schema";
import { ApiProperty } from "@nestjs/swagger";

export class ToggleSettingUserDto {
  @ApiProperty({
    description: "The setting to toggle",
    enum: USER_SETTINGS_BOOLEAN_KEYS
  })
  @IsIn(USER_SETTINGS_BOOLEAN_KEYS)
  @IsString()
  setting: string;
}
