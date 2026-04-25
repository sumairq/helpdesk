import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../auth-client";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await authClient.signIn.email({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message ?? "Sign in failed");
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <main
      style={{
        fontFamily: "system-ui",
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f6f7f9",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: 360,
          padding: 32,
          background: "white",
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>Sign in</h1>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ padding: 8, border: "1px solid #d0d3d9", borderRadius: 4 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ padding: 8, border: "1px solid #d0d3d9", borderRadius: 4 }}
          />
        </label>
        {error && <p style={{ color: "#b91c1c", margin: 0, fontSize: 14 }}>{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: 10,
            background: "#111827",
            color: "white",
            border: 0,
            borderRadius: 4,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
