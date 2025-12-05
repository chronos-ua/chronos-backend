import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger
} from "@nestjs/common";
import nodemailer from "nodemailer";
import { EMAIL_TEMPLATES } from "../consts/emailTemplates.js";
import { Calendar } from "src/modules/calendar/schemas/calendar.schema.js";

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

    await this.send(mailOptions, this.sendPasswordResetEmail.name);
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

    await this.send(mailOptions, this.sendEmailVerification.name);
  }

  public async sendPwnedPasswordAlert(email: string, count: number) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.sender,
      to: email,
      subject: "Pwned Password Alert",
      html: EMAIL_TEMPLATES.pwnedPasswordAlert(count)
    };

    await this.send(mailOptions, this.sendPwnedPasswordAlert.name);
  }

  public async sendMagicLink(email: string, url: string, token: string) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.sender,
      to: email,
      subject: "Magic Link Sign-In",
      html: EMAIL_TEMPLATES.magicLink(url)
    };
    await this.send(mailOptions, this.sendMagicLink.name);
  }

  public async sendCalendarInvite(email: string, calendar: Calendar) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.sender,
      to: email,
      subject: `You're invited to join the calendar "${calendar.title}"`,
      html: EMAIL_TEMPLATES.calendarInvite(calendar)
    };
    await this.send(mailOptions, this.sendCalendarInvite.name);
  }

  public async sendOTP(email: string, otp: string) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.sender,
      to: email,
      subject: "Your One-Time Password (OTP)",
      html: EMAIL_TEMPLATES.otp(otp)
    };
    await this.send(mailOptions, this.sendOTP.name);
  }

  private async send(opt: nodemailer.SendMailOptions, caller: string) {
    try {
      await this.transporter.sendMail(opt);
    } catch (error) {
      this.logger.error(
        `Error in ${caller} while sending email to ${opt.to}: ${error}`
      );
      throw new InternalServerErrorException(`Failed to send email`);
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
