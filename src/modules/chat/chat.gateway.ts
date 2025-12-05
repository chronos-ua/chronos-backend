import { Logger, UseGuards } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { DevOnly } from "src/common/decorators/devOnly.decorator";
import { ChatService } from "./chat.service";
import { EChatContext } from "./schemas/chatMessage.schema";
import { AuthGuard } from "@thallesp/nestjs-better-auth";

@WebSocketGateway({
  cors: {
    origin: "*",
    credentials: true
  }
})
@UseGuards(AuthGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly chatService: ChatService) {}
  private readonly logger = new Logger(ChatGateway.name);

  afterInit(server: Server) {
    this.logger.log("ChatGateway initialized");
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    if (process.env.NODE_ENV === "development") {
      this.logger.log(`Client connected: ${client.id}`);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    if (process.env.NODE_ENV === "development") {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage("echo")
  handleEcho(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.logger.log(`Received message: ${data}`);
    client.emit("echo", data);
  }

  @SubscribeMessage("join")
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string
  ) {
    if (!room || typeof room !== "string" || room.length !== 24) return;
    if (
      !(await this.chatService.isAllowedToAccess(
        room,
        EChatContext.CALENDAR, // Currently only calendar context is supported
        client.id
      ))
    )
      return;

    client.join(room.trim());
    if (process.env.NODE_ENV === "development") {
      this.logger.log(`Client ${client.id} joined room ${room}`);
    }
  }

  @SubscribeMessage("leave")
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string
  ) {
    client.leave(room);
    if (process.env.NODE_ENV === "development") {
      this.logger.log(`Client ${client.id} left room ${room}`);
    }
  }

  @SubscribeMessage("message")
  handleRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; message: string }
  ) {
    if (typeof payload !== "object" || !payload.room || !payload.message)
      throw new Error("Invalid message payload");

    if (!client.rooms.has(payload.room)) {
      throw new Error("Client is not a member of the specified room");
    }

    client.to(payload.room).emit("message", {
      sender: client.id,
      message: payload.message
    });

    if (process.env.NODE_ENV === "development") {
      this.logger.log(
        `Client ${client.id} sent message to room ${payload.room}: ${payload.message}`
      );
    }
  }
}
