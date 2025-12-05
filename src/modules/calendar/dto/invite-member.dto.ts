import { IsEmail, IsEnum, IsString, Length } from "class-validator";
import { ECalendarRole } from "../schemas/calendar.schema";
import { ApiProperty } from "@nestjs/swagger";

export class InviteMemberDto {
  @ApiProperty()
  @IsEmail()
  @Length(5, 255)
  @IsString()
  email: string;

  @ApiProperty({ enum: ECalendarRole })
  @IsEnum(ECalendarRole)
  @IsString()
  role: ECalendarRole;
}
