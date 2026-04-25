import { Outlet, useNavigate } from "react-router-dom";
import { authClient } from "../auth-client";
import { Button } from "@/components/ui/button";

export function Layout() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const onSignOut = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between border-b bg-card px-6 py-3">
        <strong>Helpdesk</strong>
        <div className="flex items-center gap-4">
          {session && (
            <span className="text-sm text-muted-foreground">
              {session.user.name}
            </span>
          )}
          <Button size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
