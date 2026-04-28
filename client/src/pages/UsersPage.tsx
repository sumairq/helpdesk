import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import { UsersTable, type User } from "@/components/UsersTable";

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<{ users: User[] }>("/api/users", { withCredentials: true });
  return res.data.users;
}

export function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const { data: users = [], isPending, error } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Button onClick={() => setCreateOpen(true)}>New User</Button>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />
      <DeleteUserDialog user={deletingUser} onClose={() => setDeletingUser(null)} />

      {error && (
        <p className="text-destructive">
          {axios.isAxiosError(error) ? (error.response?.data?.error ?? error.message) : "Failed to load users"}
        </p>
      )}

      {!error && (
        <UsersTable
          users={users}
          isPending={isPending}
          onEdit={setEditingUser}
          onDelete={setDeletingUser}
        />
      )}
    </main>
  );
}
