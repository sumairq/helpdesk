import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().min(1, "Email is required").check(z.email()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;
