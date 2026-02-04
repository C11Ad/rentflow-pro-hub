import { useState, useEffect, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Banknote, AlertCircle, Home, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Property {
  id: string;
  name: string;
  total_units: number;
}

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  status: string;
  rent_amount: number;
  rent_currency: string;
  tenant_id: string | null;
  manual_tenant_name: string | null;
  lease_end: string | null;
  property?: Property;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_date: string;
  status: string;
  unit_id: string;
}

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { formatAmount, formatCompact } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [occupancyFilter, setOccupancyFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  
  // Real data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch properties
      const { data: propertiesData, error: propError } = await supabase
        .from("properties")
        .select("id, name, total_units")
        .order("created_at", { ascending: false });
      
      if (propError) throw propError;
      setProperties(propertiesData || []);

      // Fetch all units with property info
      const { data: unitsData, error: unitsError } = await supabase
        .from("units")
        .select(`
          id,
          property_id,
          unit_number,
          status,
          rent_amount,
          rent_currency,
          tenant_id,
          manual_tenant_name,
          lease_end,
          property:properties(id, name, total_units)
        `)
        .order("unit_number", { ascending: true });
      
      if (unitsError) throw unitsError;
      setUnits(unitsData || []);

      // Fetch payments
      const { data: paymentsData, error: payError } = await supabase
        .from("payments")
        .select("id, amount, currency, payment_date, status, unit_id")
        .order("payment_date", { ascending: false });
      
      if (payError) throw payError;
      setPayments(paymentsData || []);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchData();
    toast.success("Dashboard refreshed");
  };

  // Calculate metrics from real data
  const totalProperties = properties.length;
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === "occupied").length;
  const vacantUnits = units.filter(u => u.status === "vacant").length;
  const maintenanceUnits = units.filter(u => u.status === "maintenance").length;
  
  // Payment metrics
  const completedPayments = payments.filter(p => p.status === "completed");
  const pendingPayments = payments.filter(p => p.status === "pending");
  const overduePayments = payments.filter(p => p.status === "overdue");
  
  const monthlyIncome = completedPayments
    .filter(p => {
      const paymentDate = new Date(p.payment_date);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Generate cashflow data from payments (last 6 months) - revenue only
  const cashflowData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const result = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      
      const monthPayments = completedPayments.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear();
      });
      
      const income = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      result.push({ month: monthName, income });
    }
    return result;
  }, [completedPayments]);

  // Occupancy data for pie chart
  const occupancyData = useMemo(() => [
    { status: "Occupied", value: occupiedUnits, color: "hsl(var(--accent))" },
    { status: "Vacant", value: vacantUnits, color: "hsl(var(--muted))" },
    { status: "Maintenance", value: maintenanceUnits, color: "hsl(var(--warning))" },
  ], [occupiedUnits, vacantUnits, maintenanceUnits]);

  // Get payment status for a unit
  const getUnitPaymentStatus = (unitId: string) => {
    const unitPayments = payments.filter(p => p.unit_id === unitId);
    if (unitPayments.length === 0) return null;
    
    const latestPayment = unitPayments[0];
    return latestPayment.status;
  };

  // Get tenant name for a unit
  const getTenantName = (unit: Unit) => {
    if (unit.manual_tenant_name) return unit.manual_tenant_name;
    if (unit.tenant_id) return "Assigned Tenant";
    return null;
  };

  // Filter units based on search and filters
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const propertyName = (unit.property as any)?.name || "";
      const tenantName = getTenantName(unit) || "";
      const paymentStatus = getUnitPaymentStatus(unit.id);
      
      const matchesSearch = 
        unit.unit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenantName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesOccupancy = occupancyFilter === "all" || unit.status === occupancyFilter;
      const matchesPayment = paymentFilter === "all" || paymentStatus === paymentFilter;
      
      return matchesSearch && matchesOccupancy && matchesPayment;
    });
  }, [units, searchQuery, occupancyFilter, paymentFilter, payments]);

  const totalIncome = cashflowData.length > 0 ? cashflowData[cashflowData.length - 1].income : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Property Manager Dashboard</h1>
          <p className="text-muted-foreground text-justify max-w-4xl">
            Access comprehensive insights into your property portfolio with real-time performance metrics, financial analytics, and tenant management tools in one centralized command center.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground mb-2">{totalProperties}</div>
              <p className="text-sm text-muted-foreground">
                {totalUnits} total units
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent-green to-accent-green/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Banknote className="h-5 w-5 text-accent-green-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground mb-2">{formatCompact(monthlyIncome)}</div>
              <p className="text-sm text-accent font-medium flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl overflow-hidden group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-glow">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-accent mb-2">{formatCompact(totalIncome)}</div>
              <p className="text-sm text-foreground font-medium">
                This month's income
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Tenants</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground mb-2">{occupiedUnits}</div>
              {overduePayments.length > 0 ? (
                <p className="text-sm text-warning font-medium flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {overduePayments.length} payment{overduePayments.length > 1 ? 's' : ''} overdue
                </p>
              ) : (
                <p className="text-sm text-accent font-medium">All payments on track</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl font-bold">Revenue Analysis</CardTitle>
              <CardDescription className="text-justify text-base">
                Track income trends across your portfolio with detailed monthly comparisons that identify performance drivers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                    formatter={(value: number) => formatCompact(value)}
                  />
                  <Line type="monotone" dataKey="income" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ fill: "hsl(var(--accent))", r: 5 }} name="Income" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl font-bold">Occupancy Status</CardTitle>
              <CardDescription className="text-justify text-base">
                Visualize your portfolio's occupancy distribution to identify vacancy trends and optimize unit availability management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={occupancyData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Units Management */}
        <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 rounded-2xl bg-gradient-to-br from-card to-card/80">
          <CardHeader>
            <CardTitle className="text-foreground text-2xl font-bold">Units Management</CardTitle>
            <CardDescription className="text-justify text-base">
              Search and manage all units across your property portfolio. Monitor occupancy status, tenant details, and payment collection with comprehensive visibility.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by unit, property, or tenant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-border/50 focus:border-accent transition-colors"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">Occupancy:</label>
                    <Select value={occupancyFilter} onValueChange={setOccupancyFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="vacant">Vacant</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">Payment:</label>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="completed">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredUnits.length}</span> of <span className="font-semibold text-foreground">{units.length}</span> units
                </div>
              </div>
            </div>

            {/* Units Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Property</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Unit</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tenant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rent</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Lease End</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No units found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((unit) => {
                      const paymentStatus = getUnitPaymentStatus(unit.id);
                      const tenantName = getTenantName(unit);
                      const propertyName = (unit.property as any)?.name || "Unknown";
                      
                      return (
                        <tr key={unit.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-foreground font-medium">{propertyName}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{unit.unit_number}</td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={unit.status === "occupied" ? "default" : unit.status === "vacant" ? "secondary" : "secondary"}
                              className={
                                unit.status === "occupied" 
                                  ? "bg-accent text-accent-foreground" 
                                  : unit.status === "vacant"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-warning text-warning-foreground"
                              }
                            >
                              {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {tenantName || <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">{formatAmount(unit.rent_amount)}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {unit.lease_end ? new Date(unit.lease_end).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-3 px-4">
                            {paymentStatus ? (
                              <Badge 
                                variant={paymentStatus === "completed" ? "default" : paymentStatus === "pending" ? "secondary" : "destructive"}
                                className={
                                  paymentStatus === "completed"
                                    ? "bg-accent-green text-accent-green-foreground"
                                    : paymentStatus === "pending"
                                    ? "bg-warning text-warning-foreground"
                                    : "bg-destructive text-destructive-foreground"
                                }
                              >
                                {paymentStatus === "completed" ? "Paid" : paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
    </PullToRefresh>
  );
};

export default ManagerDashboard;
