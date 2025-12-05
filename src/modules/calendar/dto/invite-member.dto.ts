import { IsEmail, IsEnum, IsString, Length } from "class-validator";
import { ECalendarRole } from "../schemas/calendar.schema";

export class InviteMemberDto {
  @IsEmail()
  @Length(5, 255)
  @IsString()
  email: string;

  @IsEnum(ECalendarRole)
  @IsString()
  role: ECalendarRole;
}
