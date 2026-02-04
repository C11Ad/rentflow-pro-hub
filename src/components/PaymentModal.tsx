import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: {
    id: number;
    description: string;
    amount: number;
    currency?: string;
  };
  userEmail: string;
}

type PaymentMethod = "card" | "mobile_money" | "bank_transfer";

export const PaymentModal = ({ isOpen, onClose, bill, userEmail }: PaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("mobile_money");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currency = bill.currency || "GHS";
  const currencySymbols: Record<string, string> = {
    GHS: "GH₵",
    USD: "$",
    EUR: "€",
    GBP: "£",
    NGN: "₦"
  };

  const paymentMethods = [
    {
      id: "mobile_money" as PaymentMethod,
      name: "Mobile Money",
      description: "MTN MoMo, Vodafone Cash, AirtelTigo",
      icon: Smartphone,
      popular: true,
    },
    {
      id: "card" as PaymentMethod,
      name: "Credit/Debit Card",
      description: "Visa, Mastercard, Verve",
      icon: CreditCard,
      popular: false,
    },
    {
      id: "bank_transfer" as PaymentMethod,
      name: "Bank Transfer",
      description: "Direct bank account transfer",
      icon: Building2,
      popular: false,
    },
  ];

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Initialize payment with Paystack
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: {
          email: userEmail,
          amount: bill.amount,
          billId: bill.id.toString(),
          billDescription: bill.description,
          currency: currency,
          paymentChannel: selectedMethod === "mobile_money" 
            ? ["mobile_money"] 
            : selectedMethod === "card" 
            ? ["card"]
            : ["bank"],
        },
      });

      if (error) {
        console.error('Payment initialization error:', error);
        throw new Error(error.message || 'Failed to initialize payment');
      }

      if (!data.success) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method to pay {bill.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount Display */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount to Pay</span>
              <span className="text-2xl font-bold text-foreground">
                {currencySymbols[currency]} {bill.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Payment Method</Label>
            <RadioGroup
              value={selectedMethod}
              onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
              className="space-y-3"
            >
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 transition-all cursor-pointer hover:border-primary/50 ${
                      selectedMethod === method.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                    <div className="flex-1">
                      <Label
                        htmlFor={method.id}
                        className="flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Icon className="h-5 w-5" />
                        {method.name}
                        {method.popular && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-accent text-accent-foreground">
                            Popular
                          </span>
                        )}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {method.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Security Note */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              🔒 Your payment is secured by Paystack. We never store your payment information.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {currencySymbols[currency]} {bill.amount.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
