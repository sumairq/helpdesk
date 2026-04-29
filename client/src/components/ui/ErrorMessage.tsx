import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  message?: string | null;
  variant?: "field" | "inline" | "page" | "block" | "alert";
}

export function ErrorMessage({ message, variant = "inline" }: Props) {
  if (!message) return null;

  if (variant === "alert") {
    return (
      <Alert variant="destructive">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  if (variant === "block") {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {message}
      </div>
    );
  }

  const className =
    variant === "field"
      ? "text-xs text-destructive"
      : variant === "page"
        ? "text-destructive"
        : "text-sm text-destructive";

  return <p className={className}>{message}</p>;
}
