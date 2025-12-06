import { IsEmail, IsEnum, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { EEventRole } from "../schemas/event.schema";

export class InviteMemberDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  @Length(5, 255)
  @IsString()
  email: string;

  @ApiProperty({ enum: EEventRole })
  @IsEnum(EEventRole)
  @IsString()
  role: EEventRole;
}
