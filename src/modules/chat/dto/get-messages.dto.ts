import { IsEnum, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { EChatContext } from "../schemas/chatMessage.schema";

export class GetMessagesDto {
  @ApiProperty()
  @Length(24, 24)
  @Transform(({ value }) => value?.trim())
  @IsString()
  contextId: string;

  @ApiProperty({ enum: EChatContext })
  @IsEnum(EChatContext)
  @IsString()
  contextType: EChatContext;
}
