import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SUPPORTED_CURRENCIES, useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";

interface CurrencySelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const CurrencySelector = ({ 
  value, 
  onChange, 
  disabled = false, 
  showLabel = true,
  className = ""
}: CurrencySelectorProps) => {
  const { currency, setCurrency } = useCurrency();
  const { userRole } = useAuth();

  const isControlled = value !== undefined && onChange !== undefined;
  const currentValue = isControlled ? value : currency.code;
  const isLandlord = userRole === "landlord";

  const handleChange = async (newValue: string) => {
    if (isControlled) {
      onChange(newValue);
    } else if (isLandlord) {
      try {
        await setCurrency(newValue);
      } catch (error) {
        console.error("Failed to update currency:", error);
      }
    }
  };

  // Non-landlords see read-only currency display
  if (!isLandlord && !isControlled) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
          <Globe className="h-3.5 w-3.5" />
          {currency.symbol} {currency.code}
        </Badge>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <Label htmlFor="currency-select" className="text-sm font-medium">
          Operating Currency
        </Label>
      )}
      <Select value={currentValue} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger id="currency-select" className="w-full">
          <SelectValue placeholder="Select currency">
            <div className="flex items-center gap-2">
              <span className="font-medium">{SUPPORTED_CURRENCIES.find(c => c.code === currentValue)?.symbol}</span>
              <span>{currentValue}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((curr) => (
            <SelectItem key={curr.code} value={curr.code}>
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg w-8">{curr.symbol}</span>
                <div>
                  <div className="font-medium">{curr.code}</div>
                  <div className="text-xs text-muted-foreground">{curr.name}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showLabel && (
        <p className="text-xs text-muted-foreground">
          This currency applies to all your properties and tenant portals
        </p>
      )}
    </div>
  );
};
