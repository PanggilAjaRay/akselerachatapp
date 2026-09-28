"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Terjadi kesalahan");
      return;
    }

    router.push("/login");
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.625rem 0.875rem",
    borderRadius: 8,
    border: "1.5px solid var(--border)",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    fontSize: "0.9375rem",
    outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ position: "fixed", top: "1rem", right: "1rem" }}>
        <ThemeToggle />
      </div>

      <div
        style={{
          background: "var(--bg-panel)",
          borderRadius: 16,
          padding: "2.5rem",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <img src="/logo-light.png" alt="Akselera.Tech" style={{ height: "90px", width: "auto", maxWidth: "100%", objectFit: "contain" }} className="theme-light-only" />
            <img src="/logo-dark.png" alt="Akselera.Tech" style={{ height: "90px", width: "auto", maxWidth: "100%", objectFit: "contain" }} className="theme-dark-only" />
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: 4 }}>
            Buat akun baru
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "0.625rem 0.875rem",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 karakter"
              minLength={6}
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "0.75rem",
              borderRadius: 8,
              border: "none",
              background: loading ? "var(--text-muted)" : "var(--accent)",
              color: "var(--bg-primary)",
              fontWeight: 600,
              fontSize: "0.9375rem",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Sudah punya akun?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
