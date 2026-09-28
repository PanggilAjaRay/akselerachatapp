import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

async function checkParticipant(conversationId: string, userId: string) {
  const participant = await prisma.participant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return !!participant;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: conversationId } = await params;

  const isParticipant = await checkParticipant(conversationId, userId);
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: conversationId } = await params;

  const isParticipant = await checkParticipant(conversationId, userId);
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { body, conversationId, senderId: userId },
    include: { sender: { select: { id: true, name: true } } },
  });

  // Trigger Pusher real-time event
  await pusherServer.trigger(
    `private-conversation-${conversationId}`,
    "new-message",
    message
  );

  return NextResponse.json(message, { status: 201 });
}
