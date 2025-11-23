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
    new FastifyAdapter(),
    { bodyParser: false }
  );

  app.useWebSocketAdapter(new UwsSocketIoAdapter(app));

  // TODO: cors?
  //   app.enableCors();
  const port = process.env.HTTP_PORT || 3000;

  await app.listen(port, "0.0.0.0", () => {
    console.log(`Listening on port ${port}`);
  });
}

bootstrap();
