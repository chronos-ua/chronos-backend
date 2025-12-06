import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsString, Length } from "class-validator";

export class CloneEventDto {
  @ApiProperty()
  @Length(24, 24)
  @Transform(({ value }) => value.trim())
  @IsString()
  eventId: string;

  @ApiProperty()
  @Length(24, 24)
  @Transform(({ value }) => value.trim())
  @IsString()
  targetCalendarId: string;
}
