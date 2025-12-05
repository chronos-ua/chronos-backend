import { Module } from "@nestjs/common";
import nodemailer from "nodemailer";
import { GoogleModule } from "../google/google.module";
import { GoogleAuthService } from "../google/google.service";
import { GOOGLE_MAIL_SCOPE } from "../google/google.constants";
import { EmailService, EMAIL_TRANSPORTER } from "./email.service";

const buildOauthTransport = async (
  googleAuthService: GoogleAuthService
): Promise<nodemailer.Transporter | null> => {
  const user = process.env.SMTP_EMAIL;

  if (!user || !googleAuthService.isConfigured()) {
    return null;
  }

  const oauthConfig = googleAuthService.getConfigOrThrow();
  const accessToken = await googleAuthService.getAccessToken([
    GOOGLE_MAIL_SCOPE
  ]);

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user,
      clientId: oauthConfig.clientId,
      clientSecret: oauthConfig.clientSecret,
      refreshToken: oauthConfig.refreshToken,
      accessToken
    }
  });
};

const emailTransporterProvider = {
  provide: EMAIL_TRANSPORTER,
  useFactory: async (googleAuthService: GoogleAuthService) => {
    const transporter = await buildOauthTransport(googleAuthService);

    if (!transporter) {
      throw new Error("Email transporter is not configured");
    }

    try {
      await transporter.verify();
    } catch {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Email transporter verification failed");
      } else {
        throw new Error("Failed to verify email transporter");
      }
    }

    return transporter;
  },
  inject: [GoogleAuthService]
};

@Module({
  imports: [GoogleModule],
  providers: [emailTransporterProvider, EmailService],
  exports: [EmailService]
})
export class EmailModule {}
