import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface StrengthCheck {
  label: string;
  test: (password: string) => boolean;
}

const strengthChecks: StrengthCheck[] = [
  { label: "At least 6 characters", test: (p) => p.length >= 6 },
  { label: "Contains uppercase", test: (p) => /[A-Z]/.test(p) },
  { label: "Contains lowercase", test: (p) => /[a-z]/.test(p) },
  { label: "Contains number", test: (p) => /\d/.test(p) },
  { label: "Contains special character", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  const { strength, passedChecks, strengthLabel, strengthColor } = useMemo(() => {
    if (!password) {
      return { strength: 0, passedChecks: [], strengthLabel: "", strengthColor: "" };
    }

    const passed = strengthChecks.filter((check) => check.test(password));
    const score = passed.length;

    let label = "";
    let color = "";

    if (score <= 1) {
      label = "Weak";
      color = "bg-destructive";
    } else if (score === 2) {
      label = "Fair";
      color = "bg-orange-500";
    } else if (score === 3) {
      label = "Good";
      color = "bg-yellow-500";
    } else if (score === 4) {
      label = "Strong";
      color = "bg-primary";
    } else {
      label = "Very Strong";
      color = "bg-green-500";
    }

    return {
      strength: score,
      passedChecks: passed.map((c) => c.label),
      strengthLabel: label,
      strengthColor: color,
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            strength <= 1 && "text-destructive",
            strength === 2 && "text-orange-500",
            strength === 3 && "text-yellow-600",
            strength === 4 && "text-primary",
            strength >= 5 && "text-green-600"
          )}>
            {strengthLabel}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                strength >= level ? strengthColor : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-1 gap-1">
        {strengthChecks.map((check) => {
          const passed = check.test(password);
          return (
            <div
              key={check.label}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                passed ? "text-green-600" : "text-muted-foreground"
              )}
            >
              {passed ? (
                <Check className="h-3 w-3 flex-shrink-0" />
              ) : (
                <X className="h-3 w-3 flex-shrink-0" />
              )}
              <span>{check.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
