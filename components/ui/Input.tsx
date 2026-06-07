import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-semibold text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl border border-gray-200 bg-white
            text-sm text-gray-800 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
            transition-all duration-200
            ${error ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
