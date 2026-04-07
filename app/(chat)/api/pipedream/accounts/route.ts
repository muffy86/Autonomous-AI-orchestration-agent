import { auth } from "@/app/(auth)/auth";
import { pipedreamClient } from "@/lib/pipedream";
import { ChatSDKError } from "@/lib/errors";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const accounts = await pipedreamClient.accounts.list({
      externalUserId: session.user.id,
    });

    return Response.json(accounts);
  } catch (error) {
    console.error("Error fetching Pipedream accounts:", error);
    return new ChatSDKError(
      "internal_server_error:api",
      "Failed to fetch Pipedream accounts"
    ).toResponse();
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const { searchParams } = request.nextUrl;
    const accountId = searchParams.get("account_id");

    if (!accountId) {
      return new ChatSDKError(
        "bad_request:api",
        "account_id is required"
      ).toResponse();
    }

    await pipedreamClient.accounts.delete(accountId);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting Pipedream account:", error);
    return new ChatSDKError(
      "internal_server_error:api",
      "Failed to delete Pipedream account"
    ).toResponse();
  }
}
