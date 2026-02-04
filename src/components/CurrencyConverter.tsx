import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calculator, Save, Trash2 } from "lucide-react";
import { useCurrency, SUPPORTED_CURRENCIES } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
}

interface CurrencyConverterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurrencyConverter = ({ isOpen, onClose }: CurrencyConverterProps) => {
  const { user } = useAuth();
  const { currency, formatAmount } = useCurrency();
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRate, setNewRate] = useState({ targetCurrency: "", rate: "" });
  const [convertAmount, setConvertAmount] = useState("");
  const [convertTo, setConvertTo] = useState("");
  const [convertedResult, setConvertedResult] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchExchangeRates();
    }
  }, [isOpen, user]);

  const fetchExchangeRates = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("exchange_rates")
        .select("*")
        .eq("landlord_id", user.id);
      
      if (error) throw error;
      setExchangeRates(data || []);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRate = async () => {
    if (!user || !newRate.targetCurrency || !newRate.rate) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { error } = await supabase.from("exchange_rates").upsert({
        landlord_id: user.id,
        base_currency: currency.code,
        target_currency: newRate.targetCurrency,
        rate: parseFloat(newRate.rate)
      }, {
        onConflict: "landlord_id,base_currency,target_currency"
      });

      if (error) throw error;
      toast.success("Exchange rate saved");
      setNewRate({ targetCurrency: "", rate: "" });
      fetchExchangeRates();
    } catch (error) {
      console.error("Error saving exchange rate:", error);
      toast.error("Failed to save exchange rate");
    }
  };

  const handleDeleteRate = async (id: string) => {
    try {
      const { error } = await supabase.from("exchange_rates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Exchange rate deleted");
      fetchExchangeRates();
    } catch (error) {
      toast.error("Failed to delete exchange rate");
    }
  };

  const handleConvert = () => {
    if (!convertAmount || !convertTo) {
      toast.error("Enter amount and select currency");
      return;
    }

    const rate = exchangeRates.find(r => r.target_currency === convertTo);
    if (!rate) {
      toast.error(`No exchange rate set for ${convertTo}`);
      return;
    }

    setConvertedResult(parseFloat(convertAmount) * rate.rate);
  };

  const availableCurrencies = SUPPORTED_CURRENCIES.filter(c => c.code !== currency.code);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-accent" />
            Currency Converter
          </DialogTitle>
          <DialogDescription>
            Set exchange rates from {currency.code} to other currencies for conversion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Exchange Rate */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <Label className="font-medium">Add/Update Exchange Rate</Label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Badge variant="secondary">{currency.code}</Badge>
                <span className="text-muted-foreground">→</span>
                <Select value={newRate.targetCurrency} onValueChange={(v) => setNewRate(prev => ({ ...prev, targetCurrency: v }))}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="To currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="number"
                step="0.0001"
                placeholder="Rate"
                className="w-24"
                value={newRate.rate}
                onChange={(e) => setNewRate(prev => ({ ...prev, rate: e.target.value }))}
              />
              <Button size="icon" onClick={handleAddRate}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Saved Rates */}
          {exchangeRates.length > 0 && (
            <div className="space-y-2">
              <Label className="font-medium">Saved Exchange Rates</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {exchangeRates.map(rate => (
                  <div key={rate.id} className="flex items-center justify-between p-2 border rounded bg-background">
                    <span className="text-sm">
                      1 {rate.base_currency} = {rate.rate} {rate.target_currency}
                    </span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteRate(rate.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Converter */}
          <div className="space-y-3 p-4 border rounded-lg">
            <Label className="font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Quick Convert
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder={`Amount in ${currency.code}`}
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground">→</span>
              <Select value={convertTo} onValueChange={setConvertTo}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  {exchangeRates.map(r => (
                    <SelectItem key={r.target_currency} value={r.target_currency}>
                      {r.target_currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleConvert} variant="secondary">Convert</Button>
            </div>
            {convertedResult !== null && (
              <div className="text-center p-3 bg-accent/10 rounded-lg">
                <span className="text-lg font-bold text-accent">
                  {convertAmount} {currency.code} = {convertedResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {convertTo}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
