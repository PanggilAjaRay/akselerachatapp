"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Email atau password salah");
    } else {
      window.location.href = "/chat";
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      {/* Theme toggle */}
      <div style={{ position: "fixed", top: "1rem", right: "1rem" }}>
        <ThemeToggle />
      </div>

      {/* Card */}
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
            Login ke akun Anda
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
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              style={{
                padding: "0.625rem 0.875rem",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontSize: "0.9375rem",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                padding: "0.625rem 0.875rem",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontSize: "0.9375rem",
                outline: "none",
                transition: "border-color 0.15s",
              }}
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
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Belum punya akun?{" "}
          <Link href="/register" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
