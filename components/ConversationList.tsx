"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { pusherClient } from "@/lib/pusher";
import type { Members } from "pusher-js";

interface Conversation {
  id: string;
  partner: { id: string; name: string; email: string };
  lastMessage: { body: string; createdAt: string } | null;
  createdAt: string;
  unreadCount: number;
}

interface Props {
  selectedId: string | null;
  onSelect: (id: string, partnerName: string, partnerId: string) => void;
  refreshTrigger: number;
  onUnreadChange?: (total: number) => void;
  onOnlineUsersChange?: (users: Set<string>) => void;
}

function formatPreviewTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export function ConversationList({ selectedId, onSelect, refreshTrigger, onUnreadChange, onOnlineUsersChange }: Props) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const fetchConversations = useCallback(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        const list: Conversation[] = Array.isArray(data) ? data : [];
        setConversations(list);
        setLoading(false);
        const total = list.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
        onUnreadChange?.(total);
      });
  }, [onUnreadChange]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, refreshTrigger]);

  // Subscribe to Presence channel for online status
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = pusherClient.subscribe("presence-akselerachat");

    channel.bind("pusher:subscription_succeeded", (members: Members) => {
      const ids = new Set<string>();
      members.each((member: { id: string }) => {
        if (member.id !== session.user!.id) ids.add(member.id);
      });
      setOnlineUsers(ids);
      onOnlineUsersChange?.(ids);
    });

    channel.bind("pusher:member_added", (member: { id: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev).add(member.id);
        onOnlineUsersChange?.(next);
        return next;
      });
    });

    channel.bind("pusher:member_removed", (member: { id: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(member.id);
        onOnlineUsersChange?.(next);
        return next;
      });
    });

    return () => {
      pusherClient.unsubscribe("presence-akselerachat");
    };
  }, [session?.user?.id]);

  // Subscribe to all private conversation channels for last-message preview + unread
  useEffect(() => {
    if (conversations.length === 0) return;

    const channels = conversations.map((conv) => {
      const channelName = `private-conversation-${conv.id}`;
      const channel = pusherClient.subscribe(channelName);
      channel.bind("new-message", (msg: { body: string; createdAt: string; senderId: string }) => {
        setConversations((prev) => {
          const next = prev
            .map((c) => {
              if (c.id !== conv.id) return c;
              const isFromPartner = msg.senderId !== session?.user?.id;
              const isActiveConv = c.id === selectedId;
              return {
                ...c,
                lastMessage: { body: msg.body, createdAt: msg.createdAt },
                unreadCount: isFromPartner && !isActiveConv ? c.unreadCount + 1 : c.unreadCount,
              };
            })
            .sort((a, b) => {
              const at = a.lastMessage?.createdAt ?? a.createdAt;
              const bt = b.lastMessage?.createdAt ?? b.createdAt;
              return new Date(bt).getTime() - new Date(at).getTime();
            });
          const total = next.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
          onUnreadChange?.(total);
          return next;
        });
      });
      return channelName;
    });

    return () => {
      channels.forEach((ch) => pusherClient.unsubscribe(ch));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length]);

  const handleSelect = (conv: Conversation) => {
    onSelect(conv.id, conv.partner.name, conv.partner.id);
    // Reset unread badge locally for this conversation
    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === conv.id ? { ...c, unreadCount: 0 } : c
      );
      const total = next.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
      onUnreadChange?.(total);
      return next;
    });
  };

  const filtered = conversations.filter((c) =>
    c.partner.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Search Bar */}
      <div style={{ padding: "0.625rem 0.875rem", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--bg-secondary)",
            borderRadius: "8px",
            padding: "0.375rem 0.75rem",
            border: "1.5px solid transparent",
            transition: "border-color 0.15s",
          }}
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = "transparent")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cari percakapan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "0.8125rem",
              color: "var(--text-primary)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {loading && (
          <div style={{ padding: "1.25rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Memuat...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div
            style={{
              padding: "1.25rem",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              textAlign: "center",
              marginTop: "2rem",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>
              {search ? "🔍" : "💬"}
            </div>
            <p>{search ? "Tidak ditemukan." : "Belum ada chat. Mulai percakapan baru!"}</p>
          </div>
        )}
        {filtered.map((conv) => {
          const isSelected = conv.id === selectedId;
          const isOnline = onlineUsers.has(conv.partner.id);
          const hasUnread = (conv.unreadCount ?? 0) > 0;

          return (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                width: "100%",
                border: "none",
                borderRadius: 0,
                background: isSelected ? "var(--accent-light)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.12s",
                borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Avatar with online dot */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--bg-primary)",
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                  }}
                >
                  {conv.partner.name ? conv.partner.name.charAt(0).toUpperCase() : "U"}
                </div>
                {/* Online indicator */}
                {isOnline && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 1,
                      right: 1,
                      width: 11,
                      height: 11,
                      borderRadius: "50%",
                      background: "#22c55e",
                      border: "2px solid var(--bg-panel)",
                    }}
                  />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span
                    style={{
                      fontWeight: hasUnread ? 700 : 600,
                      fontSize: "0.9375rem",
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "65%",
                    }}
                  >
                    {conv.partner.name}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>
                    {formatPreviewTime(conv.lastMessage?.createdAt ?? conv.createdAt)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: 2 }}>
                  <div
                    style={{
                      flex: 1,
                      fontSize: "0.8125rem",
                      color: hasUnread ? "var(--text-primary)" : "var(--text-secondary)",
                      fontWeight: hasUnread ? 600 : 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {conv.lastMessage ? conv.lastMessage.body : "Belum ada pesan"}
                  </div>
                  {/* Unread badge */}
                  {hasUnread && (
                    <span
                      style={{
                        background: "var(--accent)",
                        color: "var(--bg-primary)",
                        borderRadius: "999px",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        minWidth: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 5px",
                        flexShrink: 0,
                      }}
                    >
                      {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
