import { IsAscii, IsString, Length } from "class-validator";

export class TransferOwnershipParamsDto {
  @Length(24, 24)
  @IsAscii()
  @IsString()
  calendarId: string;

  @Length(24, 24)
  @IsAscii()
  @IsString()
  newOwnerId: string;
}
