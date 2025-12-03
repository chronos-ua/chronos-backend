import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  Length
} from "class-validator";

export class CreateCalendarDto {
  @ApiProperty({
    description: "The title of the calendar",
    minLength: 1,
    maxLength: 69
  })
  @Length(1, 69)
  @IsString()
  title: string;

  @ApiProperty({
    description: "The description of the calendar",
    minLength: 1,
    maxLength: 255,
    required: false
  })
  @Length(1, 255)
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    description: "The color of the calendar in HEX format",
    example: "#4F46E5",
    required: false
  })
  @IsHexColor()
  @IsOptional()
  color: string;

  @ApiProperty({
    description: "Whether the calendar is private",
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isPrivate: boolean;
}
