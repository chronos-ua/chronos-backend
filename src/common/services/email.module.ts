import { Module } from "@nestjs/common";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { EmailService, EMAIL_TRANSPORTER } from "./email.service";

const buildOauthTransport = async () => {
  const clientId = process.env.SMTP_CLIENT_ID;
  const clientSecret = process.env.SMTP_CLIENT_SECRET;
  const refreshToken = process.env.SMTP_REFRESH_TOKEN;
  const user = process.env.SMTP_EMAIL;

  if (!clientId || !clientSecret || !refreshToken || !user) {
    return null;
  }

  const OAuth2 = google.auth.OAuth2;
  const oauth2Client = new OAuth2(
    clientId,
    clientSecret,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // const { token: accessToken } = await oauth2Client.getAccessToken();

  const accessToken = await new Promise<string | undefined | null>(
    (resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          console.error(err);
          reject("Failed to create access token :(");
        }
        resolve(token);
      });
    }
  );

  console.log("\n\n\n" + accessToken + "\n\n\n");

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user,
      clientId,
      clientSecret,
      refreshToken,
      accessToken: accessToken ?? undefined
    }
  });
};

const buildSmtpTransport = async () => {
  const port = Number(process.env.EMAIL_PORT ?? 587);
  const secure =
    process.env.EMAIL_SECURE === "true" || process.env.EMAIL_SECURE === "1"
      ? true
      : port === 465;

  const authConfigured =
    process.env.EMAIL_ID && process.env.EMAIL_PASS
      ? {
          user: process.env.EMAIL_ID,
          pass: process.env.EMAIL_PASS
        }
      : undefined;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    auth: authConfigured
  });
};

const emailTransporterProvider = {
  provide: EMAIL_TRANSPORTER,
  useFactory: async () => {
    const transporter =
      (await buildOauthTransport()) ?? (await buildSmtpTransport());

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
  }
};

@Module({
  providers: [emailTransporterProvider, EmailService],
  exports: [EmailService]
})
export class EmailModule {}
