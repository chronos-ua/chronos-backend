import { IsAscii, IsString, Length } from "class-validator";

export class CalendarIdDto {
  @Length(24, 24)
  @IsAscii()
  @IsString()
  calendarId: string;
}
