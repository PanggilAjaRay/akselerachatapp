"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Props {
  onSelect: (userId: string) => void;
  onClose: () => void;
}

export function NewChatModal({ onSelect, onClose }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-panel)",
          borderRadius: 16,
          padding: "1.5rem",
          width: "100%",
          maxWidth: 400,
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Chat Baru
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: 4,
              display: "flex",
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          style={{
            padding: "0.625rem 0.875rem",
            borderRadius: 8,
            border: "1.5px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            fontSize: "0.9375rem",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {loading && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "1rem 0" }}>
              Memuat...
            </p>
          )}
          {!loading && filtered.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "1rem 0" }}>
              Tidak ada pengguna ditemukan
            </p>
          )}
          {filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelect(user.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                borderRadius: 10,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--bg-primary)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  flexShrink: 0,
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: "0.9375rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.name}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
