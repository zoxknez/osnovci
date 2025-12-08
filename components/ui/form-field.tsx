/**
 * Enhanced Form Field Component
 * Provides validation feedback and error display
 */

"use client";

import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Label } from "./label";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  touched?: boolean;
  showError?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      touched = false,
      showError = true,
      helperText,
      leftIcon,
      rightIcon,
      className,
      type = "text",
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    const hasError = touched && error && showError;
    const displayValue = props.value || props.defaultValue || "";

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className={cn(hasError && "text-red-600")}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <Input
            ref={ref}
            type={inputType}
            className={cn(
              leftIcon && "pl-10",
              (rightIcon || isPassword) && "pr-10",
              hasError &&
                "border-red-300 focus:border-red-500 focus:ring-red-500",
              isFocused && !hasError && "border-blue-500",
              className,
            )}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${props.id}-error`
                : helperText
                  ? `${props.id}-helper`
                  : undefined
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(props as any)}
          />

          {(rightIcon || isPassword) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={
                    showPassword ? "Sakrij lozinku" : "Prikaži lozinku"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              ) : (
                rightIcon
              )}
            </div>
          )}

          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>

        {hasError && (
          <p
            id={`${props.id}-error`}
            className="text-sm text-red-600 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p id={`${props.id}-helper`} className="text-xs text-gray-500">
            {helperText}
          </p>
        )}

        {props.maxLength && typeof displayValue === "string" && (
          <p className="text-xs text-gray-400 text-right">
            {displayValue.length} / {props.maxLength}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = "FormField";
