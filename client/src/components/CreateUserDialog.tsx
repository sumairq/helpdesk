import { useState } from "react";
import { flushSync } from "react-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserValues } from "@helpdesk/core";
import { type User } from "@/components/UsersTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

async function createUser(values: CreateUserValues): Promise<User> {
  const res = await axios.post<{ user: User }>("/api/users", values, { withCredentials: true });
  return res.data.user;
}

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (newUser) => {
      flushSync(() => {
        onOpenChange(false);
        reset();
      });
      queryClient.setQueryData<User[]>(["users"], (old = []) => [...old, newUser]);
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : "Failed to create user";
      setFormError(message);
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    mutation.mutate(values);
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset();
      setFormError(null);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-user-name">Name</Label>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  id="new-user-name"
                  type="text"
                  autoComplete="off"
                  aria-invalid={!!errors.name}
                  {...field}
                />
              )}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="new-user-email">Email</Label>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  id="new-user-email"
                  type="email"
                  autoComplete="off"
                  aria-invalid={!!errors.email}
                  {...field}
                />
              )}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="new-user-password">Password</Label>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Input
                  id="new-user-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...field}
                />
              )}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
