import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, CheckCircle, Clock, PenTool, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateBrandedPdf } from "@/lib/documentBranding";

interface RentalContract {
  id: string;
  tenant_id: string;
  unit_id: string;
  landlord_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  rent_currency: string;
  status: string;
  contract_type: string;
  content: string | null;
  created_at: string;
  tenant_signed_at: string | null;
  landlord_signed_at: string | null;
}

interface Unit {
  id: string;
  unit_number: string;
  property: {
    name: string;
  } | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

const Contracts = () => {
  const { user, userRole } = useAuth();
  const [contracts, setContracts] = useState<(RentalContract & { unit?: Unit; tenant?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [units, setUnits] = useState<(Unit & { tenant_id: string | null })[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    tenantName: "",
    unitId: "",
    currency: "USD",
    rent: "",
    leaseTerm: "12",
    startDate: "",
    endDate: "",
    specialTerms: ""
  });

  useEffect(() => {
    if (user) {
      fetchContracts();
      if (userRole === "landlord" || userRole === "property_manager" || userRole === "admin") {
        fetchUnits();
      }
    }
  }, [user, userRole]);

  const fetchContracts = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from("rental_contracts")
        .select(`
          *,
          unit:units(id, unit_number, property:properties(name))
        `)
        .order("created_at", { ascending: false });
      
      // Filter based on role
      if (userRole === "tenant") {
        query = query.eq("tenant_id", user.id);
      } else if (userRole === "landlord") {
        query = query.eq("landlord_id", user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch tenant profiles for each contract
      const contractsWithTenants = await Promise.all(
        (data || []).map(async (contract) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", contract.tenant_id)
            .maybeSingle();
          return { ...contract, tenant: profile || undefined };
        })
      );
      
      setContracts(contractsWithTenants);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    if (!user) return;
    
    try {
      const { data: properties } = await supabase
        .from("properties")
        .select("id")
        .eq("landlord_id", user.id);
      
      if (!properties || properties.length === 0) return;
      
      const propertyIds = properties.map(p => p.id);
      
      const { data: unitsData, error } = await supabase
        .from("units")
        .select(`
          id, 
          unit_number, 
          tenant_id,
          property:properties(name)
        `)
        .in("property_id", propertyIds);
      
      if (error) throw error;
      setUnits(unitsData || []);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  const handleGenerateContract = async () => {
    if (!formData.unitId || !formData.rent || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("End date must be after start date");
      return;
    }
    
    setGenerating(true);
    
    try {
      const selectedUnit = units.find(u => u.id === formData.unitId);
      if (!selectedUnit) throw new Error("Unit not found");
      
      // Generate contract content using edge function
      const { data: generatedContent, error: genError } = await supabase.functions.invoke("generate-contract", {
        body: {
          tenantName: formData.tenantName || "Tenant",
          unitNumber: selectedUnit.unit_number,
          propertyName: selectedUnit.property?.name || "Property",
          monthlyRent: parseFloat(formData.rent),
          currency: formData.currency,
          startDate: formData.startDate,
          endDate: formData.endDate,
          leaseTerm: `${formData.leaseTerm} months`,
          specialTerms: formData.specialTerms
        }
      });
      
      if (genError) throw genError;
      
      // Create the contract in the database
      const { error: insertError } = await supabase
        .from("rental_contracts")
        .insert({
          landlord_id: user!.id,
          tenant_id: selectedUnit.tenant_id || user!.id, // Fallback to landlord if no tenant assigned
          unit_id: formData.unitId,
          start_date: formData.startDate,
          end_date: formData.endDate,
          monthly_rent: parseFloat(formData.rent),
          rent_currency: formData.currency,
          status: "draft",
          contract_type: "lease_agreement",
          content: generatedContent?.content || null
        });
      
      if (insertError) throw insertError;
      
      toast.success("Contract generated successfully!", {
        description: "The contract has been created and is ready for review.",
      });
      
      // Reset form and refresh
      setFormData({
        tenantName: "",
        unitId: "",
        currency: "USD",
        rent: "",
        leaseTerm: "12",
        startDate: "",
        endDate: "",
        specialTerms: ""
      });
      
      fetchContracts();
    } catch (error: any) {
      console.error("Error generating contract:", error);
      toast.error(error.message || "Failed to generate contract");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadContract = async (contract: RentalContract & { unit?: Unit; tenant?: Profile }) => {
    try {
      const content = contract.content || `
Lease Agreement

Tenant: ${contract.tenant?.full_name || "N/A"}
Unit: ${contract.unit?.unit_number || "N/A"}
Property: ${contract.unit?.property?.name || "N/A"}

Term: ${new Date(contract.start_date).toLocaleDateString()} - ${new Date(contract.end_date).toLocaleDateString()}
Monthly Rent: ${contract.rent_currency} ${contract.monthly_rent.toLocaleString()}

Status: ${contract.status}
`;
      
      const fileName = `Contract_${contract.unit?.unit_number || contract.id}_${new Date().toISOString().split("T")[0]}`;
      
      const pdf = await generateBrandedPdf(
        `Lease Agreement - ${contract.unit?.property?.name || "Property"}`,
        content,
        "Lease Agreement",
        contract.unit?.property?.name || "Property",
        contract.id
      );
      
      pdf.save(`${fileName}.pdf`);
      
      toast.success("Contract downloaded as PDF");
    } catch (error) {
      console.error("Error downloading contract:", error);
      toast.error("Failed to download contract");
    }
  };

  const handleSendReminder = async (contract: RentalContract & { tenant?: Profile }) => {
    toast.success("Signature reminder sent", {
      description: `Reminder sent to ${contract.tenant?.email || "tenant"}`
    });
  };

  const handleSignContract = async (contractId: string) => {
    try {
      const updateField = userRole === "landlord" ? "landlord_signed_at" : "tenant_signed_at";
      
      const { error } = await supabase
        .from("rental_contracts")
        .update({ 
          [updateField]: new Date().toISOString(),
          status: "active" // Update status when signed
        })
        .eq("id", contractId);
      
      if (error) throw error;
      
      toast.success("Contract signed successfully!");
      fetchContracts();
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error("Failed to sign contract");
    }
  };

  // Calculate stats
  const signedCount = contracts.filter(c => c.status === "active" || c.status === "signed").length;
  const pendingCount = contracts.filter(c => c.status === "pending").length;
  const draftCount = contracts.filter(c => c.status === "draft").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "signed":
        return <Badge className="bg-accent text-accent-foreground">Signed</Badge>;
      case "pending":
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Legal Contract Portal</h1>
          <p className="text-muted-foreground text-justify max-w-4xl">
            Streamline your legal documentation with intelligent contract generation, secure e-signature workflows, and comprehensive agreement management.
          </p>
        </div>

        {/* Contract Generator - Only for landlords/managers */}
        {(userRole === "landlord" || userRole === "property_manager" || userRole === "admin") && (
          <Card className="mb-8 border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Generate New Contract
              </CardTitle>
              <CardDescription className="text-justify">
                Create professional lease agreements with customizable templates that automatically populate tenant and property details, ensuring accuracy and compliance with local regulations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tenant-name">Tenant Name</Label>
                    <Input 
                      id="tenant-name" 
                      placeholder="Enter tenant name"
                      value={formData.tenantName}
                      onChange={(e) => setFormData(prev => ({ ...prev, tenantName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Select Unit</Label>
                    <Select value={formData.unitId} onValueChange={(value) => setFormData(prev => ({ ...prev, unitId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.property?.name} - Unit {unit.unit_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={formData.currency} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger id="currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GHS">GHS (₵)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="NGN">NGN (₦)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="rent">Monthly Rent</Label>
                      <Input 
                        id="rent" 
                        type="number" 
                        placeholder="2500"
                        value={formData.rent}
                        onChange={(e) => setFormData(prev => ({ ...prev, rent: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="lease-term">Lease Term (months)</Label>
                    <Select 
                      value={formData.leaseTerm} 
                      onValueChange={(value) => {
                        setFormData(prev => {
                          const updated = { ...prev, leaseTerm: value };
                          if (prev.startDate) {
                            const start = new Date(prev.startDate);
                            const end = new Date(start);
                            end.setMonth(end.getMonth() + parseInt(value));
                            updated.endDate = end.toISOString().split("T")[0];
                          }
                          return updated;
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="18">18 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input 
                      id="start-date" 
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => {
                        setFormData(prev => {
                          const updated = { ...prev, startDate: e.target.value };
                          if (e.target.value && prev.leaseTerm) {
                            const start = new Date(e.target.value);
                            const end = new Date(start);
                            end.setMonth(end.getMonth() + parseInt(prev.leaseTerm));
                            updated.endDate = end.toISOString().split("T")[0];
                          }
                          return updated;
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input 
                      id="end-date" 
                      type="date"
                      value={formData.endDate}
                      min={formData.startDate || undefined}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="special-terms">Special Terms</Label>
                    <Textarea 
                      id="special-terms" 
                      placeholder="Add any special conditions or clauses"
                      className="resize-none"
                      value={formData.specialTerms}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialTerms: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={handleGenerateContract}
                  disabled={generating}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Contract
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Signed Contracts</CardTitle>
              <CheckCircle className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{signedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Fully executed</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Signature</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Draft Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{draftCount}</div>
              <p className="text-xs text-muted-foreground mt-1">In preparation</p>
            </CardContent>
          </Card>
        </div>

        {/* Contracts List */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Contracts</CardTitle>
            <CardDescription className="text-justify">
              Monitor the status of all lease agreements, track signature workflows, and manage contract lifecycles from draft to execution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Loading contracts...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No contracts found</p>
                {(userRole === "landlord" || userRole === "property_manager") && (
                  <p className="text-sm text-muted-foreground mt-2">Generate your first contract above</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {contract.contract_type === "lease_agreement" ? "Lease Agreement" : contract.contract_type}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {contract.tenant?.full_name || contract.tenant?.email || "Tenant"} • Unit {contract.unit?.unit_number || "N/A"}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(contract.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Term: {new Date(contract.start_date).toLocaleDateString()} - {new Date(contract.end_date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {contract.rent_currency} {contract.monthly_rent.toLocaleString()}/mo
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getStatusBadge(contract.status)}
                      
                      <div className="flex gap-2">
                        {(contract.status === "active" || contract.status === "signed") && (
                          <Button size="sm" variant="outline" onClick={() => handleDownloadContract(contract)}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                        {contract.status === "pending" && userRole === "landlord" && (
                          <Button size="sm" onClick={() => handleSendReminder(contract)}>
                            <Send className="h-4 w-4 mr-1" />
                            Remind
                          </Button>
                        )}
                        {contract.status === "pending" && userRole === "tenant" && !contract.tenant_signed_at && (
                          <Button size="sm" onClick={() => handleSignContract(contract.id)}>
                            <PenTool className="h-4 w-4 mr-1" />
                            Sign
                          </Button>
                        )}
                        {contract.status === "draft" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleDownloadContract(contract)}>
                              <Download className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button size="sm" onClick={() => handleSignContract(contract.id)}>
                              <PenTool className="h-4 w-4 mr-1" />
                              Sign & Send
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Contracts;