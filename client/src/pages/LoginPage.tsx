import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "../auth-client";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setFormError(error.message ?? "Sign in failed");
      return;
    }
    navigate("/", { replace: true });
  });

  const inputBase =
    "rounded border px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/10";

  return (
    <main className="grid min-h-screen place-items-center bg-gray-100 font-sans">
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex w-[360px] flex-col gap-3 rounded-lg bg-white p-8 shadow-sm"
      >
        <h1 className="m-0 text-xl font-semibold">Sign in</h1>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            autoComplete="email"
            {...register("email")}
            className={`${inputBase} ${errors.email ? "border-red-700" : "border-gray-300"}`}
          />
          {errors.email && (
            <span className="text-xs text-red-700">{errors.email.message}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className={`${inputBase} ${errors.password ? "border-red-700" : "border-gray-300"}`}
          />
          {errors.password && (
            <span className="text-xs text-red-700">{errors.password.message}</span>
          )}
        </label>

        {formError && <p className="m-0 text-sm text-red-700">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-gray-900 px-3 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
