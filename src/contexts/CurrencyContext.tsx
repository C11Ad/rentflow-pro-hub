import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimalSeparator: string;
  thousandsSeparator: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi", decimalSeparator: ".", thousandsSeparator: ",", decimals: 2 },
  { code: "USD", symbol: "$", name: "US Dollar", decimalSeparator: ".", thousandsSeparator: ",", decimals: 2 },
  { code: "EUR", symbol: "€", name: "Euro", decimalSeparator: ",", thousandsSeparator: ".", decimals: 2 },
  { code: "GBP", symbol: "£", name: "British Pound", decimalSeparator: ".", thousandsSeparator: ",", decimals: 2 },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", decimalSeparator: ".", thousandsSeparator: ",", decimals: 2 },
];

interface CurrencyContextType {
  currency: CurrencyConfig;
  setCurrency: (code: string) => Promise<void>;
  formatAmount: (amount: number) => string;
  formatCompact: (amount: number) => string;
  formatExact: (amount: number) => string;
  loading: boolean;
  landlordId: string | null;
}

const defaultCurrency = SUPPORTED_CURRENCIES.find(c => c.code === "GHS") || SUPPORTED_CURRENCIES[0];

const CurrencyContext = createContext<CurrencyContextType>({
  currency: defaultCurrency,
  setCurrency: async () => {},
  formatAmount: (amount) => `${defaultCurrency.symbol}${amount.toFixed(2)}`,
  formatCompact: (amount) => `${defaultCurrency.symbol}${amount.toFixed(2)}`,
  formatExact: (amount) => `${defaultCurrency.symbol}${amount.toFixed(2)}`,
  loading: true,
  landlordId: null,
});

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole } = useAuth();
  const [currency, setCurrencyState] = useState<CurrencyConfig>(defaultCurrency);
  const [loading, setLoading] = useState(true);
  const [landlordId, setLandlordId] = useState<string | null>(null);

  // Format amount with proper currency formatting (full precision)
  const formatAmount = useCallback((amount: number): string => {
    const parts = amount.toFixed(currency.decimals).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
    const decimalPart = parts[1];
    return `${currency.symbol}${integerPart}${currency.decimalSeparator}${decimalPart}`;
  }, [currency]);

  // Format amount as exact (same as formatAmount but explicit naming)
  const formatExact = useCallback((amount: number): string => {
    return formatAmount(amount);
  }, [formatAmount]);

  // Format amount in compact form (e.g., 15k, 1.2M)
  const formatCompact = useCallback((amount: number): string => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    
    if (absAmount >= 1000000) {
      const value = absAmount / 1000000;
      return `${sign}${currency.symbol}${value.toFixed(value % 1 === 0 ? 0 : 1)}M`;
    } else if (absAmount >= 1000) {
      const value = absAmount / 1000;
      return `${sign}${currency.symbol}${value.toFixed(value % 1 === 0 ? 0 : 1)}k`;
    } else {
      return `${sign}${currency.symbol}${absAmount.toFixed(0)}`;
    }
  }, [currency]);

  // Fetch currency based on user role
  const fetchCurrency = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      let currencyCode = "GHS";
      let effectiveLandlordId: string | null = null;

      if (userRole === "landlord") {
        // Landlord: get their own currency setting
        const { data, error } = await supabase
          .from("profiles")
          .select("default_currency")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          currencyCode = data.default_currency;
          effectiveLandlordId = user.id;
        }
      } else if (userRole === "tenant") {
        // Tenant: get currency from their landlord via their unit
        const { data: unitData, error: unitError } = await supabase
          .from("units")
          .select(`
            property_id,
            properties!inner (
              landlord_id,
              profiles:landlord_id (default_currency)
            )
          `)
          .eq("tenant_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!unitError && unitData?.properties) {
          const properties = unitData.properties as any;
          if (properties.profiles?.default_currency) {
            currencyCode = properties.profiles.default_currency;
          }
          effectiveLandlordId = properties.landlord_id;
        }
      } else if (userRole === "property_manager") {
        // Property manager: get currency from any property they manage
        const { data: propData, error: propError } = await supabase
          .from("properties")
          .select(`
            landlord_id,
            profiles:landlord_id (default_currency)
          `)
          .limit(1)
          .maybeSingle();

        if (!propError && propData?.profiles) {
          const profiles = propData.profiles as any;
          if (profiles.default_currency) {
            currencyCode = profiles.default_currency;
          }
          effectiveLandlordId = propData.landlord_id;
        }
      }

      const foundCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
      setCurrencyState(foundCurrency || defaultCurrency);
      setLandlordId(effectiveLandlordId);
    } catch (error) {
      console.error("Error fetching currency:", error);
    } finally {
      setLoading(false);
    }
  }, [user, userRole]);

  // Set currency (only for landlords)
  const setCurrency = async (code: string): Promise<void> => {
    if (!user || userRole !== "landlord") {
      throw new Error("Only landlords can change currency settings");
    }

    const newCurrency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    if (!newCurrency) {
      throw new Error("Invalid currency code");
    }

    const { error } = await supabase
      .from("profiles")
      .update({ default_currency: code })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    setCurrencyState(newCurrency);
  };

  // Subscribe to real-time currency updates from landlord
  useEffect(() => {
    if (!landlordId) return;

    const channel = supabase
      .channel('currency-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${landlordId}`,
        },
        (payload) => {
          const newCurrencyCode = (payload.new as any).default_currency;
          const foundCurrency = SUPPORTED_CURRENCIES.find(c => c.code === newCurrencyCode);
          if (foundCurrency) {
            setCurrencyState(foundCurrency);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [landlordId]);

  useEffect(() => {
    fetchCurrency();
  }, [fetchCurrency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, formatCompact, formatExact, loading, landlordId }}>
      {children}
    </CurrencyContext.Provider>
  );
};
