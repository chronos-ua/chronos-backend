import { PartialType } from "@nestjs/mapped-types";
import { CreateCalendarDto } from "./create-calendar.dto";
import {
  IsBoolean,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  Length
} from "class-validator";

export class UpdateCalendarDto extends PartialType(CreateCalendarDto) {
  @Length(1, 32)
  @IsString()
  @IsOptional()
  customId: string;

  @IsISO31661Alpha2()
  @IsString()
  @IsOptional()
  holidaysCountryCode: string;

  @IsBoolean()
  @IsOptional()
  isHolidaysEnabled: boolean;
}
