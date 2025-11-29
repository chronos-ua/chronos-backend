import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class RequestsLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestsLogMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, headers, body } = req;
    this.logger.log(`Incoming Request: ${method} ${originalUrl}`);
    this.logger.debug(`Headers: ${JSON.stringify(headers)}`);
    this.logger.debug(`Body: ${JSON.stringify(body)}`);

    // Log response details after the request is handled
    res.on("finish", () => {
      const { statusCode } = res;
      this.logger.log(
        `Outgoing Response: ${method} ${originalUrl} - Status: ${statusCode}`
      );
    });

    next();
  }
}
