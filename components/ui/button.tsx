// Modern Button component sa Tailwind variants
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  // Base styles - Savršen za accessibility i estetiku
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        // Default - Primary gradient sa hover effects
        default:
          "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 active:scale-95 focus-visible:ring-blue-500",

        // Destructive - Crvena za delete akcije
        destructive:
          "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:shadow-lg hover:from-red-700 hover:to-red-800 active:scale-95 focus-visible:ring-red-500",

        // Outline - Za sekundarne akcije
        outline:
          "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:scale-95 focus-visible:ring-gray-400",

        // Secondary - Za tercijarne akcije
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-sm active:scale-95 focus-visible:ring-gray-400",

        // Ghost - Subtle akcije
        ghost:
          "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:scale-95 focus-visible:ring-gray-400",

        // Link - Text link style
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 focus-visible:ring-blue-400",

        // Success - Za pozitivne akcije
        success:
          "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md hover:shadow-lg hover:from-green-700 hover:to-green-800 active:scale-95 focus-visible:ring-green-500",

        // Warning - Za opasne ali ne destructive akcije
        warning:
          "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg hover:from-orange-600 hover:to-orange-700 active:scale-95 focus-visible:ring-orange-400",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-13 rounded-xl px-8 py-3 text-base font-semibold",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Accessibility: Label za screen readers (OBAVEZNO za icon-only buttone) */
  "aria-label"?: string;
  /** Loading state - prikazuje spinner */
  loading?: boolean;
  /** Icon na početku buttona */
  leftIcon?: React.ReactNode;
  /** Icon na kraju buttona */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      children,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Left icon */}
        {!loading && leftIcon && (
          <span className="inline-flex" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* Button text */}
        {children}

        {/* Right icon */}
        {!loading && rightIcon && (
          <span className="inline-flex" aria-hidden="true">
            {rightIcon}
          </span>
        )}

        {/* Screen reader loading text */}
        {loading && <span className="sr-only">Učitavanje...</span>}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
