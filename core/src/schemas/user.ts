import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().min(1, "Email is required").check(z.email()).toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().min(1, "Email is required").check(z.email()).toLowerCase(),
  password: z.union([
    z.literal(""),
    z.string().min(8, "Password must be at least 8 characters"),
  ]),
});

export type EditUserValues = z.infer<typeof editUserSchema>;
