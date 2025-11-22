import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions, Server } from "socket.io";
import { App, TemplatedApp } from "uWebSockets.js";

export class UwsSocketIoAdapter extends IoAdapter {
  private readonly wsPort = 3001;

  createIOServer(port: number, options?: ServerOptions): Server {
    const uwsApp: TemplatedApp = App();

    options ??= {} as ServerOptions;

    const server = super.createIOServer(0, {
      ...options,
      cors: {
        origin: "*", // TODO: Configure for prod!
        methods: ["GET", "POST"]
      }
    });

    server.attachApp(uwsApp);

    uwsApp.listen(this.wsPort, (token) => {
      if (token) {
        console.log(`uWebSockets is listening on port ${this.wsPort}`);
      } else {
        console.error(`Failed to listen on port ${this.wsPort}`);
      }
    });

    return server;
  }
}
