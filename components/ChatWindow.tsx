"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { pusherClient } from "@/lib/pusher";

interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string };
}

interface Props {
  conversationId: string;
  partnerName: string;
  isOnline?: boolean;
  onReadChange?: () => void;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatWindow({ conversationId, partnerName, isOnline, onReadChange }: Props) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // States for Edit / Delete
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch existing messages and mark as read
  useEffect(() => {
    setLoading(true);
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      });
    // Mark all unread messages as read
    fetch(`/api/conversations/${conversationId}/read`, { method: "PATCH" })
      .then(() => onReadChange?.());
  }, [conversationId, onReadChange]);

  // Subscribe to Pusher real-time updates
  useEffect(() => {
    const channelName = `private-conversation-${conversationId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("new-message", (msg: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    channel.bind("message-updated", (updatedMsg: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
      );
    });

    channel.bind("message-deleted", ({ id }: { id: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    const body = input.trim();
    setInput("");
    setSending(true);

    if (editMessageId) {
      // HANDLE EDIT
      const currentEditId = editMessageId;
      setEditMessageId(null);

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => (m.id === currentEditId ? { ...m, body } : m))
      );

      const res = await fetch(`/api/conversations/${conversationId}/messages/${currentEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (res.ok) {
        const saved: Message = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === currentEditId ? saved : m))
        );
      }
    } else {
      // HANDLE CREATE
      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        body,
        senderId: session!.user!.id as string,
        createdAt: new Date().toISOString(),
        sender: { id: session!.user!.id as string, name: session!.user!.name! },
      };
      setMessages((prev) => [...prev, optimistic]);

      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (res.ok) {
        const saved: Message = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
      }
    }

    setSending(false);
  }, [input, sending, conversationId, session, editMessageId]);

  const initiateEdit = (msg: Message) => {
    setEditMessageId(msg.id);
    setInput(msg.body);
  };

  const cancelEdit = () => {
    setEditMessageId(null);
    setInput("");
  };

  const deleteMessage = async (id: string) => {
    if (confirm("Hapus pesan ini?")) {
      // Optimistic delete
      setMessages((prev) => prev.filter((m) => m.id !== id));

      if (editMessageId === id) cancelEdit();

      await fetch(`/api/conversations/${conversationId}/messages/${id}`, {
        method: "DELETE",
      });
    }
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === "Escape" && editMessageId) {
      cancelEdit();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "var(--bg-panel)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--bg-primary)",
            fontWeight: 700,
            fontSize: "1rem",
            flexShrink: 0,
          }}
        >
          {partnerName ? partnerName.charAt(0).toUpperCase() : "U"}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
            {partnerName}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              marginTop: "2px",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isOnline ? "#22c55e" : "var(--text-muted)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "0.75rem", color: isOnline ? "#22c55e" : "var(--text-muted)" }}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {loading && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "2rem" }}>
            Memuat pesan...
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "3rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>💬</div>
            <p style={{ fontSize: "0.875rem" }}>Belum ada pesan. Mulai percakapan!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isSelf = msg.senderId === session?.user?.id;
          const isEditing = editMessageId === msg.id;
          const showMenu = activeMenuId === msg.id;

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isSelf ? "flex-end" : "flex-start",
                position: "relative",
                opacity: isEditing ? 0.6 : 1,
                transition: "opacity 0.2s",
                marginBottom: "0.25rem",
              }}
            >
              <div style={{ position: "relative", maxWidth: "80%" }}>
                {/* Action Menu (Popup) */}
                {isSelf && showMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-45px",
                      right: 0,
                      background: "var(--bg-panel)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      boxShadow: "var(--shadow-md)",
                      display: "flex",
                      padding: "0.25rem",
                      gap: "0.25rem",
                      zIndex: 10,
                    }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); initiateEdit(msg); }}
                      title="Edit pesan"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-primary)",
                        padding: "0.375rem 0.5rem",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span>✎</span> Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); deleteMessage(msg.id); }}
                      title="Hapus pesan"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        padding: "0.375rem 0.5rem",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#fef2f2"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span>🗑</span> Hapus
                    </button>
                  </div>
                )}

                <div
                  onClick={() => { if (isSelf) setActiveMenuId(showMenu ? null : msg.id); }}
                  style={{
                    padding: "0.5rem 0.875rem",
                    borderRadius: isSelf ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    background: isSelf ? "var(--bubble-self)" : "var(--bubble-other)",
                    color: isSelf ? "var(--bubble-self-text)" : "var(--bubble-other-text)",
                    fontSize: "0.9375rem",
                    lineHeight: 1.4,
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    cursor: isSelf ? "pointer" : "default",
                  }}
                >
                  {msg.body}
                </div>
              </div>

              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  marginTop: 3,
                  marginLeft: isSelf ? 0 : 4,
                  marginRight: isSelf ? 4 : 0,
                }}
              >
                {formatTime(msg.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "0.875rem 1.25rem",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-panel)",
          display: "flex",
          gap: "0.625rem",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {editMessageId && (
          <button
            onClick={cancelEdit}
            title="Batal Edit"
            style={{
              padding: "0.5rem",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-hover)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Batal
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={editMessageId ? "Edit pesan Anda (Esc untuk batal)..." : "Ketik pesan..."}
          style={{
            flex: 1,
            padding: "0.625rem 0.875rem",
            borderRadius: 8,
            border: editMessageId ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
            background: editMessageId ? "var(--accent-light)" : "var(--bg-secondary)",
            color: editMessageId ? "var(--accent)" : "var(--text-primary)",
            fontSize: "0.9375rem",
            outline: "none",
            transition: "all 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = editMessageId ? "var(--accent)" : "var(--border)")}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            border: "none",
            background:
              input.trim() && !sending
                ? "var(--accent)"
                : "var(--bg-hover)",
            color: input.trim() && !sending ? "white" : "var(--text-muted)",
            cursor: input.trim() && !sending ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          {editMessageId ? (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
