import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { UwsSocketIoAdapter } from "./common/adapters/socket.adapter";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Logger, NestApplicationOptions, ValidationPipe } from "@nestjs/common";
import express from "express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";
import { IoAdapter } from "@nestjs/platform-socket.io";

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

  app.setGlobalPrefix("api");

  app.useGlobalPipes(new ValidationPipe({}));

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

  app.useWebSocketAdapter(new IoAdapter(app));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Huh?")
    .addCookieAuth("apiKeyCookie")
    .setExternalDoc("AUTH reference", "/api/auth/reference")
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api", app, documentFactory, {
    customCss: new SwaggerTheme().getBuffer(SwaggerThemeNameEnum.GRUVBOX),
    swaggerOptions: {
      persistAuthorization: true
    }
  });

  const port = process.env.HTTP_PORT || 3000;

  await app.listen(port, "0.0.0.0", () => {
    logger.log(`Listening on port ${port}`);
  });
}

bootstrap();
