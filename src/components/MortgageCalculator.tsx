import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calculator, TrendingUp, Calendar, Percent, Home } from "lucide-react";
import cribhubLogo from "@/assets/cribhub-logo.png";

interface MortgageCalculatorProps {
  propertyPrice: number;
  currency?: string;
  propertyName?: string;
  onContactBroker?: () => void;
}

export function MortgageCalculator({ 
  propertyPrice, 
  currency = "GHS",
  propertyName,
  onContactBroker 
}: MortgageCalculatorProps) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(18);
  const [loanTermYears, setLoanTermYears] = useState(15);

  const downPayment = (propertyPrice * downPaymentPercent) / 100;
  const loanAmount = propertyPrice - downPayment;
  
  // Monthly interest rate
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  
  // Monthly payment calculation using standard mortgage formula
  const monthlyPayment = monthlyRate > 0
    ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    : loanAmount / numberOfPayments;

  const totalPayment = monthlyPayment * numberOfPayments;
  const totalInterest = totalPayment - loanAmount;

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Mortgage Calculator</CardTitle>
              <CardDescription>Estimate your monthly payments</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Powered by</span>
            <img src={cribhubLogo} alt="CribHub" className="h-6 object-contain" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Price Display */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Property Price</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(propertyPrice)}</p>
          {propertyName && (
            <p className="text-xs text-muted-foreground mt-1">{propertyName}</p>
          )}
        </div>

        {/* Down Payment Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              Down Payment
            </Label>
            <Badge variant="secondary">{downPaymentPercent}%</Badge>
          </div>
          <Slider
            value={[downPaymentPercent]}
            onValueChange={(value) => setDownPaymentPercent(value[0])}
            min={10}
            max={50}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10%</span>
            <span className="font-medium text-foreground">{formatCurrency(downPayment)}</span>
            <span>50%</span>
          </div>
        </div>

        {/* Interest Rate Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              Interest Rate (Annual)
            </Label>
            <Badge variant="secondary">{interestRate}%</Badge>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={(value) => setInterestRate(value[0])}
            min={8}
            max={30}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>8%</span>
            <span>30%</span>
          </div>
        </div>

        {/* Loan Term Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Loan Term
            </Label>
            <Badge variant="secondary">{loanTermYears} years</Badge>
          </div>
          <Slider
            value={[loanTermYears]}
            onValueChange={(value) => setLoanTermYears(value[0])}
            min={5}
            max={25}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 years</span>
            <span>25 years</span>
          </div>
        </div>

        {/* Results */}
        <div className="bg-primary/10 rounded-xl p-5 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(monthlyPayment)}</p>
            <p className="text-xs text-muted-foreground mt-1">per month</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/20">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Loan Amount</p>
              <p className="font-semibold text-sm">{formatCurrency(loanAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Interest</p>
              <p className="font-semibold text-sm">{formatCurrency(totalInterest)}</p>
            </div>
          </div>
        </div>

        {/* CribHub CTA */}
        <div className="bg-accent/10 rounded-lg p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <img src={cribhubLogo} alt="CribHub" className="h-8 object-contain" />
          </div>
          <p className="text-sm text-muted-foreground">
            Get personalized mortgage rates from trusted lenders through CribHub
          </p>
          <Button 
            onClick={onContactBroker} 
            className="w-full gap-2"
            variant="default"
          >
            <TrendingUp className="h-4 w-4" />
            Contact CribHub for Mortgage
          </Button>
          <p className="text-xs text-muted-foreground">
            *Rates shown are estimates. Actual rates depend on your credit profile.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact inline version for property cards
export function MortgageBadge({ eligible }: { eligible: boolean }) {
  if (!eligible) return null;
  
  return (
    <Badge className="bg-accent-green/20 text-accent-green-foreground border-accent-green/30 gap-1">
      <img src={cribhubLogo} alt="" className="h-3 w-3 object-contain" />
      Mortgage Available
    </Badge>
  );
}

// Dialog wrapper for the calculator
export function MortgageCalculatorDialog({ 
  children, 
  propertyPrice, 
  currency = "GHS",
  propertyName
}: { 
  children: React.ReactNode;
  propertyPrice: number;
  currency?: string;
  propertyName?: string;
}) {
  const [open, setOpen] = useState(false);

  const handleContactBroker = () => {
    // Open CribHub contact - could be a form or redirect
    window.open('mailto:mortgage@cribhub.com?subject=Mortgage Inquiry&body=I am interested in mortgage financing for a property priced at ' + currency + ' ' + propertyPrice.toLocaleString(), '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <MortgageCalculator 
          propertyPrice={propertyPrice} 
          currency={currency}
          propertyName={propertyName}
          onContactBroker={handleContactBroker}
        />
      </DialogContent>
    </Dialog>
  );
}
