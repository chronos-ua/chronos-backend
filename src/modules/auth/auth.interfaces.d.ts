import { UserSession } from "@thallesp/nestjs-better-auth";

export type IUserSession = UserSession & {
  user: {
    city?: string;
  };
};
