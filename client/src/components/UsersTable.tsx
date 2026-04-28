import { PencilIcon, Trash2Icon } from "lucide-react";
import { Role } from "@helpdesk/core";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface UsersTableProps {
  users: User[];
  isPending: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UsersTable({ users, isPending, onEdit, onDelete }: UsersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-7 w-7 rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <span
                    className={
                      user.role === Role.ADMIN
                        ? "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary"
                        : "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
                    }
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${user.name}`}
                    onClick={() => onEdit(user)}
                  >
                    <PencilIcon />
                  </Button>
                  {user.role !== Role.ADMIN && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${user.name}`}
                      onClick={() => onDelete(user)}
                    >
                      <Trash2Icon />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
