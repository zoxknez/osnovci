/**
 * Form Validation Hook
 * Provides real-time validation feedback
 */

import { useCallback, useState } from "react";
import { z } from "zod";
import { showErrorToast } from "@/components/features/error-toast";

interface ValidationError {
  field: string;
  message: string;
}

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onValidationError?: (errors: ValidationError[]) => void;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  onSubmit,
  onValidationError,
}: UseFormValidationOptions<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Validate single field
   */
  const validateField = useCallback(
    (field: keyof T, value: unknown): string | null => {
      try {
        // Create a partial schema for this field - only works for ZodObject schemas
        const schemaAny = schema as unknown as {
          shape?: Record<string, z.ZodTypeAny>;
        };
        const fieldSchema = schemaAny.shape?.[field as string];
        if (!fieldSchema) return null;

        fieldSchema.parse(value);
        return null;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.issues[0]?.message || "Neispravna vrednost";
        }
        return "Neispravna vrednost";
      }
    },
    [schema],
  );

  /**
   * Validate all fields
   */
  const validate = useCallback(
    (data: T): { isValid: boolean; errors: ValidationError[] } => {
      try {
        schema.parse(data);
        setErrors({});
        return { isValid: true, errors: [] };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          const validationErrors: ValidationError[] = [];

          error.issues.forEach((err) => {
            const field = err.path.join(".");
            const message = err.message;
            fieldErrors[field] = message;
            validationErrors.push({ field, message });
          });

          setErrors(fieldErrors);
          onValidationError?.(validationErrors);
          return { isValid: false, errors: validationErrors };
        }
        return { isValid: false, errors: [] };
      }
    },
    [schema, onValidationError],
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (data: T) => {
      setIsSubmitting(true);
      setTouched(
        Object.keys(data).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
      );

      const validation = validate(data);
      if (!validation.isValid) {
        setIsSubmitting(false);
        showErrorToast({
          error: new Error("Proveri formu - ima grešaka"),
        });
        return;
      }

      try {
        await onSubmit(validation.isValid ? data : data);
        setErrors({});
        setTouched({});
      } catch (error) {
        showErrorToast({
          error: error instanceof Error ? error : new Error(String(error)),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, onSubmit],
  );

  /**
   * Mark field as touched
   */
  const markFieldTouched = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field as string]: true }));
  }, []);

  /**
   * Clear field error
   */
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    isSubmitting,
    validateField,
    validate,
    handleSubmit,
    markFieldTouched,
    clearFieldError,
    clearErrors,
  };
}
