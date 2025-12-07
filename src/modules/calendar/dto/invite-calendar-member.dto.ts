import { IsEmail, IsEnum, IsString, Length } from "class-validator";
import { ECalendarRole } from "../schemas/calendar.schema";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class InviteCalendarMemberDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  @Length(5, 255)
  @IsString()
  email: string;

  @ApiProperty({ enum: ECalendarRole })
  @IsEnum(ECalendarRole)
  @IsString()
  role: ECalendarRole;
}
