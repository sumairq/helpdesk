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
    <div className="min-h-screen bg-gray-100 font-sans">
      <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <strong>Helpdesk</strong>
        <div className="flex items-center gap-4">
          {session && <span className="text-sm">{session.user.name}</span>}
          <button
            onClick={onSignOut}
            className="cursor-pointer rounded bg-gray-900 px-3 py-1.5 text-white"
          >
            Sign out
          </button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
