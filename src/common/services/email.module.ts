import { Module } from "@nestjs/common";
import nodemailer from "nodemailer";
import { EmailService, EMAIL_TRANSPORTER } from "./email.service";

const emailTransporterProvider = {
  provide: EMAIL_TRANSPORTER,
  useFactory: async () => {
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

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure,
      auth: authConfigured
    });

    try {
      await transporter.verify();
    } catch {
      // Best effort verification, surface actual failure on first send attempt
    }

    return transporter;
  }
};

@Module({
  providers: [emailTransporterProvider, EmailService],
  exports: [EmailService]
})
export class EmailModule {}
