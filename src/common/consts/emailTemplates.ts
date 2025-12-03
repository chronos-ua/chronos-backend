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
  }
};

export { EMAIL_TEMPLATES };
