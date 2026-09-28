import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id")!;
  const channelName = params.get("channel_name")!;

  // Presence channels need user data in the auth response
  if (channelName.startsWith("presence-")) {
    const presenceData = {
      user_id: session.user.id,
      user_info: {
        name: session.user.name ?? "Pengguna",
      },
    };
    const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
    return NextResponse.json(authResponse);
  }

  // Private channels: just verify the user is logged in
  const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: session.user.id,
  });

  return NextResponse.json(authResponse);
}
