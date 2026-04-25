import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { authClient } from "./auth-client";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <p style={{ fontFamily: "system-ui", padding: 32 }}>Loading…</p>;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <LoginPage />
            </RedirectIfAuthed>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
