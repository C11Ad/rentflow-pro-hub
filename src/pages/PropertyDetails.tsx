import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, Building2, Users, FileText, Banknote, Wrench, Bell, 
  Home, MapPin, Calendar, Phone, Mail, Send, Plus, Eye, Download,
  CheckCircle, Clock, AlertTriangle, Loader2, Edit, Trash2, UserPlus, Lock
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postal_code: string | null;
  property_type: string;
  total_units: number;
  description: string | null;
}

interface Unit {
  id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  rent_amount: number;
  rent_currency: string;
  status: string;
  tenant_id: string | null;
  lease_start: string | null;
  lease_end: string | null;
  is_manual_tenant: boolean;
  manual_tenant_name: string | null;
  manual_tenant_email: string | null;
  manual_tenant_phone: string | null;
}

interface Tenant {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
}

interface Contract {
  id: string;
  unit_id: string;
  tenant_id: string;
  landlord_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  rent_currency: string;
  status: string;
  tenant_signed_at: string | null;
  landlord_signed_at: string | null;
}

interface MaintenanceRequest {
  id: string;
  unit_id: string;
  tenant_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  is_property_wide?: boolean;
  cost_amount?: number | null;
  cost_currency?: string;
  cost_paid_by?: string | null;
  cost_notes?: string | null;
}

interface Payment {
  id: string;
  unit_id: string;
  tenant_id: string;
  landlord_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  is_manual_entry: boolean;
  payer_name: string | null;
  payer_phone: string | null;
}

