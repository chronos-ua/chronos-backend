import { applyDecorators } from "@nestjs/common";
import { DEV } from "../consts/env";

export const DevOnly = (
  ...decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[]
) => {
  return DEV ? applyDecorators(...decorators) : applyDecorators();
};
