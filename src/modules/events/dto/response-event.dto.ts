import { ApiProperty } from "@nestjs/swagger";
import { CreateEventDto } from "./create-event.dto";

export class ResponseEventDto extends CreateEventDto {
  @ApiProperty()
  eventId: string;
}
