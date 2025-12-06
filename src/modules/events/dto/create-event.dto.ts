import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length
} from "class-validator";
import { EEventType, EReminderMethod } from "../schemas/event.schema";
import { ApiProperty } from "@nestjs/swagger";

export class CreateEventDto {
  @ApiProperty()
  @Length(1, 255)
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  customId?: string;

  @ApiProperty()
  @Length(1, 255)
  @Transform(({ value }) => value.trim())
  @IsString()
  title: string;

  @ApiProperty()
  @Length(0, 1024)
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsEnum(EEventType)
  @IsString()
  @IsOptional()
  type: EEventType = EEventType.ARRANGEMENT;

  @ApiProperty()
  @IsDateString()
  start: Date;

  @ApiProperty()
  @IsDateString()
  end: Date;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isAllDay: boolean = false;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isOutdoor: boolean = false;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isCompleted: boolean = false;

  @ApiProperty()
  @Length(0, 512)
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty()
  @Length(0, 2048)
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  externalUrl?: string;

  @ApiProperty()
  @Length(0, 2048)
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty()
  @IsOptional()
  reminders?: Array<{ method: EReminderMethod; minutesBefore: number }>;

  @ApiProperty()
  @Length(0, 255)
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  googleEventId?: string;
}
