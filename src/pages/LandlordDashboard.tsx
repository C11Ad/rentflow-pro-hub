import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Building2, Users, Banknote, FileCheck, AlertCircle, CheckCircle2, Clock, MessageSquare, Bell, Calendar, TrendingDown, ArrowUpRight, AlertTriangle, Settings, Plus, Eye, Home, MapPin, Wrench, User, Filter, Trash2, UserPlus, Send, RefreshCw, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencySelector } from "@/components/CurrencySelector";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMaintenanceRequests } from "@/hooks/useMaintenanceRequests";
import { useSmsReminder } from "@/hooks/useSmsReminder";
import { format, differenceInDays, isPast, isFuture } from "date-fns";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  property_type: string;
  total_units: number;
  description: string | null;
}

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  status: string;
  rent_amount: number;
  rent_currency: string;
  tenant_id: string | null;
  lease_end: string | null;
  manual_tenant_name: string | null;
}

interface PropertyWithStats extends Property {
  units: Unit[];
  occupied: number;
  vacant: number;
  revenue: number;
}

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  payment_date: string;
  status: string;
  unit_id: string;
}

interface Communication {
  id: string;
  type: string;
  from_name: string;
  property: string;
  message: string;
  is_read: boolean;
  is_manual_entry: boolean;
  created_at: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
  author: string;
  is_manual_entry: boolean;
  sms_sent: boolean;
  created_at: string;
}

interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: string;
  status: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string;
  };
}

const COLORS = ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(var(--accent-green))", "hsl(var(--warning))", "hsl(var(--secondary))"];

const LandlordDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formatAmount, formatCompact, formatExact, currency } = useCurrency();
  const { sendSmsReminder } = useSmsReminder();
  const [properties, setProperties] = useState<PropertyWithStats[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    request: any | null;
    action: "complete" | "scheduled" | "in_progress" | "delegate_payment" | null;
  }>({ isOpen: false, request: null, action: null });
  const [scheduledDate, setScheduledDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  // Communications state
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isAddCommunicationOpen, setIsAddCommunicationOpen] = useState(false);
  const [communicationForm, setCommunicationForm] = useState({
    type: "general", fromName: "", property: "", message: ""
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "communication" | "notice"; id: string } | null>(null);

  // Notices state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isAddNoticeOpen, setIsAddNoticeOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: "", content: "", type: "info", sendSms: false, smsPhone: ""
  });

  // Currency converter
  const [showConverter, setShowConverter] = useState(false);

  // Role requests (manager requests)
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);

  // Financial breakdown dialog state
  const [financialBreakdownDialog, setFinancialBreakdownDialog] = useState<{
    isOpen: boolean;
    title: string;
    type: "revenue" | "expenses" | "netIncome" | null;
  }>({ isOpen: false, title: "", type: null });

  // Maintenance requests hook
  const { 
    requests: maintenanceRequests, 
    loading: requestsLoading, 
    updateRequestStatus,
    updateRequest,
    deleteRequest,
    refetch: refetchRequests 
  } = useMaintenanceRequests({
    role: "landlord",
    userId: user?.id,
    propertyFilter
  });

  // Maintenance edit/delete state
  const [maintenanceEditDialog, setMaintenanceEditDialog] = useState<{
    isOpen: boolean;
    request: any | null;
  }>({ isOpen: false, request: null });
  const [maintenanceDeleteDialog, setMaintenanceDeleteDialog] = useState<{
    isOpen: boolean;
    request: any | null;
  }>({ isOpen: false, request: null });
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: ""
  });

  useEffect(() => {
    if (user) {
      fetchPropertiesWithStats();
      fetchPayments();
      fetchCommunications();
      fetchNotices();
      fetchRoleRequests();
    }
  }, [user]);

  const fetchRoleRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("role_requests")
        .select(`
          id,
          user_id,
          requested_role,
          status,
          created_at
        `)
        .eq("status", "pending")
        .eq("requested_role", "property_manager")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch profile info for each request
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (req) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", req.user_id)
            .maybeSingle();
          
          return {
            ...req,
            profile: profileData || { full_name: null, email: "Unknown" }
          };
        })
      );
      
      setRoleRequests(requestsWithProfiles);
    } catch (error) {
      console.error("Error fetching role requests:", error);
    }
  };

  const fetchPayments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("landlord_id", user.id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchPropertiesWithStats = async () => {
    try {
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (propertiesError) throw propertiesError;

      const propertyIds = propertiesData?.map(p => p.id) || [];
      const { data: unitsData, error: unitsError } = await supabase
        .from("units")
        .select("*")
        .in("property_id", propertyIds);

      if (unitsError) throw unitsError;

      const propertiesWithStats: PropertyWithStats[] = (propertiesData || []).map(property => {
        const propertyUnits = (unitsData || []).filter(u => u.property_id === property.id);
        const occupied = propertyUnits.filter(u => u.status === "occupied").length;
        const vacant = propertyUnits.filter(u => u.status === "vacant").length;
        // Sum of all unit rent amounts = total property rental fee
        const revenue = propertyUnits.reduce((sum, u) => sum + Number(u.rent_amount), 0);

        return { ...property, units: propertyUnits, occupied, vacant, revenue };
      });

      setProperties(propertiesWithStats);
    } catch (error: any) {
      toast.error("Failed to load properties");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("communications")
        .select("*")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCommunications(data || []);
    } catch (error) {
      console.error("Error fetching communications:", error);
    }
  };

  const fetchNotices = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  const handleAddCommunication = async () => {
    if (!user || !communicationForm.fromName || !communicationForm.message) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const { error } = await supabase.from("communications").insert({
        landlord_id: user.id,
        type: communicationForm.type,
        from_name: communicationForm.fromName,
        property: communicationForm.property || "All Properties",
        message: communicationForm.message,
        is_manual_entry: true
      });
      if (error) throw error;
      toast.success("Communication added");
      setCommunicationForm({ type: "general", fromName: "", property: "", message: "" });
      setIsAddCommunicationOpen(false);
      fetchCommunications();
    } catch (error) {
      toast.error("Failed to add communication");
    }
  };

  const handleAddNotice = async () => {
    if (!user || !noticeForm.title || !noticeForm.content) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const { error } = await supabase.from("notices").insert({
        landlord_id: user.id,
        title: noticeForm.title,
        content: noticeForm.content,
        type: noticeForm.type,
        author: "Landlord",
        is_manual_entry: true,
        sms_sent: noticeForm.sendSms && !!noticeForm.smsPhone
      });
      if (error) throw error;

      // Send SMS if requested
      if (noticeForm.sendSms && noticeForm.smsPhone) {
        await sendSmsReminder({
          to: noticeForm.smsPhone,
          message: `Notice: ${noticeForm.title} - ${noticeForm.content.substring(0, 100)}${noticeForm.content.length > 100 ? '...' : ''} - Cribhub`,
          reminderType: "general"
        });
      }

      toast.success("Notice added" + (noticeForm.sendSms ? " and SMS sent" : ""));
      setNoticeForm({ title: "", content: "", type: "info", sendSms: false, smsPhone: "" });
      setIsAddNoticeOpen(false);
      fetchNotices();
    } catch (error) {
      toast.error("Failed to add notice");
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from(itemToDelete.type === "communication" ? "communications" : "notices")
        .delete()
        .eq("id", itemToDelete.id);
      if (error) throw error;
      
      toast.success(`${itemToDelete.type === "communication" ? "Communication" : "Notice"} deleted`);
      if (itemToDelete.type === "communication") fetchCommunications();
      else fetchNotices();
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const openDeleteConfirm = (type: "communication" | "notice", id: string) => {
    setItemToDelete({ type, id });
    setDeleteConfirmOpen(true);
  };

  // Generate revenue data from actual payments (last 6 months)
  const revenueData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const result = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      
      const monthPayments = payments.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear() &&
               p.status === "completed";
      });
      
      const revenue = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      result.push({ month: monthName, revenue });
    }
    return result;
  }, [payments]);

  // Generate cash flow data from payments (inflow only - real data)
  const cashFlowData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const result = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      
      const monthPayments = payments.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear() &&
               p.status === "completed";
      });
      
      const inflow = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      result.push({ month: monthName, inflow });
    }
    return result;
  }, [payments]);

  // Calculate real financial snapshots
  const totalReceived = payments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  const totalPending = payments
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Total expected revenue = sum of all unit rent amounts
  const totalExpectedRevenue = properties.reduce((sum, prop) => sum + prop.revenue, 0);
  const totalRevenue = totalReceived || totalExpectedRevenue;
  const totalUnits = properties.reduce((sum, prop) => sum + prop.total_units, 0);
  const occupiedUnits = properties.reduce((sum, prop) => sum + prop.occupied, 0);
  const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : "0";

  // Filtered data based on selected property
  const filteredProperties = useMemo(() => {
    if (!propertyFilter) return properties;
    return properties.filter(p => p.id === propertyFilter);
  }, [properties, propertyFilter]);

  const filteredPayments = useMemo(() => {
    if (!propertyFilter) return payments;
    const propertyUnitIds = properties
      .find(p => p.id === propertyFilter)?.units.map(u => u.id) || [];
    return payments.filter(p => propertyUnitIds.includes(p.unit_id));
  }, [payments, properties, propertyFilter]);

  const filteredTotalUnits = filteredProperties.reduce((sum, prop) => sum + prop.units.length, 0);
  const filteredOccupiedUnits = filteredProperties.reduce((sum, prop) => sum + prop.occupied, 0);
  const filteredVacantUnits = filteredTotalUnits - filteredOccupiedUnits;
  const filteredOccupancyRate = filteredTotalUnits > 0 ? ((filteredOccupiedUnits / filteredTotalUnits) * 100).toFixed(1) : "0";
  
  const filteredTotalRevenue = filteredPayments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0) || 
    filteredProperties.reduce((sum, prop) => sum + prop.revenue, 0);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchPropertiesWithStats();
    await fetchPayments();
    await refetchRequests();
    await fetchCommunications();
    await fetchNotices();
    toast.success("Dashboard refreshed");
  };

  const handleActionClick = (request: any, action: "complete" | "scheduled" | "in_progress" | "delegate_payment") => {
    setActionDialog({ isOpen: true, request, action });
    if (action === "scheduled") {
      setScheduledDate("");
    }
    if (action === "delegate_payment") {
      setPaymentAmount("");
    }
  };

  const handleActionConfirm = async () => {
    if (!actionDialog.request || !actionDialog.action) return;

    if (actionDialog.action === "complete") {
      await updateRequestStatus(actionDialog.request.id, "completed");
    } else if (actionDialog.action === "scheduled") {
      await updateRequestStatus(actionDialog.request.id, "scheduled", {
        estimated_completion: scheduledDate
      });
    } else if (actionDialog.action === "in_progress") {
      await updateRequestStatus(actionDialog.request.id, "in_progress");
    } else if (actionDialog.action === "delegate_payment") {
      toast.success(`Payment of ${formatAmount(Number(paymentAmount))} delegated to tenant`);
    }

    setActionDialog({ isOpen: false, request: null, action: null });
  };

  // Check if maintenance request is editable/deletable (manual or unassigned entries only)
  const isMaintenanceEditable = (request: any) => {
    return request.is_property_wide || !request.assigned_to;
  };

  const handleEditClick = (request: any) => {
    setEditForm({
      title: request.title,
      description: request.description,
      category: request.category,
      priority: request.priority
    });
    setMaintenanceEditDialog({ isOpen: true, request });
  };

  const handleEditSave = async () => {
    if (!maintenanceEditDialog.request) return;
    
    const result = await updateRequest(maintenanceEditDialog.request.id, editForm);
    if (result.success) {
      setMaintenanceEditDialog({ isOpen: false, request: null });
    }
  };

  const handleDeleteClick = (request: any) => {
    setDeletePassword("");
    setMaintenanceDeleteDialog({ isOpen: true, request });
  };

  const handleDeleteConfirm = async () => {
    if (!maintenanceDeleteDialog.request || !user?.email) return;
    
    setDeleteLoading(true);
    try {
      // Verify password by attempting to sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword
      });
      
      if (error) {
        toast.error("Incorrect password. Please try again.");
        setDeleteLoading(false);
        return;
      }
      
      // Password verified, proceed with deletion
      const result = await deleteRequest(maintenanceDeleteDialog.request.id);
      if (result.success) {
        setMaintenanceDeleteDialog({ isOpen: false, request: null });
        setDeletePassword("");
      }
    } catch (error) {
      toast.error("Failed to verify password");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navigation />
      
      <main className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Header Section - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 lg:mb-8 space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Landlord Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl hidden sm:block">
              Monitor your complete property portfolio with comprehensive financial analytics and performance metrics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9" onClick={() => setShowConverter(true)}>
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Convert</span>
            </Button>
            <CurrencySelector showLabel={false} />
          </div>
        </div>

        {/* Property Filter - Compact on Mobile */}
        <Card className="mb-4 sm:mb-6 border-border/50 shadow-card rounded-xl sm:rounded-2xl bg-gradient-to-br from-card to-card/80">
          <CardHeader className="p-3 sm:p-4 lg:p-6 pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <div>
                  <CardTitle className="text-sm sm:text-base font-semibold text-foreground">Property Filter</CardTitle>
                  <CardDescription className="text-xs hidden sm:block">
                    Filter by specific property
                  </CardDescription>
                </div>
              </div>
              <Select value={propertyFilter || "all"} onValueChange={(val) => setPropertyFilter(val === "all" ? null : val)}>
                <SelectTrigger className="w-full sm:w-[240px] h-9 text-sm">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties ({properties.length})</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name} ({property.units.length} units)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Key Metrics - Mobile Optimized 2x2 Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 rounded-xl sm:rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 lg:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">Properties</CardTitle>
              <div className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">{filteredProperties.length}</div>
              <div className="space-y-0.5">
                <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground flex items-center gap-1">
                  <Home className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {filteredTotalUnits} units
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  {filteredOccupiedUnits} occupied • {filteredTotalUnits - filteredOccupiedUnits} vacant
                </p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl sm:rounded-2xl overflow-hidden group relative cursor-pointer"
            onClick={() => setFinancialBreakdownDialog({ isOpen: true, title: "Monthly Revenue Breakdown", type: "revenue" })}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 lg:p-6 pb-1 sm:pb-2 relative z-10">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <div className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-glow">
                <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-accent-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 relative z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-accent mb-1 cursor-help">{formatCompact(filteredTotalRevenue)}</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatExact(filteredTotalRevenue)} — Tap for details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-[10px] sm:text-xs lg:text-sm text-foreground font-medium flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Tap for details</span>
                <span className="sm:hidden">Details →</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 rounded-xl sm:rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 lg:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <div className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-warning-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-foreground mb-1 cursor-help">{formatCompact(totalPending)}</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatExact(totalPending)} pending</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                Awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 rounded-xl sm:rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 lg:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">Occupancy</CardTitle>
              <div className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">{filteredOccupancyRate}%</div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                {filteredOccupiedUnits}/{filteredTotalUnits} occupied
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Analytics Tabs - Mobile Optimized */}
        <Card className="mb-4 sm:mb-6 lg:mb-8 border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-xl sm:rounded-2xl bg-gradient-to-br from-card to-card/80">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-foreground text-base sm:text-lg lg:text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-accent" />
              Financial Analytics
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm lg:text-base hidden sm:block">
              Revenue tracking, cash flow, and expense breakdown.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <Tabs defaultValue="revenue" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-8 sm:h-10">
                <TabsTrigger value="revenue" className="text-[10px] sm:text-xs lg:text-sm px-1 sm:px-3">Revenue</TabsTrigger>
                <TabsTrigger value="cashflow" className="text-[10px] sm:text-xs lg:text-sm px-1 sm:px-3">Cash Flow</TabsTrigger>
              </TabsList>
              
              <TabsContent value="revenue" className="space-y-4">
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px] lg:h-[350px]">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} width={40} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        fontSize: "12px"
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="cashflow" className="space-y-4">
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px] lg:h-[350px]">
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} width={40} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        fontSize: "12px"
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Bar dataKey="inflow" name="Income" fill="hsl(var(--accent-green))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Property Performance & Occupancy - Mobile Stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-xl sm:rounded-2xl bg-gradient-to-br from-card to-card/80">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-foreground text-base sm:text-lg lg:text-2xl font-bold">Property Performance</CardTitle>
              <CardDescription className="text-xs sm:text-sm hidden sm:block">
                Revenue comparison across properties.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <ResponsiveContainer width="100%" height={200} className="sm:h-[250px] lg:h-[300px]">
                <BarChart data={properties}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" angle={-15} textAnchor="end" height={50} fontSize={9} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} width={35} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: "11px"
                    }} 
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-xl sm:rounded-2xl bg-gradient-to-br from-card to-card/80">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-foreground text-base sm:text-lg lg:text-2xl font-bold">Occupancy Metrics</CardTitle>
              <CardDescription className="text-xs sm:text-sm hidden sm:block">
                Unit occupancy across properties.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-2 sm:space-y-3 lg:space-y-4">
              {properties.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">No properties added yet</p>
              ) : (
                properties.map((property) => {
                  const occupancyPercent = property.total_units > 0 ? (property.occupied / property.total_units) * 100 : 0;
                  return (
                    <div key={property.id} className="space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium text-foreground truncate">{property.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">{property.occupied}/{property.total_units}</span>
                          <Badge variant={occupancyPercent >= 90 ? "default" : "secondary"} className={`text-[10px] sm:text-xs px-1.5 py-0 ${occupancyPercent >= 90 ? "bg-accent-green text-accent-green-foreground" : "bg-warning text-warning-foreground"}`}>
                            {occupancyPercent.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={occupancyPercent} className="h-1.5 sm:h-2" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Properties Section - Mobile Optimized */}
        <Card className="mb-4 sm:mb-6 lg:mb-8 border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-xl sm:rounded-2xl bg-gradient-to-br from-card to-card/80">
          <CardHeader className="p-3 sm:p-4 lg:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-foreground text-base sm:text-lg lg:text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
                My Properties
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm hidden sm:block">
                Manage properties and view occupants.
              </CardDescription>
            </div>
            <Button onClick={() => navigate("/properties")} size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Add Property
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            {loading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Loading properties...</div>
            ) : properties.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Building2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-xl font-semibold mb-2">No properties yet</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  Get started by adding your first property
                </p>
                <Button onClick={() => navigate("/properties")} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {properties.map((property) => {
                  const occupancyPercent = property.total_units > 0 ? (property.occupied / property.total_units) * 100 : 0;
                  // Calculate actual monthly revenue from occupied units
                  const monthlyRevenue = property.units
                    .filter(u => u.status === "occupied")
                    .reduce((sum, u) => sum + Number(u.rent_amount), 0);
                  // Get currency from first unit
                  const propertyCurrency = property.units[0]?.rent_currency || currency.code;
                  // Find units with upcoming lease expirations (within 90 days)
                  const unitsWithExpiry = property.units
                    .filter(u => u.status === "occupied" && u.lease_end)
                    .map(u => {
                      const daysRemaining = differenceInDays(new Date(u.lease_end!), new Date());
                      return { ...u, daysRemaining };
                    })
                    .filter(u => u.daysRemaining <= 90 && u.daysRemaining >= 0)
                    .sort((a, b) => a.daysRemaining - b.daysRemaining);
                  
                  return (
                    <Card 
                      key={property.id} 
                      className="border-border/50 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                      onClick={() => navigate(`/properties/${property.id}`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {property.name}
                          </CardTitle>
                          <Badge variant="outline" className="capitalize text-xs">
                            {property.property_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {property.city}, {property.country}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span>{property.total_units} Units</span>
                          </div>
                          <Badge 
                            variant={occupancyPercent >= 90 ? "default" : "secondary"}
                            className={occupancyPercent >= 90 ? "bg-accent-green text-accent-green-foreground" : "bg-warning text-warning-foreground"}
                          >
                            {property.occupied} Occupied
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Monthly Revenue</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-semibold text-accent cursor-help">
                                  {propertyCurrency} {monthlyRevenue.toLocaleString()}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Based on {property.occupied} occupied unit{property.occupied !== 1 ? 's' : ''}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        {/* Lease Expiry Countdown */}
                        {unitsWithExpiry.length > 0 && (
                          <div className="bg-warning/10 border border-warning/30 rounded-md p-2 space-y-1">
                            <div className="flex items-center gap-1 text-xs text-warning font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              Lease Expiring Soon
                            </div>
                            {unitsWithExpiry.slice(0, 2).map(unit => (
                              <div key={unit.id} className="flex items-center justify-between text-xs">
                                <span className="text-foreground">
                                  Unit {unit.unit_number} {unit.manual_tenant_name ? `(${unit.manual_tenant_name})` : ''}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    unit.daysRemaining <= 14 
                                      ? "border-destructive text-destructive text-[10px]" 
                                      : unit.daysRemaining <= 30 
                                        ? "border-warning text-warning text-[10px]"
                                        : "border-muted-foreground text-muted-foreground text-[10px]"
                                  }
                                >
                                  {unit.daysRemaining === 0 
                                    ? "Today" 
                                    : unit.daysRemaining === 1 
                                      ? "1 day" 
                                      : `${unit.daysRemaining} days`}
                                </Badge>
                              </div>
                            ))}
                            {unitsWithExpiry.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{unitsWithExpiry.length - 2} more
                              </p>
                            )}
                          </div>
                        )}
                        
                        <Progress value={occupancyPercent} className="h-2" />
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/properties/${property.id}`);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/properties/${property.id}?tab=payments`);
                            }}
                          >
                            <Banknote className="h-3 w-3 mr-1" />
                            Payments
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Management & Communications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
                    <Wrench className="h-6 w-6 text-accent" />
                    Maintenance Requests
                  </CardTitle>
                  <CardDescription className="text-justify text-base">
                    Real-time maintenance requests from tenants across your properties.
                  </CardDescription>
                </div>
                <Select value={propertyFilter || "all"} onValueChange={(value) => setPropertyFilter(value === "all" ? null : value)}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Outstanding ({maintenanceRequests.filter(r => r.status !== 'completed').length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    History ({maintenanceRequests.filter(r => r.status === 'completed').length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active">
                  <ScrollArea className="h-[400px] pr-4">
                    {requestsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
                    ) : maintenanceRequests.filter(r => r.status !== 'completed').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-accent-green" />
                        <p>All maintenance requests completed!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {maintenanceRequests.filter(r => r.status !== 'completed').map((request) => (
                          <div key={request.id} className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                            request.status === 'pending' ? 'border-warning bg-warning/5' : 
                            request.status === 'scheduled' ? 'border-accent bg-accent/5' :
                            'border-border hover:bg-muted/50'
                          }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-semibold text-foreground text-sm">{request.title}</h4>
                                  <Badge 
                                    variant="secondary" 
                                    className={
                                      request.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                                      request.priority === 'medium' ? 'bg-warning/20 text-warning' :
                                      'bg-accent/20 text-accent'
                                    }
                                  >
                                    {request.priority}
                                  </Badge>
                                  <Badge 
                                    variant="outline"
                                    className={
                                      request.status === 'pending' ? 'border-warning text-warning' :
                                      request.status === 'scheduled' ? 'border-accent text-accent' :
                                      'border-primary text-primary'
                                    }
                                  >
                                    {request.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{request.property_name} • Unit {request.unit_number}</p>
                                <p className="text-xs text-muted-foreground mt-1">{request.category}</p>
                              </div>
                            </div>
                            <div className="bg-muted/50 rounded-md p-2 mb-3">
                              <p className="text-xs text-foreground line-clamp-2">{request.description}</p>
                            </div>
                            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="font-medium">{request.tenant_name}</span>
                              {request.tenant_email && <span>• {request.tenant_email}</span>}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                              </div>
                              {request.estimated_completion && (
                                <span>ETA: {new Date(request.estimated_completion).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs"
                                onClick={() => handleActionClick(request, "in_progress")}
                              >
                                Mark In Progress
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs"
                                onClick={() => handleActionClick(request, "scheduled")}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Schedule
                              </Button>
                              <Button 
                                size="sm" 
                                variant="default"
                                className="text-xs bg-accent-green hover:bg-accent-green/90"
                                onClick={() => handleActionClick(request, "complete")}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs border-accent text-accent hover:bg-accent/10"
                                onClick={() => handleActionClick(request, "delegate_payment")}
                              >
                                <Banknote className="h-3 w-3 mr-1" />
                                Delegate Payment
                              </Button>
                              {isMaintenanceEditable(request) && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-xs border-primary text-primary hover:bg-primary/10"
                                    onClick={() => handleEditClick(request)}
                                  >
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-xs border-destructive text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteClick(request)}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="history">
                  <ScrollArea className="h-[400px] pr-4">
                    {requestsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
                    ) : maintenanceRequests.filter(r => r.status === 'completed').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No completed maintenance requests yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {maintenanceRequests.filter(r => r.status === 'completed').map((request) => (
                          <div key={request.id} className="p-4 border border-accent-green/30 rounded-lg bg-accent-green/5">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-semibold text-foreground text-sm">{request.title}</h4>
                                  <Badge variant="outline" className="border-accent-green text-accent-green">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{request.property_name} • Unit {request.unit_number}</p>
                                <p className="text-xs text-muted-foreground mt-1">{request.category}</p>
                              </div>
                            </div>
                            <div className="bg-muted/50 rounded-md p-2 mb-3">
                              <p className="text-xs text-foreground line-clamp-2">{request.description}</p>
                            </div>
                            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="font-medium">{request.tenant_name}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                              </div>
                              {request.completed_at && (
                                <div className="flex items-center gap-1 text-accent-green">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Resolved: {new Date(request.completed_at).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            {isMaintenanceEditable(request) && (
                              <div className="flex gap-2 flex-wrap pt-2 border-t border-border/50">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs border-primary text-primary hover:bg-primary/10"
                                  onClick={() => handleEditClick(request)}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs border-destructive text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteClick(request)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-accent" />
                    Communication Timeline
                  </CardTitle>
                  <CardDescription className="text-justify text-base">
                    Recent updates, messages, and notifications from properties and managers.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAddCommunicationOpen(true)} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {communications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No communications yet. Add a manual entry to get started.</p>
                    </div>
                  ) : (
                    communications.map((comm) => (
                      <div key={comm.id} className={`p-4 border rounded-lg transition-all hover:shadow-md ${comm.is_read ? 'border-border bg-muted/30' : 'border-accent/50 bg-accent/5'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-2 rounded-full ${
                            comm.type === 'maintenance' ? 'bg-warning/20' :
                            comm.type === 'tenant' ? 'bg-accent/20' :
                            comm.type === 'financial' ? 'bg-accent-green/20' :
                            comm.type === 'alert' ? 'bg-destructive/20' :
                            'bg-primary/20'
                          }`}>
                            {comm.type === 'maintenance' && <AlertCircle className="h-4 w-4 text-warning" />}
                            {comm.type === 'tenant' && <Users className="h-4 w-4 text-accent" />}
                            {comm.type === 'financial' && <Banknote className="h-4 w-4 text-accent-green" />}
                            {comm.type === 'alert' && <Bell className="h-4 w-4 text-destructive" />}
                            {comm.type === 'general' && <MessageSquare className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">{comm.from_name}</span>
                                {comm.is_manual_entry && (
                                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 flex items-center gap-0.5">
                                    <UserPlus className="h-2.5 w-2.5" />
                                    Manual
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{getTimeAgo(comm.created_at)}</span>
                                {comm.is_manual_entry && (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={() => openDeleteConfirm("communication", comm.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{comm.property}</p>
                            <p className="text-sm text-foreground">{comm.message}</p>
                          </div>
                          {!comm.is_read && (
                            <div className="flex-shrink-0 h-2 w-2 rounded-full bg-accent mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Notice Board */}
        <Card className="mb-8 border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
                  <Bell className="h-6 w-6 text-accent" />
                  Notice Board
                </CardTitle>
                <CardDescription className="text-justify text-base">
                  Important announcements, updates, and reminders for portfolio management.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddNoticeOpen(true)} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Notice
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {notices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notices yet. Add a notice to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notices.map((notice) => (
                  <div key={notice.id} className={`p-5 border-2 rounded-xl transition-all hover:shadow-md relative ${
                    notice.type === 'important' ? 'border-destructive/50 bg-destructive/5' :
                    notice.type === 'warning' ? 'border-warning/50 bg-warning/5' :
                    notice.type === 'success' ? 'border-accent-green/50 bg-accent-green/5' :
                    'border-accent/50 bg-accent/5'
                  }`}>
                    {notice.is_manual_entry && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute top-2 right-2 h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => openDeleteConfirm("notice", notice.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${
                        notice.type === 'important' ? 'bg-destructive/20' :
                        notice.type === 'warning' ? 'bg-warning/20' :
                        notice.type === 'success' ? 'bg-accent-green/20' :
                        'bg-accent/20'
                      }`}>
                        {notice.type === 'important' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                        {notice.type === 'warning' && <AlertCircle className="h-5 w-5 text-warning" />}
                        {notice.type === 'success' && <CheckCircle2 className="h-5 w-5 text-accent-green" />}
                        {notice.type === 'info' && <ArrowUpRight className="h-5 w-5 text-accent" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {notice.is_manual_entry && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 flex items-center gap-0.5">
                            <UserPlus className="h-2.5 w-2.5" />
                            Manual
                          </Badge>
                        )}
                        {notice.sms_sent && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 flex items-center gap-0.5 border-accent-green text-accent-green">
                            <Send className="h-2.5 w-2.5" />
                            SMS Sent
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {notice.type}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{notice.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{notice.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(notice.created_at), "MMM d, yyyy")}
                      </span>
                      <span>{notice.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manager Requests */}
        <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
                  <FileCheck className="h-6 w-6 text-primary" />
                  Property Manager Requests
                </CardTitle>
                <CardDescription className="text-justify text-base">
                  Review and approve property manager applications to assign management responsibilities for your properties.
                </CardDescription>
              </div>
              {roleRequests.length > 0 && (
                <Badge variant="secondary" className="bg-warning text-warning-foreground">
                  {roleRequests.length} Pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {roleRequests.length > 0 ? (
              <div className="space-y-4">
                {roleRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{request.profile?.full_name || "Unknown User"}</h3>
                        <p className="text-sm text-muted-foreground">{request.profile?.email || "No email"}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Requested role: <span className="font-medium text-foreground">Property Manager</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Submitted: {new Date(request.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={async () => {
                          await supabase.from("role_requests").update({ status: "rejected" }).eq("id", request.id);
                          fetchRoleRequests();
                          toast.success("Request rejected");
                        }}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-accent hover:bg-accent/90"
                        onClick={async () => {
                          // Approve the request and assign the role
                          await supabase.from("role_requests").update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", request.id);
                          await supabase.from("user_roles").insert({ user_id: request.user_id, role: "property_manager" });
                          fetchRoleRequests();
                          toast.success("Request approved - Property Manager role assigned");
                        }}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending manager requests</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>

    {/* Action Dialog */}
    <Dialog open={actionDialog.isOpen} onOpenChange={(open) => !open && setActionDialog({ isOpen: false, request: null, action: null })}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionDialog.action === "complete" && "Mark as Completed"}
            {actionDialog.action === "scheduled" && "Schedule Repair/Inspection"}
            {actionDialog.action === "in_progress" && "Mark In Progress"}
            {actionDialog.action === "delegate_payment" && "Delegate Payment to Tenant"}
          </DialogTitle>
          <DialogDescription>
            {actionDialog.action === "complete" && "Confirm that this maintenance request has been completed."}
            {actionDialog.action === "scheduled" && "Set a scheduled date for repair or inspection."}
            {actionDialog.action === "in_progress" && "Mark this request as currently being worked on."}
            {actionDialog.action === "delegate_payment" && "Request payment from tenant for this maintenance work."}
          </DialogDescription>
        </DialogHeader>
        {actionDialog.action === "scheduled" && (
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">Scheduled Date</Label>
            <Input 
              id="scheduled-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
        )}
        {actionDialog.action === "delegate_payment" && (
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Payment Amount</Label>
            <Input 
              id="payment-amount"
              type="number"
              placeholder="Enter amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setActionDialog({ isOpen: false, request: null, action: null })}>
            Cancel
          </Button>
          <Button onClick={handleActionConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Add Communication Dialog */}
    <Dialog open={isAddCommunicationOpen} onOpenChange={setIsAddCommunicationOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" />
            Add Manual Communication
          </DialogTitle>
          <DialogDescription>
            Create a manual entry in the communication timeline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comm-type">Type</Label>
            <Select value={communicationForm.type} onValueChange={(v) => setCommunicationForm(prev => ({ ...prev, type: v }))}>
              <SelectTrigger id="comm-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comm-from">From *</Label>
            <Input 
              id="comm-from"
              placeholder="e.g., John Smith, System, Admin"
              value={communicationForm.fromName}
              onChange={(e) => setCommunicationForm(prev => ({ ...prev, fromName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comm-property">Property</Label>
            <Select 
              value={communicationForm.property} 
              onValueChange={(v) => setCommunicationForm(prev => ({ ...prev, property: v }))}
            >
              <SelectTrigger id="comm-property">
                <SelectValue placeholder="Select property (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Properties">All Properties</SelectItem>
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comm-message">Message *</Label>
            <Textarea 
              id="comm-message"
              placeholder="Enter communication message..."
              value={communicationForm.message}
              onChange={(e) => setCommunicationForm(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddCommunicationOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCommunication}>Add Communication</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Add Notice Dialog */}
    <Dialog open={isAddNoticeOpen} onOpenChange={setIsAddNoticeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            Add Notice
          </DialogTitle>
          <DialogDescription>
            Create a new notice for the notice board with optional SMS reminder.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notice-title">Title *</Label>
            <Input 
              id="notice-title"
              placeholder="Notice title"
              value={noticeForm.title}
              onChange={(e) => setNoticeForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notice-content">Content *</Label>
            <Textarea 
              id="notice-content"
              placeholder="Notice content..."
              value={noticeForm.content}
              onChange={(e) => setNoticeForm(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notice-type">Type</Label>
            <Select value={noticeForm.type} onValueChange={(v) => setNoticeForm(prev => ({ ...prev, type: v }))}>
              <SelectTrigger id="notice-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="send-sms" 
                checked={noticeForm.sendSms}
                onCheckedChange={(checked) => setNoticeForm(prev => ({ ...prev, sendSms: !!checked }))}
              />
              <Label htmlFor="send-sms" className="flex items-center gap-2 cursor-pointer">
                <Send className="h-4 w-4" />
                Send SMS Reminder
              </Label>
            </div>
            {noticeForm.sendSms && (
              <div className="space-y-2">
                <Label htmlFor="sms-phone">Phone Number</Label>
                <Input 
                  id="sms-phone"
                  type="tel"
                  placeholder="+233XXXXXXXXX"
                  value={noticeForm.smsPhone}
                  onChange={(e) => setNoticeForm(prev => ({ ...prev, smsPhone: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the phone number to receive the SMS reminder.
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddNoticeOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNotice} className="gap-1">
            {noticeForm.sendSms && <Send className="h-4 w-4" />}
            {noticeForm.sendSms ? "Add & Send SMS" : "Add Notice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemToDelete?.type === "communication" ? "Communication" : "Notice"}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Financial Breakdown Dialog */}
    <Dialog open={financialBreakdownDialog.isOpen} onOpenChange={(open) => setFinancialBreakdownDialog(prev => ({ ...prev, isOpen: open }))}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Banknote className="h-6 w-6 text-accent" />
            {financialBreakdownDialog.title}
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of line items that constitute this figure.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {financialBreakdownDialog.type === "revenue" && (
            <>
              {/* Revenue Summary */}
              <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-foreground">Total Monthly Revenue</span>
                  <span className="text-2xl font-bold text-accent">{formatExact(filteredTotalRevenue)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Revenue collected from {propertyFilter ? "selected property" : "all properties"}</p>
              </div>
              
              {/* Revenue by Property */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Revenue by Property
                </h4>
                {filteredProperties.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No properties found</p>
                ) : (
                  filteredProperties.map((property) => (
                    <div key={property.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-foreground">{property.name}</p>
                          <p className="text-sm text-muted-foreground">{property.city}, {property.country}</p>
                        </div>
                        <span className="font-semibold text-accent">{formatAmount(property.revenue)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Recent Payments */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-accent" />
                  Recent Completed Payments
                </h4>
                {filteredPayments.filter(p => p.status === "completed").slice(0, 5).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No completed payments found</p>
                ) : (
                  filteredPayments.filter(p => p.status === "completed").slice(0, 5).map((payment) => (
                    <div key={payment.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">{format(new Date(payment.payment_date), "dd MMM yyyy")}</p>
                          <Badge variant="secondary" className="bg-accent-green/10 text-accent-green-foreground text-xs mt-1">
                            Completed
                          </Badge>
                        </div>
                        <span className="font-semibold text-foreground">{formatAmount(payment.amount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          
        </div>
        
        <DialogFooter>
          <Button onClick={() => setFinancialBreakdownDialog({ isOpen: false, title: "", type: null })}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit Maintenance Request Dialog */}
    <Dialog open={maintenanceEditDialog.isOpen} onOpenChange={(open) => !open && setMaintenanceEditDialog({ isOpen: false, request: null })}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Maintenance Request
          </DialogTitle>
          <DialogDescription>
            Update the details of this maintenance request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Maintenance request title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Describe the issue"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select 
                value={editForm.category} 
                onValueChange={(value) => setEditForm({ ...editForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="appliances">Appliances</SelectItem>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="pest_control">Pest Control</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select 
                value={editForm.priority} 
                onValueChange={(value) => setEditForm({ ...editForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setMaintenanceEditDialog({ isOpen: false, request: null })}
          >
            Cancel
          </Button>
          <Button onClick={handleEditSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Maintenance Request Dialog with Password Confirmation */}
    <Dialog open={maintenanceDeleteDialog.isOpen} onOpenChange={(open) => !open && setMaintenanceDeleteDialog({ isOpen: false, request: null })}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Maintenance Request
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please enter your password to confirm deletion.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm font-medium text-foreground mb-1">
              {maintenanceDeleteDialog.request?.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {maintenanceDeleteDialog.request?.property_name} • Unit {maintenanceDeleteDialog.request?.unit_number}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-password">Enter your password to confirm</Label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your account password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setMaintenanceDeleteDialog({ isOpen: false, request: null });
              setDeletePassword("");
            }}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteConfirm}
            disabled={!deletePassword || deleteLoading}
          >
            {deleteLoading ? "Verifying..." : "Delete Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Currency Converter */}
    <CurrencyConverter isOpen={showConverter} onClose={() => setShowConverter(false)} />
    </PullToRefresh>
  );
};

export default LandlordDashboard;
