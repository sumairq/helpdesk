import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { UsersTable } from "@/components/UsersTable";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  createdAt: string;
}

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<{ users: User[] }>("/api/users", { withCredentials: true });
  return res.data.users;
}

export function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: users = [], isPending, error } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Button onClick={() => setDialogOpen(true)}>New User</Button>
      </div>

      <CreateUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {error && (
        <p className="text-destructive">
          {axios.isAxiosError(error) ? (error.response?.data?.error ?? error.message) : "Failed to load users"}
        </p>
      )}

      {!error && <UsersTable users={users} isPending={isPending} />}
    </main>
  );
}
