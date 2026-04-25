import { Outlet, useNavigate } from "react-router-dom";
import { authClient } from "../auth-client";

export function Layout() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const onSignOut = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ fontFamily: "system-ui", minHeight: "100vh", background: "#f6f7f9" }}>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          background: "white",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <strong>Helpdesk</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {session && <span style={{ fontSize: 14 }}>{session.user.name}</span>}
          <button
            onClick={onSignOut}
            style={{
              padding: "6px 12px",
              background: "#111827",
              color: "white",
              border: 0,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
