import { Logger } from "@nestjs/common";
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

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : ["http://localhost:3000", "http://localhost:3000"],
    credentials: true
  }
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
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
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string
  ) {
    if (!room || typeof room !== "string") return;
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
