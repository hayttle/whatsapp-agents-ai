import { forwardRef, InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, ...props }, ref) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        ref={ref}
        className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
);
InputField.displayName = "InputField"; 