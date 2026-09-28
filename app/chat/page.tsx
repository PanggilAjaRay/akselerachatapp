"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { ConversationList } from "@/components/ConversationList";
import { ChatWindow } from "@/components/ChatWindow";
import { NewChatModal } from "@/components/NewChatModal";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ChatPage() {
  const { data: session } = useSession();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [, setTotalUnread] = useState(0);

  async function handleNewChatSelect(userId: string) {
    setShowNewChat(false);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: userId }),
    });
    if (res.ok) {
      const { id } = await res.json();
      // Refresh the conversation list
      setRefreshTrigger((n) => n + 1);
      // Fetch the partner's name from the conversation list
      const convsRes = await fetch("/api/conversations");
      if (convsRes.ok) {
        const convs = await convsRes.json();
        const conv = convs.find((c: { id: string; partner: { id: string; name: string } }) => c.id === id);
        if (conv) {
          setSelectedConversationId(id);
          setSelectedPartnerName(conv.partner.name);
          setSelectedPartnerId(conv.partner.id);
        }
      }
    }
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-primary)",
      }}
    >
      {/* Left Panel */}
      <div
        style={{
          width: 320,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border)",
          background: "var(--bg-panel)",
        }}
      >
        {/* Left Header */}
        <div
          style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", flex: 1, padding: "8px 0" }}>
            <img src="/logo-light.png" alt="Akselera.Tech" style={{ height: "55px", width: "auto", objectFit: "contain" }} className="theme-light-only" />
            <img src="/logo-dark.png" alt="Akselera.Tech" style={{ height: "55px", width: "auto", objectFit: "contain" }} className="theme-dark-only" />
          </div>

          {/* Theme + New Chat buttons */}
          <ThemeToggle />
          <button
            onClick={() => setShowNewChat(true)}
            title="Chat baru"
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--bg-panel)",
              cursor: "pointer",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-panel)")}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {/* Conversation List */}
        <ConversationList
          selectedId={selectedConversationId}
          onSelect={(id, name, partnerId) => {
            setSelectedConversationId(id);
            setSelectedPartnerName(name);
            setSelectedPartnerId(partnerId);
          }}
          refreshTrigger={refreshTrigger}
          onOnlineUsersChange={setOnlineUsers}
          onUnreadChange={setTotalUnread}
        />

        {/* User info + logout */}
        <div
          style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--bg-primary)",
              fontWeight: 700,
              fontSize: "0.875rem",
              flexShrink: 0,
            }}
          >
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {session?.user?.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {session?.user?.email}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Logout"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              padding: 4,
              borderRadius: 6,
              transition: "color 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-secondary)" }}>
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            partnerName={selectedPartnerName}
            isOnline={selectedPartnerId ? onlineUsers.has(selectedPartnerId) : false}
            onReadChange={() => setRefreshTrigger((n) => n + 1)}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              color: "var(--text-muted)",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "var(--accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
                <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="var(--accent)" />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "1rem" }}>Selamat datang!</p>
              <p style={{ fontSize: "0.875rem", marginTop: 4 }}>Pilih percakapan atau mulai chat baru</p>
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: 8,
                border: "none",
                background: "var(--accent)",
                color: "var(--bg-primary)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              ＋ Chat Baru
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatModal
          onSelect={handleNewChatSelect}
          onClose={() => setShowNewChat(false)}
        />
      )}
    </div>
  );
}
