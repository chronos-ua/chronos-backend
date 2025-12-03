import { PartialType } from "@nestjs/mapped-types";
import { CreateCalendarDto } from "./create-calendar.dto";
import {
  IsBoolean,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  Length
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateCalendarDto extends PartialType(CreateCalendarDto) {
  @ApiProperty({
    description: "The custom ID of the calendar",
    minLength: 1,
    maxLength: 32,
    required: false
  })
  @Length(1, 32)
  @IsString()
  @IsOptional()
  customId: string;

  @ApiProperty({
    description: "The country code for holidays",
    example: "UK",
    maxLength: 2,
    format: "ISO 3166-1 alpha-2",
    required: false
  })
  @IsISO31661Alpha2()
  @IsString()
  @IsOptional()
  holidaysCountryCode: string;

  @ApiProperty({
    description: "Whether holidays are enabled",
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isHolidaysEnabled: boolean;
}
