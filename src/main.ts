import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { UwsSocketIoAdapter } from "./common/adapters/socket.adapter";
import {
  ExpressAdapter,
  NestExpressApplication
} from "@nestjs/platform-express";
import express from "ultimate-express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(express()),
    { bodyParser: false }
  );

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",") || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  });

  app.useWebSocketAdapter(new UwsSocketIoAdapter(app));

  const port = process.env.HTTP_PORT || 3000;

  await app.listen(port, "0.0.0.0", () => {
    console.log(`Listening on port ${port}`);
  });
}

bootstrap();
