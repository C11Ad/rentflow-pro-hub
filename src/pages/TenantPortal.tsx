import { Navigation } from "@/components/Navigation";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Banknote, FileText, Clock, CreditCard, AlertCircle, Home, Wrench, MessageSquare, Upload, Download, CheckCircle2, TrendingUp, Phone, Mail, MapPin, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PaymentModal } from "@/components/PaymentModal";
import { PaymentReceiptButton } from "@/components/PaymentReceiptButton";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useMaintenanceRequests } from "@/hooks/useMaintenanceRequests";
import { supabase } from "@/integrations/supabase/client";
import { generateBrandedPdf } from "@/lib/documentBranding";

interface TenantUnit {
  id: string;
  unit_number: string;
  property_name: string;
}

interface RentalContract {
  id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  rent_currency: string;
  status: string;
  content: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_date: string;
  status: string;
  notes: string | null;
  reference_number: string | null;
}

const TenantPortal = () => {
  const { user } = useAuth();
  const { formatAmount, formatCompact, formatExact, currency } = useCurrency();
  const [daysUntilDue, setDaysUntilDue] = useState(15);
  const [timeLeft, setTimeLeft] = useState({ days: 15, hours: 8, minutes: 23 });
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Real data state
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leaseInfo, setLeaseInfo] = useState<{
    unitNumber: string;
    property: string;
    leaseStart: string;
    leaseEnd: string;
    monthlyRent: number;
    securityDeposit: number;
    status: string;
  } | null>(null);
  
  // Maintenance request form state
  const [maintenanceForm, setMaintenanceForm] = useState({
    category: "",
    priority: "",
    title: "",
    description: ""
  });
  const [tenantUnit, setTenantUnit] = useState<TenantUnit | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Use the maintenance requests hook
  const { requests: maintenanceRequests, loading: requestsLoading, submitRequest, refetch } = useMaintenanceRequests({
    role: "tenant",
    userId: user?.id
  });

  // Fetch tenant's unit and related data
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!user?.id) return;
      
      // Fetch unit
      const { data: unitData, error: unitError } = await supabase
        .from("units")
        .select(`
          id,
          unit_number,
          rent_amount,
          rent_currency,
          lease_start,
          lease_end,
          property:properties(name)
        `)
        .eq("tenant_id", user.id)
        .maybeSingle();
      
      if (unitData && !unitError) {
        setTenantUnit({
          id: unitData.id,
          unit_number: unitData.unit_number,
          property_name: (unitData.property as any)?.name || "Unknown Property"
        });
        
        // Set lease info from real data
        setLeaseInfo({
          unitNumber: unitData.unit_number,
          property: (unitData.property as any)?.name || "Unknown Property",
          leaseStart: unitData.lease_start ? new Date(unitData.lease_start).toLocaleDateString() : "N/A",
          leaseEnd: unitData.lease_end ? new Date(unitData.lease_end).toLocaleDateString() : "N/A",
          monthlyRent: unitData.rent_amount,
          securityDeposit: unitData.rent_amount,
          status: "active"
        });

        // Calculate days until rent due (1st of next month)
        const today = new Date();
        const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const daysLeft = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        setDaysUntilDue(daysLeft);
        setTimeLeft({
          days: daysLeft,
          hours: Math.floor((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60)) % 24,
          minutes: Math.floor((nextDue.getTime() - today.getTime()) / (1000 * 60)) % 60
        });
      }
      
      // Fetch contracts
      const { data: contractsData } = await supabase
        .from("rental_contracts")
        .select("*")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false });
      
      if (contractsData) {
        setContracts(contractsData);
      }
      
      // Fetch payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", user.id)
        .order("payment_date", { ascending: false });
      
      if (paymentsData) {
        setPayments(paymentsData);
      }
    };
    
    fetchTenantData();
  }, [user?.id]);

  const handleRefresh = async () => {
    await refetch();
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Portal refreshed");
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59 };
        } else if (prev.days > 0) {
          return { days: prev.days - 1, hours: 23, minutes: 59 };
        }
        return prev;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Generate outstanding bills from lease info
  const outstandingBills = leaseInfo ? [
    { id: "rent", description: `Monthly Rent - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, amount: leaseInfo.monthlyRent, dueDate: `${new Date().toLocaleString('default', { month: 'short' })} 1, ${new Date().getFullYear()}`, status: daysUntilDue < 0 ? "overdue" : "pending" },
  ] : [];

  // Use real payments for history
  const paymentHistory = payments.filter(p => p.status === "completed").map(p => ({
    id: p.id,
    date: new Date(p.payment_date).toLocaleDateString(),
    description: p.notes || "Monthly Rent",
    amount: p.amount,
    status: "paid",
    receipt: p.reference_number || `REC-${p.id.slice(0, 8)}`
  }));

  // Generate documents from contracts
  const documents = contracts.map(c => ({
    id: c.id,
    name: `Lease Agreement - ${new Date(c.start_date).getFullYear()}`,
    type: "Contract",
    date: new Date(c.created_at).toLocaleDateString(),
    content: c.content
  }));

  // Messages will show notices from landlord
  const [messages, setMessages] = useState<{
    id: string;
    from: string;
    subject: string;
    date: string;
    read: boolean;
    preview: string;
  }[]>([]);
  
  // Fetch messages/notices for tenant
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user?.id) return;
      
      // Get notices that might be relevant to this tenant
      const { data: noticesData } = await supabase
        .from("notices")
        .select("id, title, content, author, created_at, type")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (noticesData) {
        const formattedMessages = noticesData.map(notice => ({
          id: notice.id,
          from: notice.author || "Property Management",
          subject: notice.title,
          date: formatRelativeDate(notice.created_at),
          read: true, // Could track read status in a separate table
          preview: notice.content.substring(0, 100) + (notice.content.length > 100 ? "..." : "")
        }));
        setMessages(formattedMessages);
      }
    };
    
    fetchMessages();
  }, [user?.id]);
  
  // Helper to format relative dates
  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const totalOutstanding = outstandingBills.reduce((sum, bill) => sum + bill.amount, 0);
  const progressValue = ((30 - daysUntilDue) / 30) * 100;

  const handlePayNow = (bill: any) => {
    setSelectedBill(bill);
    setIsPaymentModalOpen(true);
  };

  const handleMaintenanceSubmit = async () => {
    if (!tenantUnit) {
      toast.error("No unit assigned to your account. Please contact your landlord.");
      return;
    }
    
    if (!maintenanceForm.category || !maintenanceForm.priority || !maintenanceForm.title || !maintenanceForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setSubmitting(true);
    const result = await submitRequest({
      unit_id: tenantUnit.id,
      title: maintenanceForm.title,
      description: maintenanceForm.description,
      category: maintenanceForm.category,
      priority: maintenanceForm.priority
    });
    
    if (result.success) {
      setMaintenanceForm({ category: "", priority: "", title: "", description: "" });
    }
    setSubmitting(false);
  };

  const handleDownload = (docName: string) => {
    toast.success(`Downloading ${docName}...`);
  };

  const handleDocumentDownload = async (doc: { id: string; name: string; type: string; date: string; content: string | null }) => {
    try {
      const content = doc.content || `
${doc.name}

Property: ${leaseInfo?.property || "Property"}
Unit: ${leaseInfo?.unitNumber || "Unit"}

Lease Period: ${leaseInfo?.leaseStart || "N/A"} - ${leaseInfo?.leaseEnd || "N/A"}
Monthly Rent: ${leaseInfo?.monthlyRent?.toLocaleString() || "N/A"}

This is an official document from CribHub Property Management.
`;
      
      const pdf = await generateBrandedPdf(
        doc.name,
        content,
        doc.type,
        leaseInfo?.property || "Property",
        doc.id
      );
      
      pdf.save(`${doc.name.replace(/\s+/g, '_')}.pdf`);
      toast.success("Document downloaded as PDF");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Tenant Portal</h1>
            <p className="text-muted-foreground text-justify max-w-4xl">
              Your complete rental management hub - track payments, submit maintenance requests, access documents, and communicate with your property team all in one place.
            </p>
          </div>
          <CurrencySelector showLabel={false} />
        </div>

        {/* Lease Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lease Status</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent-green to-accent-green/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-5 w-5 text-accent-green-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">{leaseInfo?.status || "No Lease"}</div>
              <p className="text-xs text-muted-foreground">
                Expires: {leaseInfo?.leaseEnd || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl overflow-hidden group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Rent</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-glow">
                <Banknote className="h-5 w-5 text-accent-foreground" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-2xl font-bold text-accent mb-2 cursor-help">{formatCompact(leaseInfo?.monthlyRent || 0)}</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatExact(leaseInfo?.monthlyRent || 0)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-xs text-foreground font-medium">
                Unit {leaseInfo?.unitNumber || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Next Payment</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5 w-5 text-warning-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">{timeLeft.days}d {timeLeft.hours}h</div>
              <p className="text-xs text-muted-foreground">
                Due: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Payment Score</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">98%</div>
              <p className="text-xs text-muted-foreground">
                Excellent record
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Countdown */}
        <Card className="mb-8 border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                  <Clock className="h-6 w-6 text-accent" />
                  Payment Countdown
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Real-time countdown to your next rent payment deadline
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2 border-warning text-warning">
                Due Soon
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 mb-4">
              <div className="text-center p-4 bg-card rounded-xl border-2 border-border/50 hover:border-accent transition-colors">
                <div className="text-4xl font-bold text-accent mb-1">{timeLeft.days}</div>
                <div className="text-sm text-muted-foreground font-medium">Days</div>
              </div>
              <div className="text-center p-4 bg-card rounded-xl border-2 border-border/50 hover:border-accent transition-colors">
                <div className="text-4xl font-bold text-accent mb-1">{timeLeft.hours}</div>
                <div className="text-sm text-muted-foreground font-medium">Hours</div>
              </div>
              <div className="text-center p-4 bg-card rounded-xl border-2 border-border/50 hover:border-accent transition-colors">
                <div className="text-4xl font-bold text-accent mb-1">{timeLeft.minutes}</div>
                <div className="text-sm text-muted-foreground font-medium">Minutes</div>
              </div>
            </div>
            <Progress value={progressValue} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Payment due on <span className="font-semibold text-foreground">January 1, 2025</span>
            </p>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
            <TabsTrigger value="payments" className="flex items-center gap-2 py-3">
              <Banknote className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2 py-3">
              <Wrench className="h-4 w-4" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2 py-3">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 py-3">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            {/* Outstanding Bills */}
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
                      <AlertCircle className="h-6 w-6 text-warning" />
                      Outstanding Bills
                    </CardTitle>
                    <CardDescription className="text-base">
                      Review pending charges and make secure payments
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-2xl font-bold text-destructive cursor-help">{formatCompact(totalOutstanding)}</div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatExact(totalOutstanding)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-sm text-muted-foreground">Total Due</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {outstandingBills.map((bill) => (
                    <div key={bill.id} className={`p-4 border-2 rounded-xl transition-all hover:shadow-md ${
                      bill.status === 'overdue' 
                        ? 'border-destructive/50 bg-destructive/5' 
                        : 'border-warning/50 bg-warning/5 hover:bg-warning/10'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`mt-1 p-3 rounded-xl ${
                            bill.status === 'overdue' ? 'bg-destructive/20' : 'bg-warning/20'
                          }`}>
                            <FileText className={`h-6 w-6 ${
                              bill.status === 'overdue' ? 'text-destructive' : 'text-warning'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground text-lg">{bill.description}</h3>
                            <p className="text-sm text-muted-foreground mt-1">Due: {bill.dueDate}</p>
                            {bill.status === 'overdue' && (
                              <Badge variant="destructive" className="mt-2">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-foreground">{formatAmount(bill.amount)}</div>
                          </div>
                          <Button 
                            size="lg" 
                            className="bg-accent hover:bg-accent/90 shadow-glow"
                            onClick={() => handlePayNow(bill)}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 bg-gradient-to-r from-accent to-accent/80 hover:opacity-90 h-12 text-base font-semibold" size="lg">
                  Pay All Bills - {formatAmount(totalOutstanding)}
                </Button>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-accent-green" />
                  Payment History
                </CardTitle>
                <CardDescription className="text-base">
                  Complete record of all rental payments and transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payment history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-accent-green/20">
                            <CheckCircle2 className="h-5 w-5 text-accent-green" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{payment.description}</h4>
                            <p className="text-sm text-muted-foreground">{payment.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold text-foreground">{formatAmount(payment.amount)}</div>
                            <div className="text-xs text-muted-foreground">{payment.receipt}</div>
                          </div>
                          <PaymentReceiptButton
                            payment={{
                              id: payment.id,
                              amount: payment.amount,
                              currency: currency.code,
                              payment_method: "Bank Transfer",
                              payment_date: payment.date,
                              reference_number: payment.receipt,
                              payer_name: user?.email || "Tenant",
                              notes: payment.description
                            }}
                            tenantName={user?.email || "Tenant"}
                            propertyAddress={leaseInfo?.property || "Property"}
                            unitNumber={leaseInfo?.unitNumber || "N/A"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            {/* Submit New Request */}
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
                  <Wrench className="h-6 w-6 text-accent" />
                  Submit Maintenance Request
                </CardTitle>
                <CardDescription className="text-base">
                  Report issues or request repairs with detailed information and photos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenantUnit && (
                    <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-sm text-muted-foreground">Submitting for: <span className="font-medium text-foreground">{tenantUnit.property_name} - Unit {tenantUnit.unit_number}</span></p>
                    </div>
                  )}
                  {!tenantUnit && (
                    <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <p className="text-sm text-warning">No unit assigned to your account. Please contact your landlord to be assigned to a unit.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={maintenanceForm.category} onValueChange={(value) => setMaintenanceForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Plumbing">Plumbing</SelectItem>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="HVAC">HVAC</SelectItem>
                          <SelectItem value="Appliance">Appliance</SelectItem>
                          <SelectItem value="General">General Repair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={maintenanceForm.priority} onValueChange={(value) => setMaintenanceForm(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger id="priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High - Emergency</SelectItem>
                          <SelectItem value="medium">Medium - Important</SelectItem>
                          <SelectItem value="low">Low - Non-urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Issue Title</Label>
                    <Input 
                      id="title" 
                      placeholder="Brief description of the issue"
                      value={maintenanceForm.title}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Provide as much detail as possible about the issue, including when it started and any relevant information..."
                      rows={4}
                      value={maintenanceForm.description}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photos">Upload Photos</Label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent transition-colors cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 10MB each (max 5 photos)
                      </p>
                      <Input id="photos" type="file" multiple accept="image/*" className="hidden" />
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-accent hover:bg-accent/90 h-12 text-base font-semibold shadow-glow"
                    onClick={handleMaintenanceSubmit}
                    disabled={submitting || !tenantUnit}
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Requests */}
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl font-bold">Active Maintenance Requests</CardTitle>
                <CardDescription className="text-base">
                  Track the status of your pending and in-progress maintenance requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {maintenanceRequests.filter(r => r.status !== 'completed').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active maintenance requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {maintenanceRequests.filter(r => r.status !== 'completed').map((request) => (
                      <div key={request.id} className={`p-4 border-2 rounded-xl transition-all hover:shadow-md ${
                        request.status === 'in_progress'
                        ? 'border-accent/50 bg-accent/5'
                        : 'border-warning/50 bg-warning/5'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-foreground text-lg">{request.title}</h4>
                              <Badge 
                                variant="secondary"
                                className={
                                  request.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                                  request.priority === 'medium' ? 'bg-warning/20 text-warning' :
                                  'bg-accent/20 text-accent'
                                }
                              >
                                {request.priority} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{request.category} • Submitted {new Date(request.created_at).toLocaleDateString()}</p>
                          </div>
                          <Badge 
                            className={
                              request.status === 'in_progress' ? 'bg-accent text-accent-foreground' :
                              'bg-warning text-warning-foreground'
                            }
                          >
                            {request.status === 'in_progress' ? 'In Progress' : request.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>ETA: {request.estimated_completion ? new Date(request.estimated_completion).toLocaleDateString() : "Pending"}</span>
                          </div>
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Requests History */}
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-accent-green" />
                  Maintenance History
                </CardTitle>
                <CardDescription className="text-base">
                  View completed maintenance requests and their resolution details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {maintenanceRequests.filter(r => r.status === 'completed').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed maintenance requests yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {maintenanceRequests.filter(r => r.status === 'completed').map((request) => (
                        <div key={request.id} className="p-4 border-2 rounded-xl transition-all hover:shadow-md border-accent-green/50 bg-accent-green/5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-foreground text-lg">{request.title}</h4>
                                <Badge 
                                  variant="secondary"
                                  className={
                                    request.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                                    request.priority === 'medium' ? 'bg-warning/20 text-warning' :
                                    'bg-accent/20 text-accent'
                                  }
                                >
                                  {request.priority} priority
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{request.category} • Submitted {new Date(request.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge className="bg-accent-green text-accent-green-foreground">
                              Completed
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4 text-accent-green" />
                              <span>Completed: {request.completed_at ? new Date(request.completed_at).toLocaleDateString() : "N/A"}</span>
                            </div>
                            <Button size="sm" variant="outline">View Details</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-accent" />
                  Lease Documents
                </CardTitle>
                <CardDescription className="text-base">
                  Access and download important lease documents and agreements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents available yet</p>
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="p-4 border-2 border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-accent/20 group-hover:bg-accent/30 transition-colors">
                            <FileText className="h-6 w-6 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground mb-1">{doc.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                              <span>{doc.type}</span>
                              <span>•</span>
                              <span>{doc.date}</span>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => handleDocumentDownload(doc)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Manager Contact */}
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
                  <User className="h-6 w-6 text-primary" />
                  Property Manager Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-4">John Smith</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-accent/20">
                          <Phone className="h-4 w-4 text-accent" />
                        </div>
                        <span className="text-muted-foreground">(555) 123-4567</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-accent/20">
                          <Mail className="h-4 w-4 text-accent" />
                        </div>
                        <span className="text-muted-foreground">john.smith@sunsetapts.com</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-accent/20">
                          <Home className="h-4 w-4 text-accent" />
                        </div>
                        <span className="text-muted-foreground">Sunset Apartments Office</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground mb-4">Office Hours</h4>
                    <p className="text-sm text-muted-foreground">Monday - Friday: 9 AM - 6 PM</p>
                    <p className="text-sm text-muted-foreground">Saturday: 10 AM - 4 PM</p>
                    <p className="text-sm text-muted-foreground">Sunday: Closed</p>
                    <p className="text-sm text-destructive font-medium mt-4">
                      Emergency Line: (555) 999-0000
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-accent" />
                  Messages & Notifications
                </CardTitle>
                <CardDescription className="text-base">
                  Communication from your property manager and maintenance team
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages or notifications yet</p>
                    <p className="text-sm mt-2">Check back later for updates from your property manager</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`p-4 border-2 rounded-xl transition-all hover:shadow-md cursor-pointer ${
                            message.read 
                              ? 'border-border bg-muted/30' 
                              : 'border-accent/50 bg-accent/5'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${
                              message.read ? 'bg-muted' : 'bg-accent/20'
                            }`}>
                              <MessageSquare className={`h-5 w-5 ${
                                message.read ? 'text-muted-foreground' : 'text-accent'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-foreground">{message.subject}</h4>
                                {!message.read && (
                                  <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{message.from} • {message.date}</p>
                              <p className="text-sm text-foreground">{message.preview}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Payment Modal */}
      {selectedBill && user && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          bill={selectedBill}
          userEmail={user.email || ''}
        />
      )}
    </div>
    </PullToRefresh>
  );
};

export default TenantPortal;