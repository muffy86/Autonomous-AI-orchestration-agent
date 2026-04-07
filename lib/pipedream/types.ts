export interface PipedreamConnectTokenRequest {
  externalUserId: string;
  expiresIn?: number;
  scope?: string;
  allowedOrigins?: string[];
  errorRedirectUri?: string;
}

export interface PipedreamConnectTokenResponse {
  token: string;
  expiresAt: string;
  connectLinkUrl: string;
}

export interface PipedreamCredentials {
  clientId: string;
  clientSecret: string;
  projectId: string;
  environment: "development" | "production";
}
