import { Injectable } from "@nestjs/common";
import { Auth, google } from "googleapis";

type GoogleAuthConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
};

@Injectable()
export class GoogleAuthService {
  private readonly config: GoogleAuthConfig | null;

  constructor() {
    this.config = this.loadConfig();
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  getConfigOrThrow(): GoogleAuthConfig {
    if (!this.config) {
      throw new Error("Google OAuth credentials are not configured");
    }
    const isPlaceholder =
      this.config.clientId === "your_google_client_id" ||
      this.config.clientSecret === "your_google_client_secret";
    if (isPlaceholder) {
      throw new Error(
        "Google OAuth credentials look like placeholders. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET (or SMTP_CLIENT_ID/SMTP_CLIENT_SECRET) to real values that match the refresh token."
      );
    }
    return this.config;
  }

  createOAuthClient(scopes?: string[]): Auth.OAuth2Client {
    const cfg = this.getConfigOrThrow();

    const client = new google.auth.OAuth2(
      cfg.clientId,
      cfg.clientSecret,
      cfg.redirectUri
    );

    client.setCredentials({
      refresh_token: cfg.refreshToken,
      scope: scopes?.length ? scopes.join(" ") : undefined
    });

    return client;
  }

  async getAccessToken(scopes?: string[]): Promise<string> {
    const client = this.createOAuthClient(scopes);
    const { token } = await client.getAccessToken();

    if (!token) {
      throw new Error("Failed to obtain Google access token");
    }

    return token;
  }

  private loadConfig(): GoogleAuthConfig | null {
    const clientId = process.env.SMTP_CLIENT_ID;
    const clientSecret = process.env.SMTP_CLIENT_SECRET;
    const refreshToken = process.env.SMTP_REFRESH_TOKEN;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ??
      process.env.SMTP_REDIRECT_URI ??
      "https://developers.google.com/oauthplayground";

    if (!clientId || !clientSecret || !refreshToken) {
      return null;
    }

    return { clientId, clientSecret, refreshToken, redirectUri };
  }
}
