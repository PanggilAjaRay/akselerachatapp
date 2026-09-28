import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

// Helper function to verify permissions
async function verifyMessageAccess(messageId: string, userId: string, conversationId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return { error: "Message not found", status: 404 };
  }

  if (message.conversationId !== conversationId) {
    return { error: "Invalid conversation", status: 400 };
  }

  if (message.senderId !== userId) {
    return { error: "Forbidden - not your message", status: 403 };
  }

  return { message, error: null };
}

// EDIT Message (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId, messageId } = await params;
  const { error, status } = await verifyMessageAccess(messageId, session.user.id, conversationId);
  if (error) return NextResponse.json({ error }, { status: status as number });

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: { body },
    include: { sender: { select: { id: true, name: true } } },
  });

  // Trigger real-time update
  await pusherServer.trigger(
    `private-conversation-${conversationId}`,
    "message-updated",
    updatedMessage
  );

  return NextResponse.json(updatedMessage);
}

// DELETE Message (DELETE)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId, messageId } = await params;
  const { error, status } = await verifyMessageAccess(messageId, session.user.id, conversationId);
  if (error) return NextResponse.json({ error }, { status: status as number });

  await prisma.message.delete({
    where: { id: messageId },
  });

  // Trigger real-time deletion event
  await pusherServer.trigger(
    `private-conversation-${conversationId}`,
    "message-deleted",
    { id: messageId }
  );

  return NextResponse.json({ success: true, id: messageId });
}
