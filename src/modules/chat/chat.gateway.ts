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
import { AuthService } from "@thallesp/nestjs-better-auth";
import type { IUserSession } from "../auth/auth.interfaces";
import { DEV } from "src/common/consts/env";
import { fromNodeHeaders } from "better-auth/node";

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
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService
  ) {}
  private readonly logger = new Logger(ChatGateway.name);

  private hasValidSession(session?: IUserSession): session is IUserSession {
    return Boolean(session?.user?.id);
  }

  afterInit(server: Server) {
    this.chatService.setServer(server);
    this.logger.log("ChatGateway initialized");
  }

  async handleConnection(
    @ConnectedSocket() client: Socket,
    @Session() session?: IUserSession
  ) {
    const cookies = client.handshake?.headers?.cookie;

    if (!this.hasValidSession(session)) {
      const resolved = await this.authService.api.getSession({
        headers: fromNodeHeaders(client.handshake?.headers ?? [])
      });
      if (resolved) {
        session = resolved as IUserSession;
        (client as any).session = session;
      }
    }
    if (DEV) {
      this.logger.log(
        `handleConnection client=${client.id} sessionUser=${session?.user?.id ?? "none"} auth=${JSON.stringify(
          client.handshake?.auth ?? {}
        )} origin=${client.handshake?.headers?.origin ?? "unknown"}`
      );
      this.logger.log(`handshake cookies=${cookies ?? "none"}`);
    }

    if (!this.hasValidSession(session)) {
      DEV &&
        this.logger.warn(`Disconnecting client ${client.id}: missing session`);
      client.disconnect(true);
      return;
    }

    this.chatService.handleJoin(session.user.id, client.id);
    DEV && this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.chatService.handleLeave(client.id);
    DEV && this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("echo")
  @AllowAnonymous()
  handleEcho(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    if (!DEV) return;
    this.logger.log(`Received message: ${data}`);
    client.emit("echo", data);
  }

  @SubscribeMessage("join")
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; context: EChatContext },
    @Session() session?: IUserSession
  ) {
    if (!this.hasValidSession(session)) {
      DEV &&
        this.logger.warn(`Join rejected for ${client.id}: missing session`);
      client.disconnect(true);
      throw new WsException("Unauthorized");
    }

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
  async handleRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; message: string },
    @Session() session?: IUserSession
  ) {
    if (!this.hasValidSession(session)) {
      DEV &&
        this.logger.warn(`Message rejected for ${client.id}: missing session`);
      client.disconnect(true);
      throw new WsException("Unauthorized");
    }

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

    await this.chatService.handleMessage(
      payload.room,
      EChatContext.CALENDAR,
      session.user.id,
      payload.message
    );

    DEV &&
      this.logger.log(
        `Client ${client.id} sent msg ${payload.room}: ${payload.message}`
      );
  }
}