const PropertyDetails = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatAmount, currency } = useCurrency();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Record<string, Tenant>>({});
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Dialog states
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isNoticeDialogOpen, setIsNoticeDialogOpen] = useState(false);
  const [isPaymentRequestDialogOpen, setIsPaymentRequestDialogOpen] = useState(false);
  const [isRecordPaymentDialogOpen, setIsRecordPaymentDialogOpen] = useState(false);
  const [isAddTenantDialogOpen, setIsAddTenantDialogOpen] = useState(false);
  const [isEditTenantDialogOpen, setIsEditTenantDialogOpen] = useState(false);
  const [isRemoveTenantDialogOpen, setIsRemoveTenantDialogOpen] = useState(false);
  const [isDeletePaymentDialogOpen, setIsDeletePaymentDialogOpen] = useState(false);
  const [isAddMaintenanceDialogOpen, setIsAddMaintenanceDialogOpen] = useState(false);
  const [isEditUnitDialogOpen, setIsEditUnitDialogOpen] = useState(false);
  const [isDeleteUnitDialogOpen, setIsDeleteUnitDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedEditUnit, setSelectedEditUnit] = useState<Unit | null>(null);
  const [unitForm, setUnitForm] = useState({
    unit_number: "",
    bedrooms: 1,
    bathrooms: 1,
    square_feet: "",
    rent_amount: "",
    rent_currency: "GHS",
    status: "vacant"
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
    is_property_wide: false,
    cost_amount: "",
    cost_currency: "GHS",
    cost_paid_by: "",
    cost_notes: ""
  });
  
  // Form states
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    content: "",
    type: "general"
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "cash",
    reference_number: "",
    notes: "",
    payment_date: new Date().toISOString().split('T')[0],
    payer_name: "",
    payer_phone: ""
  });
  const [tenantForm, setTenantForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    lease_start: new Date().toISOString().split('T')[0],
    lease_end: "",
    is_manual: false
  });
  const [isManualAddTenantDialogOpen, setIsManualAddTenantDialogOpen] = useState(false);
  const [selectedTenantUnit, setSelectedTenantUnit] = useState<Unit | null>(null);

  useEffect(() => {
    if (propertyId && user) {
      fetchPropertyData();
    }
  }, [propertyId, user]);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      
      // Fetch property
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .maybeSingle();
      
      if (propertyError) throw propertyError;
      if (!propertyData) {
        toast.error("Property not found");
        navigate("/properties");
        return;
      }
      
      setProperty(propertyData);
      
      // Fetch units
      const { data: unitsData, error: unitsError } = await supabase
        .from("units")
        .select("*")
        .eq("property_id", propertyId)
        .order("unit_number");
      
      if (unitsError) throw unitsError;
      setUnits(unitsData || []);
      
      // Fetch tenants for occupied units
      const tenantIds = (unitsData || [])
        .filter(u => u.tenant_id)
        .map(u => u.tenant_id);
      
      if (tenantIds.length > 0) {
        const { data: tenantsData, error: tenantsError } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", tenantIds);
        
        if (!tenantsError && tenantsData) {
          const tenantsMap: Record<string, Tenant> = {};
          tenantsData.forEach(t => {
            tenantsMap[t.id] = t;
          });
          setTenants(tenantsMap);
        }
      }
      
      // Fetch contracts for this property's units
      const unitIds = (unitsData || []).map(u => u.id);
      if (unitIds.length > 0) {
        const { data: contractsData, error: contractsError } = await supabase
          .from("rental_contracts")
          .select("*")
          .in("unit_id", unitIds)
          .order("created_at", { ascending: false });
        
        if (!contractsError) {
          setContracts(contractsData || []);
        }
      }
      
      // Fetch maintenance requests
      if (unitIds.length > 0) {
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from("maintenance_requests")
          .select("*")
          .in("unit_id", unitIds)
          .order("created_at", { ascending: false });
        
        if (!maintenanceError) {
          setMaintenanceRequests(maintenanceData || []);
        }
      }
      
      // Fetch payments
      if (unitIds.length > 0) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .in("unit_id", unitIds)
          .order("payment_date", { ascending: false });
        
        if (!paymentsError) {
          setPayments(paymentsData || []);
        }
      }
      
    } catch (error: any) {
      toast.error("Failed to load property data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContract = async () => {
    if (!selectedUnit || !user) return;
    
    const unit = units.find(u => u.id === selectedUnit);
    if (!unit || !unit.tenant_id) {
      toast.error("Selected unit has no tenant assigned");
      return;
    }
    
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-contract", {
        body: {
          unitId: unit.id,
          tenantId: unit.tenant_id,
          landlordId: user.id,
          monthlyRent: unit.rent_amount,
          rentCurrency: unit.rent_currency,
          propertyAddress: property ? `${property.address}, ${property.city}, ${property.country}` : "",
          leaseTerm: 12
        }
      });
      
      if (error) throw error;
      
      toast.success("Contract generated successfully!");
      setIsContractDialogOpen(false);
      fetchPropertyData();
    } catch (error: any) {
      toast.error("Failed to generate contract");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSendNotice = async () => {
    if (!noticeForm.title || !noticeForm.content) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setProcessing(true);
    try {
      // For now, we'll create a legal document as a notice
      const { error } = await supabase
        .from("legal_documents")
        .insert({
          user_id: user?.id,
          title: noticeForm.title,
          content: noticeForm.content,
          document_type: "maintenance_notice",
          location: property ? `${property.city}, ${property.country}` : "",
          status: "generated"
        });
      
      if (error) throw error;
      
      toast.success("Notice sent successfully!");
      setIsNoticeDialogOpen(false);
      setNoticeForm({ title: "", content: "", type: "general" });
    } catch (error: any) {
      toast.error("Failed to send notice");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestPayment = async () => {
    if (!selectedUnit) {
      toast.error("Please select a unit");
      return;
    }
    
    const unit = units.find(u => u.id === selectedUnit);
    if (!unit || !unit.tenant_id) {
      toast.error("Selected unit has no tenant");
      return;
    }
    
    const tenant = tenants[unit.tenant_id];
    if (!tenant?.phone) {
      toast.error("Tenant has no phone number for SMS");
      return;
    }
    
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("send-sms-reminder", {
        body: {
          to: tenant.phone,
          message: `Payment reminder: Your rent of ${unit.rent_currency} ${unit.rent_amount.toLocaleString()} for Unit ${unit.unit_number} is due. Please make payment at your earliest convenience.`
        }
      });
      
      if (error) throw error;
      
      toast.success("Payment reminder sent!");
      setIsPaymentRequestDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to send payment reminder");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedUnit || !paymentForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const unit = units.find(u => u.id === selectedUnit);
    if (!unit) {
      toast.error("Selected unit not found");
      return;
    }

    // For manual tenants without tenant_id, we still need to track the payment
    const isManualTenant = unit.is_manual_tenant && !unit.tenant_id;
    
    // If it's a manual tenant, require payer name
    if (isManualTenant && !paymentForm.payer_name) {
      toast.error("Please enter payer name for manual tenant");
      return;
    }
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("payments")
        .insert({
          unit_id: unit.id,
          tenant_id: unit.tenant_id || user?.id, // Use landlord ID as fallback for manual tenants
          landlord_id: user?.id,
          amount: parseFloat(paymentForm.amount),
          currency: unit.rent_currency,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          reference_number: paymentForm.reference_number || null,
          notes: paymentForm.notes || null,
          status: "completed",
          is_manual_entry: true,
          payer_name: isManualTenant ? paymentForm.payer_name : (unit.is_manual_tenant ? unit.manual_tenant_name : null),
          payer_phone: isManualTenant ? paymentForm.payer_phone : (unit.is_manual_tenant ? unit.manual_tenant_phone : null)
        });
      
      if (error) throw error;
      
      toast.success("Payment recorded successfully!");
      setIsRecordPaymentDialogOpen(false);
      setPaymentForm({
        amount: "",
        payment_method: "cash",
        reference_number: "",
        notes: "",
        payment_date: new Date().toISOString().split('T')[0],
        payer_name: "",
        payer_phone: ""
      });
      setSelectedUnit("");
      fetchPropertyData();
    } catch (error: any) {
      toast.error("Failed to record payment");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddTenant = async () => {
    if (!selectedUnit || !tenantForm.email || !tenantForm.full_name) {
      toast.error("Please fill in required fields (name and email)");
      return;
    }
    
    setProcessing(true);
    try {
      // First check if a profile with this email exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", tenantForm.email)
        .maybeSingle();
      
      let tenantId: string;
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: tenantForm.full_name,
            phone: tenantForm.phone || null
          })
          .eq("id", existingProfile.id);
        
        if (updateError) throw updateError;
        tenantId = existingProfile.id;
      } else {
        // Create user via auth (they'll need to set password later)
        toast.error("Tenant must have an existing account. Ask them to sign up first.");
        setProcessing(false);
        return;
      }
      
      // Update the unit with tenant info
      const { error: unitError } = await supabase
        .from("units")
        .update({
          tenant_id: tenantId,
          status: "occupied",
          lease_start: tenantForm.lease_start || null,
          lease_end: tenantForm.lease_end || null
        })
        .eq("id", selectedUnit);
      
      if (unitError) throw unitError;
      
      toast.success("Tenant assigned successfully!");
      setIsAddTenantDialogOpen(false);
      setTenantForm({ full_name: "", email: "", phone: "", lease_start: new Date().toISOString().split('T')[0], lease_end: "", is_manual: false });
      setSelectedUnit("");
      fetchPropertyData();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign tenant");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualAddTenant = async () => {
    if (!selectedUnit || !tenantForm.full_name) {
      toast.error("Please fill in tenant name");
      return;
    }
    
    setProcessing(true);
    try {
      // Update the unit with manual tenant info
      const { error: unitError } = await supabase
        .from("units")
        .update({
          tenant_id: null,
          status: "occupied",
          lease_start: tenantForm.lease_start || null,
          lease_end: tenantForm.lease_end || null,
          is_manual_tenant: true,
          manual_tenant_name: tenantForm.full_name,
          manual_tenant_email: tenantForm.email || null,
          manual_tenant_phone: tenantForm.phone || null
        })
        .eq("id", selectedUnit);
      
      if (unitError) throw unitError;
      
      toast.success("Manual tenant added successfully!");
      setIsManualAddTenantDialogOpen(false);
      setTenantForm({ full_name: "", email: "", phone: "", lease_start: new Date().toISOString().split('T')[0], lease_end: "", is_manual: false });
      setSelectedUnit("");
      fetchPropertyData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add manual tenant");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditTenant = async () => {
    if (!selectedTenantUnit || !tenantForm.full_name) {
      toast.error("Please fill in required fields");
      return;
    }
    
    setProcessing(true);
    try {
      if (selectedTenantUnit.is_manual_tenant) {
        // Update manual tenant info on unit
        const { error: unitError } = await supabase
          .from("units")
          .update({
            manual_tenant_name: tenantForm.full_name,
            manual_tenant_email: tenantForm.email || null,
            manual_tenant_phone: tenantForm.phone || null,
            lease_start: tenantForm.lease_start || null,
            lease_end: tenantForm.lease_end || null
          })
          .eq("id", selectedTenantUnit.id);
        
        if (unitError) throw unitError;
      } else {
        // Update online tenant profile (name, phone only - not email for security)
        if (selectedTenantUnit.tenant_id) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              full_name: tenantForm.full_name,
              phone: tenantForm.phone || null
            })
            .eq("id", selectedTenantUnit.tenant_id);
          
          if (profileError) throw profileError;
        }
        
        // Update unit lease dates
        const { error: unitError } = await supabase
          .from("units")
          .update({
            lease_start: tenantForm.lease_start || null,
            lease_end: tenantForm.lease_end || null
          })
          .eq("id", selectedTenantUnit.id);
        
        if (unitError) throw unitError;
      }
      
      toast.success("Tenant details updated!");
      setIsEditTenantDialogOpen(false);
      setSelectedTenantUnit(null);
      fetchPropertyData();
    } catch (error: any) {
      toast.error("Failed to update tenant details");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveTenant = async () => {
    if (!selectedTenantUnit) {
      toast.error("No unit selected");
      return;
    }
    
    setProcessing(true);
    try {
      // Update the unit to remove tenant (both online and manual)
      const { error } = await supabase
        .from("units")
        .update({
          tenant_id: null,
          status: "vacant",
          lease_start: null,
          lease_end: null,
          is_manual_tenant: false,
          manual_tenant_name: null,
          manual_tenant_email: null,
          manual_tenant_phone: null
        })
        .eq("id", selectedTenantUnit.id);
      
      if (error) throw error;
      
      toast.success("Tenant removed from unit");
      setIsRemoveTenantDialogOpen(false);
      setSelectedTenantUnit(null);
      fetchPropertyData();
    } catch (error: any) {
      toast.error("Failed to remove tenant");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const openEditTenantDialog = (unit: Unit) => {
    const tenant = unit.tenant_id ? tenants[unit.tenant_id] : null;
    setSelectedTenantUnit(unit);
    setTenantForm({
      full_name: unit.is_manual_tenant ? (unit.manual_tenant_name || "") : (tenant?.full_name || ""),
      email: unit.is_manual_tenant ? (unit.manual_tenant_email || "") : (tenant?.email || ""),
      phone: unit.is_manual_tenant ? (unit.manual_tenant_phone || "") : (tenant?.phone || ""),
      lease_start: unit.lease_start || "",
      lease_end: unit.lease_end || "",
      is_manual: unit.is_manual_tenant
    });
    setIsEditTenantDialogOpen(true);
  };

  const openRemoveTenantDialog = (unit: Unit) => {
    setSelectedTenantUnit(unit);
    setIsRemoveTenantDialogOpen(true);
  };

  const openDeletePaymentDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setDeletePassword("");
    setIsDeletePaymentDialogOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment || !user) {
      toast.error("No payment selected");
      return;
    }
    
    if (!deletePassword) {
      toast.error("Please enter your password to confirm deletion");
      return;
    }
    
    setProcessing(true);
    try {
      // Verify password by attempting to sign in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: deletePassword
      });
      
      if (authError) {
        toast.error("Incorrect password. Deletion cancelled.");
        setProcessing(false);
        return;
      }
      
      // Delete the payment
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", selectedPayment.id);
      
      if (error) throw error;
      
      toast.success("Payment deleted successfully");
      setIsDeletePaymentDialogOpen(false);
      setSelectedPayment(null);
      setDeletePassword("");
      fetchPropertyData();
    } catch (error: any) {
      toast.error("Failed to delete payment");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddMaintenance = async () => {
    const isPropertyWide = maintenanceForm.is_property_wide;
    
    if (!isPropertyWide && !selectedUnit) {
      toast.error("Please select a unit or choose 'Entire Property'");
      return;
    }
    
    if (!maintenanceForm.title || !maintenanceForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // For property-wide maintenance, use the first unit as a reference
    const unit = isPropertyWide ? units[0] : units.find(u => u.id === selectedUnit);
    if (!unit) {
      toast.error("No units available");
      return;
    }
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("maintenance_requests")
        .insert({
          unit_id: unit.id,
          tenant_id: user?.id, // Use landlord ID for manual entries
          title: maintenanceForm.title,
          description: maintenanceForm.description,
          category: maintenanceForm.category,
          priority: maintenanceForm.priority,
          status: "pending",
          is_property_wide: isPropertyWide,
          cost_amount: maintenanceForm.cost_amount ? parseFloat(maintenanceForm.cost_amount) : null,
          cost_currency: maintenanceForm.cost_currency,
          cost_paid_by: maintenanceForm.cost_paid_by || null,
          cost_notes: maintenanceForm.cost_notes || null
        });
      
      if (error) throw error;
      
      toast.success("Maintenance request added successfully");
      setIsAddMaintenanceDialogOpen(false);
      setMaintenanceForm({
        title: "",
        description: "",
        category: "general",
        priority: "medium",
        is_property_wide: false,
        cost_amount: "",
        cost_currency: "GHS",
        cost_paid_by: "",
        cost_notes: ""
      });
      setSelectedUnit("");
      fetchPropertyData();
    } catch (error: any) {
      toast.error("Failed to add maintenance request");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateMaintenanceStatus = async (requestId: string, newStatus: string) => {
    setProcessing(true);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from("maintenance_requests")
        .update(updateData)
        .eq("id", requestId);
      
      if (error) throw error;
      
      toast.success(`Status updated to ${newStatus}`);
      fetchPropertyData();
    } catch (error: any) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const openEditUnitDialog = (unit: Unit) => {
    setSelectedEditUnit(unit);
    setUnitForm({
      unit_number: unit.unit_number,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      square_feet: unit.square_feet?.toString() || "",
      rent_amount: unit.rent_amount.toString(),
      rent_currency: unit.rent_currency,
      status: unit.status
    });
    setIsEditUnitDialogOpen(true);
  };

  const handleEditUnit = async () => {
    if (!selectedEditUnit || !unitForm.unit_number || !unitForm.rent_amount) {
      toast.error("Please fill in required fields");
      return;
    }
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("units")
        .update({
          unit_number: unitForm.unit_number,
          bedrooms: unitForm.bedrooms,
          bathrooms: unitForm.bathrooms,
          square_feet: unitForm.square_feet ? parseInt(unitForm.square_feet) : null,
          rent_amount: parseFloat(unitForm.rent_amount),
          rent_currency: unitForm.rent_currency,
          status: unitForm.status
        })
        .eq("id", selectedEditUnit.id);
      
      if (error) throw error;
      
      toast.success("Unit updated successfully");
      setIsEditUnitDialogOpen(false);
      setSelectedEditUnit(null);
      fetchPropertyData();
    } catch (error: any) {
      toast.error("Failed to update unit");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!unitToDelete) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("units")
        .delete()
        .eq("id", unitToDelete.id);
      
      if (error) throw error;
      
      toast.success("Unit deleted successfully");
      setIsDeleteUnitDialogOpen(false);
      setUnitToDelete(null);
      fetchPropertyData();
    } catch (error: any) {
      toast.error("Failed to delete unit. It may have associated records.");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      vacant: "bg-secondary text-secondary-foreground",
      occupied: "bg-accent text-accent-foreground",
      maintenance: "bg-warning text-warning-foreground",
      pending: "bg-warning text-warning-foreground",
      active: "bg-accent text-accent-foreground",
      draft: "bg-muted text-muted-foreground",
      completed: "bg-accent text-accent-foreground",
      in_progress: "bg-primary text-primary-foreground"
    };
    
    return (
      <Badge className={statusStyles[status] || "bg-muted text-muted-foreground"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityStyles: Record<string, string> = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-warning text-warning-foreground",
      high: "bg-destructive text-destructive-foreground",
      urgent: "bg-destructive text-destructive-foreground"
    };
    
    return (
      <Badge variant="outline" className={priorityStyles[priority] || ""}>
        {priority}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const occupiedUnits = units.filter(u => u.status === "occupied");
  const vacantUnits = units.filter(u => u.status === "vacant");
  const activeContracts = contracts.filter(c => c.status === "active");
  const pendingMaintenance = maintenanceRequests.filter(m => m.status !== "completed");

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/properties")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
          
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                {property.name}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {property.address}, {property.city}, {property.country}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={isNoticeDialogOpen} onOpenChange={setIsNoticeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Bell className="h-4 w-4 mr-2" />
                    Send Notice
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Notice to Tenants</DialogTitle>
                    <DialogDescription>
                      Create and send a notice to all tenants of this property
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Notice Type</Label>
                      <Select 
                        value={noticeForm.type} 
                        onValueChange={(value) => setNoticeForm({ ...noticeForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Notice</SelectItem>
                          <SelectItem value="maintenance">Maintenance Notice</SelectItem>
                          <SelectItem value="rent">Rent Notice</SelectItem>
                          <SelectItem value="renewal">Renewal Notice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={noticeForm.title}
                        onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                        placeholder="Notice title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea
                        value={noticeForm.content}
                        onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                        placeholder="Notice content..."
                        rows={5}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNoticeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendNotice} disabled={processing}>
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Send Notice
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Units</p>
                  <p className="text-2xl font-bold">{units.length}</p>
                </div>
                <Home className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Occupancy</p>
                  <p className="text-2xl font-bold">
                    {occupiedUnits.length} / {vacantUnits.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Occupied / Vacant</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold">
                    {units[0]?.rent_currency || "GHS"} {Math.round(units.reduce((sum, u) => sum + Number(u.rent_amount), 0) / 12).toLocaleString()}
                  </p>
                </div>
                <Banknote className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Annual Rent</p>
                  <p className="text-2xl font-bold">
                    {units[0]?.rent_currency || "GHS"} {units.reduce((sum, u) => sum + Number(u.rent_amount), 0).toLocaleString()}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Maintenance</p>
                  <p className="text-2xl font-bold text-destructive">{pendingMaintenance.length}</p>
                </div>
                <Wrench className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="occupants">Occupants</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Property Type</p>
                      <p className="font-medium capitalize">{property.property_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Units</p>
                      <p className="font-medium">{property.total_units}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">{property.address}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">{property.city}, {property.state || ""} {property.country}</p>
                    </div>
                  </div>
                  {property.description && (
                    <div>
                      <p className="text-muted-foreground text-sm">Description</p>
                      <p className="text-sm mt-1">{property.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Units Overview</CardTitle>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Property Rental</p>
                      <p className="text-lg font-bold text-accent">
                        {units[0]?.rent_currency || "GHS"} {units.reduce((sum, u) => sum + Number(u.rent_amount), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {units.map(unit => (
                      <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">Unit {unit.unit_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {unit.bedrooms} bed, {unit.bathrooms} bath • {unit.rent_currency} {unit.rent_amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(unit.status)}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => openEditUnitDialog(unit)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {units.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No units added yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Occupants Tab */}
          <TabsContent value="occupants" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Current Occupants
                    </CardTitle>
                    <CardDescription>
                      Manage tenants occupying units in this property
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {/* Add Online Tenant Dialog */}
                    <Dialog open={isAddTenantDialogOpen} onOpenChange={(open) => {
                      setIsAddTenantDialogOpen(open);
                      if (open) {
                        // Reset form when opening
                        setTenantForm({ full_name: "", email: "", phone: "", lease_start: new Date().toISOString().split('T')[0], lease_end: "", is_manual: false });
                        setSelectedUnit("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" disabled={vacantUnits.length === 0}>
                          <Users className="h-4 w-4 mr-2" />
                          Add Online Tenant
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Online Tenant to Unit</DialogTitle>
                          <DialogDescription>
                            Assign an existing registered tenant to a vacant unit
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                            <p className="text-sm text-accent">
                              <strong>Online Tenant:</strong> This is for tenants who have an existing account on the platform. 
                              They will have full portal access.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Select Vacant Unit *</Label>
                            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a vacant unit" />
                              </SelectTrigger>
                              <SelectContent>
                                {vacantUnits.map(unit => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    Unit {unit.unit_number} - {unit.rent_currency} {unit.rent_amount.toLocaleString()}/mo
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Tenant Email *</Label>
                            <Input
                              type="email"
                              value={tenantForm.email}
                              onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                              placeholder="tenant@email.com"
                            />
                            <p className="text-xs text-muted-foreground">Tenant must have an existing account</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Full Name *</Label>
                            <Input
                              value={tenantForm.full_name}
                              onChange={(e) => setTenantForm({ ...tenantForm, full_name: e.target.value })}
                              placeholder="John Doe"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                              value={tenantForm.phone}
                              onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                              placeholder="+233 50 000 0000"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Lease Start</Label>
                              <Input
                                type="date"
                                value={tenantForm.lease_start}
                                onChange={(e) => setTenantForm({ ...tenantForm, lease_start: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Lease End</Label>
                              <Input
                                type="date"
                                value={tenantForm.lease_end}
                                onChange={(e) => setTenantForm({ ...tenantForm, lease_end: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddTenantDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddTenant} disabled={processing || !selectedUnit || !tenantForm.email}>
                            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                            Assign Tenant
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Add Manual Tenant Dialog */}
                    <Dialog open={isManualAddTenantDialogOpen} onOpenChange={(open) => {
                      setIsManualAddTenantDialogOpen(open);
                      if (open) {
                        // Reset form when opening
                        setTenantForm({ full_name: "", email: "", phone: "", lease_start: new Date().toISOString().split('T')[0], lease_end: "", is_manual: true });
                        setSelectedUnit("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button disabled={vacantUnits.length === 0}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Manual Tenant
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Manual Tenant Entry</DialogTitle>
                          <DialogDescription>
                            Manually add tenant information for record keeping
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                            <p className="text-sm text-secondary-foreground">
                              <strong>Manual Entry:</strong> This is for tenants who don't have an account on the platform. 
                              This is for data governance purposes only - they won't have portal access.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Select Vacant Unit *</Label>
                            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a vacant unit" />
                              </SelectTrigger>
                              <SelectContent>
                                {vacantUnits.map(unit => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    Unit {unit.unit_number} - {unit.rent_currency} {unit.rent_amount.toLocaleString()}/mo
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Full Name *</Label>
                            <Input
                              value={tenantForm.full_name}
                              onChange={(e) => setTenantForm({ ...tenantForm, full_name: e.target.value })}
                              placeholder="John Doe"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email (Optional)</Label>
                            <Input
                              type="email"
                              value={tenantForm.email}
                              onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                              placeholder="tenant@email.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone Number (Optional)</Label>
                            <Input
                              value={tenantForm.phone}
                              onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                              placeholder="+233 50 000 0000"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Lease Start</Label>
                              <Input
                                type="date"
                                value={tenantForm.lease_start}
                                onChange={(e) => setTenantForm({ ...tenantForm, lease_start: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Lease End</Label>
                              <Input
                                type="date"
                                value={tenantForm.lease_end}
                                onChange={(e) => setTenantForm({ ...tenantForm, lease_end: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsManualAddTenantDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleManualAddTenant} disabled={processing || !selectedUnit || !tenantForm.full_name}>
                            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                            Add Manual Tenant
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Online Tenants Section */}
                  {occupiedUnits.filter(u => !u.is_manual_tenant && u.tenant_id).length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
                          <div className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" />
                          Active Online
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({occupiedUnits.filter(u => !u.is_manual_tenant && u.tenant_id).length} tenants)
                        </span>
                      </div>
                      <div className="space-y-3">
                        {occupiedUnits.filter(u => !u.is_manual_tenant && u.tenant_id).map(unit => {
                          const tenant = unit.tenant_id ? tenants[unit.tenant_id] : null;
                          return (
                            <div key={unit.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors border-l-4 border-l-accent">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                                  <Users className="h-6 w-6 text-accent" />
                                </div>
                                <div>
                                  <p className="font-semibold">{tenant?.full_name || "Unknown Tenant"}</p>
                                  <p className="text-sm text-muted-foreground">Unit {unit.unit_number}</p>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                    {tenant?.email && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {tenant.email}
                                      </span>
                                    )}
                                    {tenant?.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {tenant.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-semibold">{unit.rent_currency} {unit.rent_amount.toLocaleString()}</p>
                                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                                  {unit.lease_end && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      <Calendar className="h-3 w-3 inline mr-1" />
                                      Lease ends: {new Date(unit.lease_end).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => openEditTenantDialog(unit)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => openRemoveTenantDialog(unit)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Manually Added Tenants Section */}
                  {occupiedUnits.filter(u => u.is_manual_tenant).length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground border-secondary">
                          <UserPlus className="h-3 w-3 mr-2" />
                          Manually Added
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({occupiedUnits.filter(u => u.is_manual_tenant).length} tenants)
                        </span>
                      </div>
                      <div className="space-y-3">
                        {occupiedUnits.filter(u => u.is_manual_tenant).map(unit => (
                          <div key={unit.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors border-l-4 border-l-secondary border-dashed">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                                <UserPlus className="h-6 w-6 text-secondary-foreground" />
                              </div>
                              <div>
                                <p className="font-semibold">{unit.manual_tenant_name || "Unknown Tenant"}</p>
                                <p className="text-sm text-muted-foreground">Unit {unit.unit_number}</p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  {unit.manual_tenant_email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {unit.manual_tenant_email}
                                    </span>
                                  )}
                                  {unit.manual_tenant_phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {unit.manual_tenant_phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-semibold">{unit.rent_currency} {unit.rent_amount.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                                {unit.lease_end && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    Lease ends: {new Date(unit.lease_end).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openEditTenantDialog(unit)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => openRemoveTenantDialog(unit)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {occupiedUnits.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-4">No occupied units</p>
                      {vacantUnits.length > 0 ? (
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" onClick={() => setIsAddTenantDialogOpen(true)}>
                            <Users className="h-4 w-4 mr-2" />
                            Add Online Tenant
                          </Button>
                          <Button onClick={() => setIsManualAddTenantDialogOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Manual Tenant
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Add units to this property first to assign tenants.</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Edit Tenant Dialog */}
            <Dialog open={isEditTenantDialogOpen} onOpenChange={setIsEditTenantDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Tenant Details</DialogTitle>
                  <DialogDescription>
                    Update tenant information for Unit {selectedTenantUnit?.unit_number}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={tenantForm.full_name}
                      onChange={(e) => setTenantForm({ ...tenantForm, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email {selectedTenantUnit?.is_manual_tenant ? "(Optional)" : ""}</Label>
                    <Input
                      type="email"
                      value={tenantForm.email}
                      onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                      disabled={!selectedTenantUnit?.is_manual_tenant}
                      className={!selectedTenantUnit?.is_manual_tenant ? "bg-muted" : ""}
                    />
                    {!selectedTenantUnit?.is_manual_tenant && (
                      <p className="text-xs text-muted-foreground">Email cannot be changed for online tenants</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={tenantForm.phone}
                      onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                      placeholder="+233 50 000 0000"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Lease Start</Label>
                      <Input
                        type="date"
                        value={tenantForm.lease_start}
                        onChange={(e) => setTenantForm({ ...tenantForm, lease_start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lease End</Label>
                      <Input
                        type="date"
                        value={tenantForm.lease_end}
                        onChange={(e) => setTenantForm({ ...tenantForm, lease_end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Payment amounts cannot be edited here to ensure data integrity. 
                      To change rent amount, please edit the unit details in the Properties section.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditTenantDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditTenant} disabled={processing || !tenantForm.full_name}>
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Remove Tenant Confirmation Dialog */}
            <Dialog open={isRemoveTenantDialogOpen} onOpenChange={setIsRemoveTenantDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove Tenant</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove this tenant from Unit {selectedTenantUnit?.unit_number}?
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">
                      This will mark the unit as vacant and remove the tenant assignment. 
                      Payment history and contracts will be preserved.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRemoveTenantDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleRemoveTenant} disabled={processing}>
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Remove Tenant
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Rental Contracts
                    </CardTitle>
                    <CardDescription>
                      Manage all contracts for this property
                    </CardDescription>
                  </div>
                  <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Issue Contract
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Issue New Contract</DialogTitle>
                        <DialogDescription>
                          Generate a rental contract for an occupied unit
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Select Unit</Label>
                          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an occupied unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {occupiedUnits.map(unit => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  Unit {unit.unit_number} - {tenants[unit.tenant_id!]?.full_name || "Tenant"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedUnit && (
                          <div className="p-4 bg-muted rounded-lg">
                            {(() => {
                              const unit = units.find(u => u.id === selectedUnit);
                              const tenant = unit?.tenant_id ? tenants[unit.tenant_id] : null;
                              return unit ? (
                                <div className="space-y-2 text-sm">
                                  <p><strong>Unit:</strong> {unit.unit_number}</p>
                                  <p><strong>Tenant:</strong> {tenant?.full_name || "Unknown"}</p>
                                  <p><strong>Rent:</strong> {unit.rent_currency} {unit.rent_amount.toLocaleString()}/month</p>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsContractDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleGenerateContract} disabled={processing || !selectedUnit}>
                          {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                          Generate Contract
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contracts.map(contract => {
                    const unit = units.find(u => u.id === contract.unit_id);
                    const tenant = tenants[contract.tenant_id];
                    return (
                      <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">Unit {unit?.unit_number || "N/A"}</p>
                            <p className="text-sm text-muted-foreground">{tenant?.full_name || "Unknown Tenant"}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span>{new Date(contract.start_date).toLocaleDateString()} - {new Date(contract.end_date).toLocaleDateString()}</span>
                              <span>{contract.rent_currency} {contract.monthly_rent.toLocaleString()}/mo</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(contract.status)}
                          <div className="flex gap-1">
                            {contract.landlord_signed_at && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Landlord Signed
                              </Badge>
                            )}
                            {contract.tenant_signed_at && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Tenant Signed
                              </Badge>
                            )}
                          </div>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {contracts.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No contracts yet</p>
                      <Button 
                        className="mt-4" 
                        variant="outline"
                        onClick={() => setIsContractDialogOpen(true)}
                        disabled={occupiedUnits.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Issue First Contract
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            {/* Record Payment and Request Payment Actions */}
            <div className="flex gap-3 justify-end">
              <Dialog open={isPaymentRequestDialogOpen} onOpenChange={setIsPaymentRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Send Reminder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Payment Reminder</DialogTitle>
                    <DialogDescription>
                      Send an SMS payment reminder to a tenant
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Select Unit</Label>
                      <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an occupied unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {occupiedUnits.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>
                              Unit {unit.unit_number} - {tenants[unit.tenant_id!]?.full_name || "Tenant"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedUnit && (
                      <div className="p-4 bg-muted rounded-lg">
                        {(() => {
                          const unit = units.find(u => u.id === selectedUnit);
                          const tenant = unit?.tenant_id ? tenants[unit.tenant_id] : null;
                          return unit ? (
                            <div className="space-y-2 text-sm">
                              <p><strong>Tenant:</strong> {tenant?.full_name || "Unknown"}</p>
                              <p><strong>Phone:</strong> {tenant?.phone || "Not available"}</p>
                              <p><strong>Amount Due:</strong> {unit.rent_currency} {unit.rent_amount.toLocaleString()}</p>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPaymentRequestDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRequestPayment} disabled={processing || !selectedUnit}>
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Send Reminder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isRecordPaymentDialogOpen} onOpenChange={setIsRecordPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                      Record a rent payment received from a tenant
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label>Select Unit *</Label>
                      <Select value={selectedUnit} onValueChange={(value) => {
                        setSelectedUnit(value);
                        const unit = units.find(u => u.id === value);
                        if (unit) {
                          setPaymentForm(prev => ({ 
                            ...prev, 
                            amount: unit.rent_amount.toString(),
                            payer_name: unit.is_manual_tenant ? (unit.manual_tenant_name || "") : "",
                            payer_phone: unit.is_manual_tenant ? (unit.manual_tenant_phone || "") : ""
                          }));
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an occupied unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {occupiedUnits.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>
                              Unit {unit.unit_number} - {unit.is_manual_tenant 
                                ? `${unit.manual_tenant_name || "Manual Tenant"} (Manual)` 
                                : (tenants[unit.tenant_id!]?.full_name || "Tenant")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Show manual tenant indicator */}
                    {selectedUnit && (() => {
                      const unit = units.find(u => u.id === selectedUnit);
                      return unit?.is_manual_tenant ? (
                        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                          <p className="text-sm text-warning font-medium flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Manual Tenant Entry
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            This payment will be marked as a manual entry
                          </p>
                        </div>
                      ) : null;
                    })()}

                    {/* Payer Details for Manual Tenants */}
                    {selectedUnit && (() => {
                      const unit = units.find(u => u.id === selectedUnit);
                      return unit?.is_manual_tenant ? (
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                          <h4 className="font-medium text-sm">Payer Details</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Payer Name *</Label>
                              <Input
                                value={paymentForm.payer_name}
                                onChange={(e) => setPaymentForm({ ...paymentForm, payer_name: e.target.value })}
                                placeholder="Enter payer name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Payer Phone</Label>
                              <Input
                                value={paymentForm.payer_phone}
                                onChange={(e) => setPaymentForm({ ...paymentForm, payer_phone: e.target.value })}
                                placeholder="Enter phone number"
                              />
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Date *</Label>
                        <Input
                          type="date"
                          value={paymentForm.payment_date}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={paymentForm.payment_method} onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reference Number</Label>
                      <Input
                        value={paymentForm.reference_number}
                        onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                        placeholder="Transaction ID or receipt number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        placeholder="Optional notes about this payment"
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsRecordPaymentDialogOpen(false);
                      setSelectedUnit("");
                      setPaymentForm({
                        amount: "",
                        payment_method: "cash",
                        reference_number: "",
                        notes: "",
                        payment_date: new Date().toISOString().split('T')[0],
                        payer_name: "",
                        payer_phone: ""
                      });
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleRecordPayment} disabled={processing || !selectedUnit || !paymentForm.amount}>
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Record Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Units with Rent Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Rent Overview
                </CardTitle>
                <CardDescription>
                  Current tenants and their rent amounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {occupiedUnits.map(unit => {
                    const tenant = unit.tenant_id ? tenants[unit.tenant_id] : null;
                    const unitPayments = payments.filter(p => p.unit_id === unit.id);
                    const lastPayment = unitPayments[0];
                    const tenantDisplayName = unit.is_manual_tenant 
                      ? (unit.manual_tenant_name || "Manual Tenant")
                      : (tenant?.full_name || "Unknown Tenant");
                    return (
                      <div key={unit.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${unit.is_manual_tenant ? 'bg-warning/10' : 'bg-accent/10'}`}>
                            {unit.is_manual_tenant ? (
                              <UserPlus className="h-5 w-5 text-warning" />
                            ) : (
                              <Banknote className="h-5 w-5 text-accent" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">Unit {unit.unit_number}</p>
                              {unit.is_manual_tenant && (
                                <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                                  Manual
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{tenantDisplayName}</p>
                            {lastPayment && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Last payment: {new Date(lastPayment.payment_date).toLocaleDateString()} - {lastPayment.currency} {lastPayment.amount.toLocaleString()}
                                {lastPayment.is_manual_entry && " (Manual Entry)"}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-lg">{unit.rent_currency} {unit.rent_amount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Monthly Rent</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedUnit(unit.id);
                                setPaymentForm(prev => ({ ...prev, amount: unit.rent_amount.toString() }));
                                setIsRecordPaymentDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Record
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedUnit(unit.id);
                                setIsPaymentRequestDialogOpen(true);
                              }}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {occupiedUnits.length === 0 && (
                    <div className="text-center py-8">
                      <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No occupied units to collect payments from</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  All recorded payments for this property
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.map(payment => {
                    const unit = units.find(u => u.id === payment.unit_id);
                    const tenant = tenants[payment.tenant_id];
                    const displayName = payment.is_manual_entry && payment.payer_name 
                      ? payment.payer_name 
                      : (unit?.is_manual_tenant 
                        ? (unit.manual_tenant_name || "Manual Tenant")
                        : (tenant?.full_name || "Unknown Tenant"));
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${payment.is_manual_entry ? 'bg-warning/10' : 'bg-accent/10'}`}>
                            {payment.is_manual_entry ? (
                              <UserPlus className="h-5 w-5 text-warning" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-accent" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">
                                {payment.currency} {payment.amount.toLocaleString()}
                              </p>
                              {payment.is_manual_entry && (
                                <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                                  Manual Entry
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Unit {unit?.unit_number || "N/A"} • {displayName}
                              {payment.payer_phone && (
                                <span className="ml-2 text-xs">({payment.payer_phone})</span>
                              )}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {payment.payment_method.replace("_", " ")}
                              </Badge>
                              {payment.reference_number && (
                                <span>Ref: {payment.reference_number}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(payment.status)}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => openDeletePaymentDialog(payment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {payments.length === 0 && (
                    <div className="text-center py-12">
                      <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No payments recorded yet</p>
                      <Button 
                        className="mt-4" 
                        variant="outline"
                        onClick={() => setIsRecordPaymentDialogOpen(true)}
                        disabled={occupiedUnits.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Record First Payment
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            {/* Add Maintenance Action */}
            <div className="flex gap-3 justify-end">
              <Dialog open={isAddMaintenanceDialogOpen} onOpenChange={(open) => {
                setIsAddMaintenanceDialogOpen(open);
                if (open) {
                  setMaintenanceForm({
                    title: "",
                    description: "",
                    category: "general",
                    priority: "medium",
                    is_property_wide: false,
                    cost_amount: "",
                    cost_currency: "GHS",
                    cost_paid_by: "",
                    cost_notes: ""
                  });
                  setSelectedUnit("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button disabled={units.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Maintenance Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Manual Maintenance Request</DialogTitle>
                    <DialogDescription>
                      Create a maintenance request for a unit or entire property
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                      <p className="text-sm text-secondary-foreground">
                        <strong>Manual Entry:</strong> This request is created by the landlord for record-keeping or scheduling purposes.
                      </p>
                    </div>
                    
                    {/* Property-wide toggle */}
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                      <input
                        type="checkbox"
                        id="is_property_wide"
                        checked={maintenanceForm.is_property_wide}
                        onChange={(e) => {
                          setMaintenanceForm({ ...maintenanceForm, is_property_wide: e.target.checked });
                          if (e.target.checked) setSelectedUnit("");
                        }}
                        className="h-4 w-4 rounded border-border"
                      />
                      <div>
                        <Label htmlFor="is_property_wide" className="cursor-pointer font-medium">
                          Entire Property Maintenance
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Apply this maintenance to the whole property (e.g., roof repairs, painting)
                        </p>
                      </div>
                    </div>
                    
                    {/* Unit selection - only show if not property-wide */}
                    {!maintenanceForm.is_property_wide && (
                      <div className="space-y-2">
                        <Label>Select Unit *</Label>
                        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map(unit => (
                              <SelectItem key={unit.id} value={unit.id}>
                                Unit {unit.unit_number} - {unit.status === "occupied" 
                                  ? (unit.is_manual_tenant ? unit.manual_tenant_name : tenants[unit.tenant_id!]?.full_name) || "Tenant"
                                  : "Vacant"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {maintenanceForm.is_property_wide && (
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-sm text-primary font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          This maintenance applies to: {property?.name}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        value={maintenanceForm.title}
                        onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                        placeholder="e.g., Plumbing repair needed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description *</Label>
                      <Textarea
                        value={maintenanceForm.description}
                        onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                        placeholder="Describe the maintenance issue in detail..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={maintenanceForm.category} onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                            <SelectItem value="electrical">Electrical</SelectItem>
                            <SelectItem value="hvac">HVAC</SelectItem>
                            <SelectItem value="appliance">Appliance</SelectItem>
                            <SelectItem value="structural">Structural</SelectItem>
                            <SelectItem value="pest_control">Pest Control</SelectItem>
                            <SelectItem value="landscaping">Landscaping</SelectItem>
                            <SelectItem value="painting">Painting</SelectItem>
                            <SelectItem value="roofing">Roofing</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={maintenanceForm.priority} onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, priority: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Cost/Payment Section */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Cost & Payment Details (Optional)
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cost Amount</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={maintenanceForm.cost_amount}
                            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost_amount: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select value={maintenanceForm.cost_currency} onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, cost_currency: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GHS">GHS</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>Paid By</Label>
                        <Select value={maintenanceForm.cost_paid_by} onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, cost_paid_by: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select who paid" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="landlord">Landlord</SelectItem>
                            <SelectItem value="tenant">Tenant</SelectItem>
                            <SelectItem value="shared">Shared</SelectItem>
                            <SelectItem value="pending">Payment Pending</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>Cost Notes</Label>
                        <Textarea
                          value={maintenanceForm.cost_notes}
                          onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost_notes: e.target.value })}
                          placeholder="Invoice details, contractor info, etc."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddMaintenanceDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddMaintenance} 
                      disabled={processing || (!maintenanceForm.is_property_wide && !selectedUnit) || !maintenanceForm.title || !maintenanceForm.description}
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Add Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Maintenance Requests
                </CardTitle>
                <CardDescription>
                  View and manage maintenance requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenanceRequests.map(request => {
                    const unit = units.find(u => u.id === request.unit_id);
                    const isManualUnit = unit?.is_manual_tenant;
                    const tenantName = isManualUnit 
                      ? (unit?.manual_tenant_name || "Manual Tenant")
                      : (tenants[request.tenant_id]?.full_name || "Unknown");
                    const isLandlordEntry = request.tenant_id === user?.id;
                    return (
                      <div key={request.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${
                              request.priority === "urgent" || request.priority === "high" 
                                ? "bg-destructive/10" 
                                : "bg-warning/10"
                            }`}>
                              <Wrench className={`h-5 w-5 ${
                                request.priority === "urgent" || request.priority === "high"
                                  ? "text-destructive"
                                  : "text-warning"
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold">{request.title}</p>
                                {request.is_property_wide && (
                                  <Badge className="bg-primary/10 text-primary border-primary/30">
                                    <Building2 className="h-3 w-3 mr-1" />
                                    Entire Property
                                  </Badge>
                                )}
                                {isLandlordEntry && (
                                  <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary-foreground border-secondary/30">
                                    Manual Entry
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {request.is_property_wide 
                                  ? `Property-wide • ${property?.name}` 
                                  : `Unit ${unit?.unit_number || "N/A"} • ${tenantName}`}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                              {/* Cost display */}
                              {request.cost_amount && (
                                <div className="mt-2 flex items-center gap-2 text-sm">
                                  <Banknote className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {request.cost_currency} {request.cost_amount.toLocaleString()}
                                  </span>
                                  {request.cost_paid_by && (
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {request.cost_paid_by === "pending" ? "Payment Pending" : `Paid by ${request.cost_paid_by}`}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge variant="outline">{request.category}</Badge>
                            {getPriorityBadge(request.priority)}
                            <Select 
                              value={request.status} 
                              onValueChange={(value) => handleUpdateMaintenanceStatus(request.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {maintenanceRequests.length === 0 && (
                    <div className="text-center py-12">
                      <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-4">No maintenance requests</p>
                      <Button 
                        variant="outline"
                        onClick={() => setIsAddMaintenanceDialogOpen(true)}
                        disabled={units.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Request
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delete Payment Confirmation Dialog */}
          <AlertDialog open={isDeletePaymentDialogOpen} onOpenChange={setIsDeletePaymentDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-destructive" />
                  Confirm Payment Deletion
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to delete a payment record of{" "}
                  <strong>{selectedPayment?.currency} {selectedPayment?.amount.toLocaleString()}</strong>.
                  This action cannot be undone. Please enter your password to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-password">Enter your password</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter password to confirm"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setDeletePassword("");
                  setSelectedPayment(null);
                }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeletePayment();
                  }}
                  disabled={processing || !deletePassword}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete Payment
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Edit Unit Dialog */}
          <Dialog open={isEditUnitDialogOpen} onOpenChange={setIsEditUnitDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" />
                  Edit Unit
                </DialogTitle>
                <DialogDescription>
                  Update unit details. Changes will affect the total property rental calculation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unit Number *</Label>
                    <Input
                      value={unitForm.unit_number}
                      onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
                      placeholder="e.g., 101, A1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={unitForm.status} onValueChange={(value) => setUnitForm({ ...unitForm, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vacant">Vacant</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bedrooms</Label>
                    <Input
                      type="number"
                      min="0"
                      value={unitForm.bedrooms}
                      onChange={(e) => setUnitForm({ ...unitForm, bedrooms: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bathrooms</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={unitForm.bathrooms}
                      onChange={(e) => setUnitForm({ ...unitForm, bathrooms: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Square Feet</Label>
                  <Input
                    type="number"
                    value={unitForm.square_feet}
                    onChange={(e) => setUnitForm({ ...unitForm, square_feet: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rent Amount *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={unitForm.rent_amount}
                      onChange={(e) => setUnitForm({ ...unitForm, rent_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={unitForm.rent_currency} onValueChange={(value) => setUnitForm({ ...unitForm, rent_currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GHS">GHS (Cedi)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="GBP">GBP (Pound)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-accent flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Total Property Rental: {unitForm.rent_currency} {units.reduce((sum, u) => 
                      sum + (u.id === selectedEditUnit?.id ? parseFloat(unitForm.rent_amount) || 0 : Number(u.rent_amount)), 0
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (selectedEditUnit) {
                      setUnitToDelete(selectedEditUnit);
                      setIsEditUnitDialogOpen(false);
                      setIsDeleteUnitDialogOpen(true);
                    }
                  }}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Unit
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditUnitDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditUnit} disabled={processing || !unitForm.unit_number || !unitForm.rent_amount}>
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Unit Confirmation Dialog */}
          <AlertDialog open={isDeleteUnitDialogOpen} onOpenChange={setIsDeleteUnitDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Unit
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete unit "{unitToDelete?.unit_number}"? This action cannot be undone. 
                  Any associated payments, contracts, or maintenance requests may also be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUnitToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUnit}
                  disabled={processing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete Unit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Tabs>
      </main>
    </div>
  );
};

export default PropertyDetails;
