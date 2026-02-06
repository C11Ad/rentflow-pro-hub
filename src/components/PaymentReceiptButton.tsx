import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Receipt, Loader2 } from "lucide-react";
import { generateReceiptPdf } from "@/lib/documentBranding";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentReceiptButtonProps {
  payment: {
    id: string;
    amount: number;
    currency: string;
    payment_method: string | null;
    payment_date: string;
    reference_number: string | null;
    payer_name: string | null;
    notes: string | null;
  };
  tenantName: string;
  propertyAddress: string;
  unitNumber: string;
  landlordName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const PaymentReceiptButton = ({
  payment,
  tenantName,
  propertyAddress,
  unitNumber,
  landlordName,
  variant = "outline",
  size = "sm",
}: PaymentReceiptButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const getReceiptData = () => {
    const paymentDateObj = new Date(payment.payment_date);
    const monthYear = paymentDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    return {
      receiptNumber: payment.reference_number || `RCP-${payment.id.slice(0, 8).toUpperCase()}`,
      tenantName: payment.payer_name || tenantName,
      propertyAddress,
      unitNumber,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.payment_method?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "N/A",
      paymentDate: paymentDateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      description: payment.notes || "Monthly Rent Payment",
      landlordName,
      transactionId: payment.id.toUpperCase(),
      paymentPeriod: monthYear,
    };
  };

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    
    try {
      const receiptData = getReceiptData();
      const pdf = await generateReceiptPdf(receiptData);
      pdf.save(`CribHub-Receipt-${receiptData.receiptNumber}.pdf`);
      toast.success("Receipt PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating receipt PDF:", error);
      toast.error("Failed to generate receipt PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Receipt className="h-4 w-4 mr-1" />
              Receipt
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleGeneratePdf}>
          <Receipt className="h-4 w-4 mr-2" />
          Download PDF (Recommended)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
