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
    origin: "*",
    credentials: true
  },
  namespace: "chat"
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);

  afterInit(server: Server) {
    this.logger.log("ChatGateway initialized");
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("echo")
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any
  ): string {
    this.logger.log(`Received message: ${data}`);
    return data;
  }
}
