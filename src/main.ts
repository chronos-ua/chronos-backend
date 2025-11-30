import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { UwsSocketIoAdapter } from "./common/adapters/socket.adapter";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Logger, NestApplicationOptions } from "@nestjs/common";
import express from "express";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const NestOptions: NestApplicationOptions = {};

  if (process.env.NODE_ENV !== "production") {
    logger.log("Running in development mode");
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
    : ["http://localhost:3000", "http://127.0.0.1:3000"];

  if (process.env.BASE_URL && !origins.includes(process.env.BASE_URL)) {
    origins.push(process.env.BASE_URL);
  }

  logger.log(`CORS origins: ${origins.join(", ")}`);

  app.enableCors({
    origin: origins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  });

  app.useWebSocketAdapter(new UwsSocketIoAdapter(app));

  const port = process.env.HTTP_PORT || 3000;

  await app.listen(port, "0.0.0.0", () => {
    logger.log(`Listening on port ${port}`);
  });
}

bootstrap();
