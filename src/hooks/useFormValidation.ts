import { useState, useCallback, useMemo } from "react";
import { z } from "zod";
import { toast } from "sonner";

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormValidationOptions<T> {
  initialValues: T;
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onError?: (errors: ValidationErrors<T>) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Comprehensive form validation hook with Zod schema support
 * Provides real-time validation, error handling, and submission management
 */
export function useFormValidation<T extends Record<string, unknown>>({
  initialValues,
  schema,
  onSubmit,
  onError,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (name: keyof T, value: unknown): string | undefined => {
      try {
        // Create a partial object with just this field for validation
        const partialData = { ...values, [name]: value };
        schema.parse(partialData);
        return undefined;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find(
            (e) => e.path[0] === name || e.path.join(".") === String(name)
          );
          return fieldError?.message;
        }
        return undefined;
      }
    },
    [schema, values]
  );

  // Validate all fields
  const validateAll = useCallback((): ValidationErrors<T> => {
    try {
      schema.parse(values);
      return {};
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: ValidationErrors<T> = {};
        error.errors.forEach((e) => {
          const fieldName = e.path[0] as keyof T;
          if (!newErrors[fieldName]) {
            newErrors[fieldName] = e.message;
          }
        });
        return newErrors;
      }
      return {};
    }
  }, [schema, values]);

  // Handle field change
  const handleChange = useCallback(
    (name: keyof T) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string
    ) => {
      const newValue = typeof e === "string" ? e : e.target.value;
      
      setValues((prev) => ({ ...prev, [name]: newValue }));
      setIsDirty(true);

      if (validateOnChange && touched[name]) {
        const error = validateField(name, newValue);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [validateOnChange, touched, validateField]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (validateOnBlur) {
        const error = validateField(name, values[name]);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [validateOnBlur, validateField, values]
  );

  // Set a field value directly (for controlled components like Select)
  const setFieldValue = useCallback(
    (name: keyof T, value: unknown) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setIsDirty(true);

      if (validateOnChange && touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [validateOnChange, touched, validateField]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>
      );
      setTouched(allTouched);

      // Validate all fields
      const validationErrors = validateAll();
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        onError?.(validationErrors);
        const firstError = Object.values(validationErrors)[0];
        if (firstError) {
          toast.error("Validation Error", { description: String(firstError) });
        }
        return false;
      }

      setIsSubmitting(true);

      try {
        await onSubmit(values);
        setIsDirty(false);
        return true;
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("Submission failed. Please try again.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateAll, onSubmit, onError]
  );

  // Reset form to initial values
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialValues]);

  // Check if form is valid
  const isValid = useMemo(() => {
    try {
      schema.parse(values);
      return true;
    } catch {
      return false;
    }
  }, [schema, values]);

  // Get field props helper
  const getFieldProps = useCallback(
    (name: keyof T) => ({
      value: values[name] as string,
      onChange: handleChange(name),
      onBlur: handleBlur(name),
      error: errors[name],
      touched: touched[name],
    }),
    [values, handleChange, handleBlur, errors, touched]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    isValid,
    handleChange,
    handleBlur,
    setFieldValue,
    handleSubmit,
    reset,
    setValues,
    setErrors,
    getFieldProps,
  };
}

// Common validation schemas
export const commonSchemas = {
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long"),
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  phone: z.string().trim().regex(
    /^\+?[\d\s-()]{10,20}$/,
    "Invalid phone number format"
  ).optional().or(z.literal("")),
  amount: z.number().positive("Amount must be positive").max(1000000000, "Amount too large"),
  amountString: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Enter a valid positive amount"
  ),
  message: z.string().trim().min(1, "Message is required").max(1000, "Message too long"),
  description: z.string().trim().max(5000, "Description too long").optional(),
};
