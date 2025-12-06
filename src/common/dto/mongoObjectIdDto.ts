import { IsAscii, IsString, Length } from "class-validator";

export class MongoObjectIdStringDto {
  @Length(24, 24)
  @IsAscii()
  @IsString()
  id: string;
}
