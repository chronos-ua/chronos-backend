import { ICalendarWithId } from "src/modules/calendar/calendar.service";

const EMAIL_TEMPLATES = {
  emailConfirmation: (confirmationLink: string) => {
    return `
    <h1>Chronos</h1>
    <br>
    <p>Thank you for registering! Please confirm your email by clicking the link below:</p>
    <a href="${confirmationLink}">${confirmationLink}</a>
    <br>
    <p>If you did not request this email, please ignore it.</p>
    `;
  },
  resetPassword: (confirmationLink: string) => {
    return `
      <h1>Chronos</h1>
      <br>
      <p>To reset your password, click the link below:</p>
      <a href="${confirmationLink}">${confirmationLink}</a>
      <br>
      <p>If you did not request a password reset, please ignore this email.</p>
    `;
  },
  pwnedPasswordAlert: (compromisedCount: number) => {
    return `
      <h1>Chronos</h1>
      <br>
      <p>Our system has detected that your password has appeared in data breaches ${compromisedCount} times.</p>
      <p>For more information and to perform further checks, visit Have I Been Pwned:</p>
      <p><a href="https://haveibeenpwned.com">https://haveibeenpwned.com</a></p>
      <p>To specifically check passwords, see the Pwned Passwords service:</p>
      <p><a href="https://haveibeenpwned.com/Passwords">https://haveibeenpwned.com/Passwords</a></p>
      <p>Please avoid pasting your current password into third‑party sites if you are unsure. Instead, change your password to a strong, unique one and enable multi-factor authentication.</p>
    `;
  },
  magicLink: (magicLink: string) => {
    return `
      <h1>Chronos</h1>
      <br>
      <p>Click the link below to sign in using your magic link:</p>
      <a href="${magicLink}">${magicLink}</a>
      <br>
      <p>If you did not request this email, please ignore it.</p>
    `;
  },
  otp: (otp: string) => {
    return `
    <h1>Chronos</h1>
    <br>
    <p>Your One-Time Password (OTP) is:</p>
    <h2>${otp}</h2>
    <p>This OTP is valid for 5 minutes. If you did not request this, please ignore this email.</p>
    `;
  },

  // notifications

  calendarInvite: (title: string, url: string) => {
    return `
      <h1>Chronos</h1>
      <br>
      <p>You have been invited to join the calendar "<strong>${title}</strong>".</p>
      <br>
      <p>Click the link below to accept the invitation:</p>
      <a href="${url}">${url}</a>
      <br>
      <p>If you did not expect this invitation, please ignore this email.</p>
    `;
  }
};

export { EMAIL_TEMPLATES };
