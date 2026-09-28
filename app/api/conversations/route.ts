import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Get conversations where the current user is a participant
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      participants: {
        where: { userId: { not: userId } },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              read: false,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = conversations
    .filter((c) => c.participants.length > 0)
    .map((c) => ({
      id: c.id,
      partner: c.participants[0].user,
      lastMessage: c.messages[0] ?? null,
      createdAt: c.createdAt,
      unreadCount: c._count.messages,
    }))
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? a.createdAt;
      const bTime = b.lastMessage?.createdAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { partnerId } = await req.json();
  if (!partnerId) {
    return NextResponse.json({ error: "partnerId wajib diisi" }, { status: 400 });
  }

  // Check if a 1-on-1 conversation already exists between these two users
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: partnerId } } },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ id: existing.id });
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: partnerId }],
      },
    },
  });

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}
