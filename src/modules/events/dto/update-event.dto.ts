import { PartialType } from "@nestjs/mapped-types";
import { CreateEventDto } from "./create-event.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiProperty()
  @Length(24, 24)
  @Transform(({ value }) => value.trim())
  @IsString()
  calendarId: string;
}
