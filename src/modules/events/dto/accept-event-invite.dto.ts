import { IsAscii, IsOptional, IsString, Length } from "class-validator";

export class AcceptEventInviteDto {
  @Length(24, 24)
  @IsAscii()
  @IsString()
  id: string;

  @Length(24, 24)
  @IsAscii()
  @IsString()
  @IsOptional()
  calendarId?: string;
}
