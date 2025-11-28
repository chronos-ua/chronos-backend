import { InternalServerErrorException } from "@nestjs/common";

// TODO: Use HttpException?
// https://docs.nestjs.com/exception-filters

class InternalServerError extends InternalServerErrorException {
  constructor(message: string) {
    super(message);
  }
}

export { InternalServerError };
