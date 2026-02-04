import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import React from "react";

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Enhanced toast utility with consistent styling and UX
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: React.createElement(CheckCircle, { className: "h-5 w-5 text-accent-green" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      icon: React.createElement(XCircle, { className: "h-5 w-5 text-destructive" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: React.createElement(AlertTriangle, { className: "h-5 w-5 text-warning" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: React.createElement(Info, { className: "h-5 w-5 text-primary" }),
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },

  loading: (message: string, options?: Omit<ToastOptions, "action">) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      duration: options?.duration || Infinity,
      icon: React.createElement(Loader2, { className: "h-5 w-5 text-primary animate-spin" }),
    });
  },

  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },

  /**
   * Show a promise-based toast that updates based on promise state
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: (data) => 
        typeof messages.success === "function" 
          ? messages.success(data) 
          : messages.success,
      error: (err) => 
        typeof messages.error === "function" 
          ? messages.error(err as Error) 
          : messages.error,
    });
  },
};

/**
 * Pre-configured toast messages for common actions
 */
export const toastMessages = {
  saved: () => toast.success("Changes saved", { description: "Your changes have been saved successfully" }),
  deleted: (item = "Item") => toast.success(`${item} deleted`, { description: `The ${item.toLowerCase()} has been removed` }),
  created: (item = "Item") => toast.success(`${item} created`, { description: `The ${item.toLowerCase()} has been created successfully` }),
  updated: (item = "Item") => toast.success(`${item} updated`, { description: `The ${item.toLowerCase()} has been updated` }),
  
  networkError: () => toast.error("Connection error", { 
    description: "Please check your internet connection and try again" 
  }),
  serverError: () => toast.error("Server error", { 
    description: "Something went wrong. Please try again later" 
  }),
  validationError: (message?: string) => toast.error("Validation error", { 
    description: message || "Please check your input and try again" 
  }),
  unauthorized: () => toast.error("Unauthorized", { 
    description: "You don't have permission to perform this action" 
  }),
  sessionExpired: () => toast.warning("Session expired", { 
    description: "Please log in again to continue" 
  }),

  copied: (item = "Text") => toast.success(`${item} copied`, { 
    description: "Copied to clipboard", 
    duration: 2000 
  }),
  
  formSubmitted: () => toast.success("Form submitted", { 
    description: "We'll get back to you soon" 
  }),
};
