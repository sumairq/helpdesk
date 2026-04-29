import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

interface Props {
  to: string;
  label: string;
}

export function BackLink({ to, label }: Props) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
    >
      <ArrowLeftIcon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
