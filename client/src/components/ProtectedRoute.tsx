import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "../auth-client";

export function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <p style={{ fontFamily: "system-ui", padding: 32 }}>Loading…</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
