import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({ loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-white font-semibold shadow hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin w-4 h-4" />}
      {children}
    </button>
  );
} 