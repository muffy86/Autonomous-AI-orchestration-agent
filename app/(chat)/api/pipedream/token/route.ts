import { auth } from "@/app/(auth)/auth";
import { pipedreamClient } from "@/lib/pipedream";
import { ChatSDKError } from "@/lib/errors";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const body = await request.json();
    const { expiresIn, scope, allowedOrigins, errorRedirectUri } = body;

    const result = await pipedreamClient.tokens.create({
      externalUserId: session.user.id,
      expiresIn: expiresIn || 14400,
      scope: scope || "connect:*",
      ...(allowedOrigins && { allowedOrigins }),
      ...(errorRedirectUri && { errorRedirectUri }),
    });

    return Response.json({
      token: result.token,
      expiresAt: result.expiresAt,
      connectLinkUrl: result.connectLinkUrl,
    });
  } catch (error) {
    console.error("Error creating Pipedream Connect token:", error);
    return new ChatSDKError(
      "internal_server_error:api",
      "Failed to create Pipedream Connect token"
    ).toResponse();
  }
}
