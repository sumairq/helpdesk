import { useState, useEffect } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editUserSchema, type EditUserValues } from "@helpdesk/core";
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

interface User {
  id: string;
  name: string;
  email: string;
}

async function updateUser(id: string, values: EditUserValues): Promise<void> {
  await axios.patch(`/api/users/${id}`, values, { withCredentials: true });
}

interface EditUserDialogProps {
  user: User | null;
  onClose: () => void;
}

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // Populate form when a user is selected for editing.
  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email, password: "" });
      setFormError(null);
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (values: EditUserValues) => updateUser(user!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : "Failed to update user";
      setFormError(message);
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    mutation.mutate(values);
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setFormError(null);
      onClose();
    }
  }

  return (
    <Dialog open={user !== null} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-user-name">Name</Label>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  id="edit-user-name"
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
            <Label htmlFor="edit-user-email">Email</Label>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  id="edit-user-email"
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
            <Label htmlFor="edit-user-password">New password</Label>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Input
                  id="edit-user-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current password"
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
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
