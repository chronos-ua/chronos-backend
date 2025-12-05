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

export class GetMessagesResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  contextId: string;

  @ApiProperty({ enum: EChatContext })
  contextType: EChatContext;

  @ApiProperty({ type: String })
  senderId: string;

  @ApiProperty({ type: String })
  content: string;

  @ApiProperty({ type: [String] })
  readBy: string[];

  @ApiProperty({ type: String, format: "date-time" })
  createdAt: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt: Date;
}
