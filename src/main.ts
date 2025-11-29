import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { UwsSocketIoAdapter } from "./common/adapters/socket.adapter";
import {
  ExpressAdapter,
  NestExpressApplication
} from "@nestjs/platform-express";
import express from "ultimate-express";
import { NestApplicationOptions } from "@nestjs/common";

async function bootstrap() {
  const NestOptions: NestApplicationOptions = {};

  NestOptions["bodyParser"] = false;
  if (process.env.NODE_ENV !== "production") {
    NestOptions["logger"] = ["error", "warn", "log", "debug", "verbose"];
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(express()),
    { bodyParser: false }
  );

  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["*"];

  if (process.env.BASE_URL && !origins.includes(process.env.BASE_URL)) {
    origins.push(process.env.BASE_URL);
  }

  app.enableCors({
    origin: origins,
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
