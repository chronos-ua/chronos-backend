import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  Length
} from "class-validator";

export class CreateCalendarDto {
  @Length(1, 69)
  @IsString()
  title: string;

  @Length(1, 255)
  @IsString()
  @IsOptional()
  description: string;

  @IsHexColor()
  @IsOptional()
  color: string;

  @IsBoolean()
  @IsOptional()
  isPrivate: boolean;
}
