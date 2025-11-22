import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { UwsSocketIoAdapter } from "./common/adapters/socket.adapter";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  app.useWebSocketAdapter(new UwsSocketIoAdapter(app));

  // TODO: cors?
  //   app.enableCors();

  await app.listen(3000, "0.0.0.0");
}

bootstrap();
