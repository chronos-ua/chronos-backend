import { Logger, UseGuards } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { DevOnly } from "src/common/decorators/devOnly.decorator";
import { ChatService } from "./chat.service";
import { EChatContext } from "./schemas/chatMessage.schema";
import {
  AllowAnonymous,
  AuthGuard,
  Session
} from "@thallesp/nestjs-better-auth";
import type { IUserSession } from "../auth/auth.interfaces";
import { DEV } from "src/common/consts/env";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : "*",
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
    DEV && this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    DEV && this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("echo")
  @AllowAnonymous()
  handleEcho(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.logger.log(`Received message: ${data}`);
    client.emit("echo", data);
  }

  @SubscribeMessage("join")
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; context: EChatContext },
    @Session() session: IUserSession
  ) {
    if (
      typeof payload !== "object" ||
      !payload.room ||
      typeof payload.room !== "string" ||
      payload.room.length !== 24
    )
      return;
    if (
      !(await this.chatService.isAllowedToAccess(
        payload.room,
        payload.context,
        session.user.id
      ))
    )
      return;

    client.join(payload.room.trim());
    DEV && this.logger.log(`Client ${client.id} joined room ${payload.room}`);
  }

  @SubscribeMessage("leave")
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string
  ) {
    client.leave(room);
    DEV && this.logger.log(`Client ${client.id} left room ${room}`);
  }

  @SubscribeMessage("message")
  handleRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; message: string },
    @Session() session: IUserSession
  ) {
    if (typeof payload !== "object" || !payload.room || !payload.message)
      throw new WsException("Invalid message payload");

    if (!client.rooms.has(payload.room))
      throw new WsException("You are not in this room");

    client.to(payload.room).emit("message", {
      sender: {
        id: session.user.id,
        name: session.user.name,
        room: payload.room
      },
      message: payload.message
    });

    DEV &&
      this.logger.log(
        `Client ${client.id} sent msg ${payload.room}: ${payload.message}`
      );
  }
}
