// Modern Input component - Full Accessibility & Validation

import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error message - prikazuje se ispod inputa */
  error?: string | undefined;
  /** Label text - OBAVEZAN za accessibility */
  label?: string | undefined;
  /** Helper text - informativna poruka ispod inputa */
  helperText?: string | undefined;
  /** Success message - za validaciju */
  success?: string | undefined;
  /** Icon na početku inputa */
  leftIcon?: React.ReactNode | undefined;
  /** Icon na kraju inputa */
  rightIcon?: React.ReactNode | undefined;
  /** Show character count */
  showCharCount?: boolean | undefined;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      success,
      label,
      helperText,
      id,
      required,
      maxLength,
      showCharCount,
      leftIcon,
      rightIcon,
      ...props
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const [showPassword, setShowPassword] = React.useState(false);
    const [charCount, setCharCount] = React.useState(0);

    // Password visibility toggle
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    // Handle character count
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (showCharCount || maxLength) {
        setCharCount(e.target.value.length);
      }
      props.onChange?.(e);
    };

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            {label}
            {required && (
              <span className="ml-1 text-red-500">
                * <span className="sr-only">obavezno</span>
              </span>
            )}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          {/* Input field */}
          <input
            id={inputId}
            type={inputType}
            maxLength={maxLength}
            className={cn(
              // Base styles
              "flex h-11 w-full rounded-xl border-2 px-4 py-2 text-sm transition-all duration-200",
              // Text color
              "text-gray-900",
              // Placeholder
              "placeholder:text-gray-400",
              // Background - Subtle glass effect
              "bg-white/80 backdrop-blur-sm border-gray-200",

              // Focus styles
              "focus:outline-none focus:ring-3 focus:ring-offset-1",

              // State colors
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/30"
                : success
                  ? "border-green-300 focus:border-green-500 focus:ring-green-500/30"
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/30",

              // Disabled state
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",

              // Icon padding
              leftIcon && "pl-10",
              (rightIcon || isPassword) && "pr-10",

              className,
            )}
            ref={ref}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={cn(error && errorId, helperText && helperId)}
            onChange={handleChange}
            {...props}
          />

          {/* Right icon or password toggle */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Success/Error icon */}
            {!isPassword && success && !error && (
              <CheckCircle
                className="h-5 w-5 text-green-500"
                aria-hidden="true"
              />
            )}
            {!isPassword && error && (
              <AlertCircle
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            )}

            {/* Password visibility toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sakrij lozinku" : "Prikaži lozinku"}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            )}

            {/* Custom right icon */}
            {!isPassword && rightIcon && (
              <div className="text-gray-400" aria-hidden="true">
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {/* Helper text / Error / Success / Character count */}
        <div className="mt-1.5 flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Error message */}
            {error && (
              <p
                id={errorId}
                className="text-sm text-red-600 flex items-center gap-1"
                role="alert"
              >
                <AlertCircle
                  className="h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{error}</span>
              </p>
            )}

            {/* Success message */}
            {!error && success && (
              <p className="text-sm text-green-700 flex items-center gap-1">
                <CheckCircle
                  className="h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{success}</span>
              </p>
            )}

            {/* Helper text */}
            {!error && !success && helperText && (
              <p id={helperId} className="text-sm text-gray-500">
                {helperText}
              </p>
            )}
          </div>

          {/* Character count */}
          {(showCharCount || maxLength) && (
            <p
              className={cn(
                "text-xs font-medium flex-shrink-0",
                maxLength && charCount > maxLength * 0.9
                  ? "text-orange-600"
                  : "text-gray-500",
              )}
              aria-live="polite"
            >
              {charCount}
              {maxLength && `/${maxLength}`}
            </p>
          )}
        </div>
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
