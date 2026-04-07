import { PipedreamClient } from "@pipedream/sdk";

if (!process.env.PIPEDREAM_CLIENT_ID) {
  throw new Error("PIPEDREAM_CLIENT_ID environment variable is required");
}

if (!process.env.PIPEDREAM_CLIENT_SECRET) {
  throw new Error("PIPEDREAM_CLIENT_SECRET environment variable is required");
}

if (!process.env.PIPEDREAM_PROJECT_ID) {
  throw new Error("PIPEDREAM_PROJECT_ID environment variable is required");
}

if (!process.env.PIPEDREAM_ENVIRONMENT) {
  throw new Error("PIPEDREAM_ENVIRONMENT environment variable is required");
}

const pipedreamClient = new PipedreamClient({
  clientId: process.env.PIPEDREAM_CLIENT_ID,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET,
  projectId: process.env.PIPEDREAM_PROJECT_ID,
  projectEnvironment: process.env.PIPEDREAM_ENVIRONMENT as "development" | "production",
});

export { pipedreamClient };
