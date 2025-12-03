import { Inject, Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";
import { EMAIL_TEMPLATES } from "../consts/emailTemplates.js";
import { InternalServerError } from "../consts/errors.js";

export const EMAIL_TRANSPORTER = Symbol("EMAIL_TRANSPORTER");

@Injectable()
class EmailService {
  private readonly sender: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(EMAIL_TRANSPORTER)
    private readonly transporter: nodemailer.Transporter
  ) {
    const senderEmail =
      process.env.EMAIL_FROM ||
      process.env.EMAIL_ID ||
      process.env.SMTP_EMAIL ||
      "user@example.com";
    this.sender = `"Chronos" <${senderEmail}>`;
  }

  public async sendPasswordResetEmail(
    email: string,
    url: string,
    token: string
  ) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.sender,
      to: email,
      subject: "Password Reset",
      // html: EMAIL_TEMPLATES.resetPassword(this.getEmailResetLink(token))
      html: EMAIL_TEMPLATES.resetPassword(url)
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerError("Failed to send password reset email");
    }
  }

  public async sendEmailVerification(
    email: string,
    url: string,
    token: string
  ) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.sender,
      to: email,
      subject: "Email Verification",
      html: EMAIL_TEMPLATES.emailConfirmation(
        // this.getEmailVerificationLink(token)
        url
      )
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerError("Failed to send email verification");
    }
  }

  public async sendPwnedPasswordAlert(email: string, count: number) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.sender,
      to: email,
      subject: "Pwned Password Alert",
      html: EMAIL_TEMPLATES.pwnedPasswordAlert(count)
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerError("Failed to send pwned password alert");
    }
  }

  public async sendMagicLink(email: string, url: string, token: string) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.sender,
      to: email,
      subject: "Magic Link Sign-In",
      html: EMAIL_TEMPLATES.magicLink(url)
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerError("Failed to send magic link email");
    }
  }

  private getEmailResetLink(token: string) {
    return `https://uevent.pp.ua/auth/password-reset/${token}`;
  }

  private getEmailVerificationLink(token: string) {
    return `https://uevent.pp.ua/auth/verify-email/${token}`;
  }
}

export { EmailService };
