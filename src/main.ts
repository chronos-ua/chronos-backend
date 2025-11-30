import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { UwsSocketIoAdapter } from "./common/adapters/socket.adapter";
import { ExpressAdapter } from "@nestjs/platform-express";
import { NestApplicationOptions } from "@nestjs/common";
import express from "express";

async function bootstrap() {
  const NestOptions: NestApplicationOptions = {};

  if (process.env.NODE_ENV !== "production") {
    NestOptions["logger"] = ["error", "warn", "log", "debug", "verbose"];
  }

  NestOptions["bodyParser"] = false;

  // const expressApp = express();
  // const adapter = new ExpressAdapter(expressApp) as AbstractHttpAdapter;

  const app = await NestFactory.create(
    AppModule,
    // adapter,
    NestOptions
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
