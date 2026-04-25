import { useEffect, useState } from "react";

export function App() {
  const [health, setHealth] = useState<string>("checking...");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHealth(d.status))
      .catch(() => setHealth("unreachable"));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui", padding: 32 }}>
      <h1>Helpdesk</h1>
      <p>API status: {health}</p>
    </main>
  );
}
