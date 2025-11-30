import { applyDecorators } from "@nestjs/common";

export const DevOnly = (
  ...decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[]
) => {
  return process.env.NODE_ENV !== "production"
    ? applyDecorators(...decorators)
    : applyDecorators();
};
