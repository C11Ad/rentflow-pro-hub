import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Building2, Plus, Edit, Home, Users, Banknote, MapPin, Eye, ImageIcon, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import UnitImageUpload from "@/components/UnitImageUpload";
import { AmenitySelector } from "@/components/PropertyHighlights";
import cribhubLogo from "@/assets/cribhub-logo.png";

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
  amenities: string[] | null;
  created_at: string;
}

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  rent_amount: number;
  rent_currency: string;
  status: string;
  tenant_id: string | null;
  images: string[] | null;
}

const REQUIRED_IMAGES = 5;

const Properties = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const [propertyForm, setPropertyForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    property_type: "apartment",
    total_units: 1,
    description: "",
    amenities: [] as string[]
  });

  const [unitForm, setUnitForm] = useState({
    unit_number: "",
    bedrooms: 1,
    bathrooms: 1,
    square_feet: "",
    rent_amount: "",
    rent_currency: "USD",
    images: [] as string[],
    listing_type: "rental" as "rental" | "sale",
    sale_price: "",
    mortgage_eligible: false
  });

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProperty) {
      fetchUnits(selectedProperty.id);
    }
  }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      toast.error("Failed to load properties");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("property_id", propertyId)
        .order("unit_number");

      if (error) throw error;
      setUnits(data || []);
    } catch (error: any) {
      toast.error("Failed to load units");
      console.error(error);
    }
  };

  const handleCreateProperty = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("properties")
        .insert([
          {
            ...propertyForm,
            landlord_id: user.id,
            total_units: parseInt(propertyForm.total_units.toString())
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Property created successfully");
      setProperties([data, ...properties]);
      setIsPropertyDialogOpen(false);
      resetPropertyForm();
    } catch (error: any) {
      toast.error("Failed to create property");
      console.error(error);
    }
  };

  const handleUpdateProperty = async () => {
    if (!editingProperty) return;

    try {
      const { error } = await supabase
        .from("properties")
        .update(propertyForm)
        .eq("id", editingProperty.id);

      if (error) throw error;

      toast.success("Property updated successfully");
      fetchProperties();
      setIsPropertyDialogOpen(false);
      setEditingProperty(null);
      resetPropertyForm();
    } catch (error: any) {
      toast.error("Failed to update property");
      console.error(error);
    }
  };

  const handleAddUnit = async () => {
    if (!selectedProperty) return;

    // Validate required images
    if (unitForm.images.length < REQUIRED_IMAGES) {
      toast.error(`Please upload at least ${REQUIRED_IMAGES} photos (exterior and interior views)`);
      return;
    }

    // Validate required fields
    if (!unitForm.unit_number.trim()) {
      toast.error("Unit number is required");
      return;
    }

    if (!unitForm.rent_amount || parseFloat(unitForm.rent_amount) <= 0) {
      toast.error("Valid rent amount is required");
      return;
    }

    try {
      const { error } = await supabase
        .from("units")
        .insert([
          {
            property_id: selectedProperty.id,
            unit_number: unitForm.unit_number,
            bedrooms: unitForm.bedrooms,
            bathrooms: unitForm.bathrooms,
            square_feet: unitForm.square_feet ? parseInt(unitForm.square_feet) : null,
            rent_amount: parseFloat(unitForm.rent_amount),
            rent_currency: unitForm.rent_currency,
            images: unitForm.images,
            status: "vacant",
            listing_type: unitForm.listing_type,
            sale_price: unitForm.listing_type === "sale" && unitForm.sale_price 
              ? parseFloat(unitForm.sale_price) 
              : null,
            mortgage_eligible: unitForm.listing_type === "sale" ? unitForm.mortgage_eligible : false,
            mortgage_partner: unitForm.mortgage_eligible ? "cribhub" : null
          }
        ]);

      if (error) throw error;

      toast.success("Unit added successfully with photos");
      fetchUnits(selectedProperty.id);
      setIsUnitDialogOpen(false);
      resetUnitForm();
    } catch (error: any) {
      toast.error("Failed to add unit");
      console.error(error);
    }
  };

  const resetPropertyForm = () => {
    setPropertyForm({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      property_type: "apartment",
      total_units: 1,
      description: "",
      amenities: []
    });
  };

  const resetUnitForm = () => {
    setUnitForm({
      unit_number: "",
      bedrooms: 1,
      bathrooms: 1,
      square_feet: "",
      rent_amount: "",
      rent_currency: "USD",
      images: [],
      listing_type: "rental",
      sale_price: "",
      mortgage_eligible: false
    });
  };

  const canAddUnit = unitForm.images.length >= REQUIRED_IMAGES && 
                     unitForm.unit_number.trim() !== "" && 
                     unitForm.rent_amount !== "" && 
                     parseFloat(unitForm.rent_amount) > 0;

  const openEditDialog = (property: Property) => {
    setEditingProperty(property);
    setPropertyForm({
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state || "",
      country: property.country,
      postal_code: property.postal_code || "",
      property_type: property.property_type,
      total_units: property.total_units,
      description: property.description || "",
      amenities: property.amenities || []
    });
    setIsPropertyDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-muted-foreground">Loading properties...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Properties</h1>
            <p className="text-muted-foreground">
              Manage your property portfolio, units, and tenant assignments
            </p>
          </div>
          <Dialog open={isPropertyDialogOpen} onOpenChange={setIsPropertyDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2" onClick={() => { setEditingProperty(null); resetPropertyForm(); }}>
                <Plus className="h-5 w-5" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProperty ? "Edit Property" : "Add New Property"}</DialogTitle>
                <DialogDescription>
                  {editingProperty ? "Update property information" : "Enter property details to add it to your portfolio"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Property Name *</Label>
                  <Input
                    id="name"
                    value={propertyForm.name}
                    onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                    placeholder="e.g., Sunset Apartments"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">Property Type *</Label>
                  <Select value={propertyForm.property_type} onValueChange={(value) => setPropertyForm({ ...propertyForm, property_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={propertyForm.address}
                    onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={propertyForm.city}
                      onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={propertyForm.state}
                      onChange={(e) => setPropertyForm({ ...propertyForm, state: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={propertyForm.country}
                      onChange={(e) => setPropertyForm({ ...propertyForm, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={propertyForm.postal_code}
                      onChange={(e) => setPropertyForm({ ...propertyForm, postal_code: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_units">Total Units *</Label>
                  <Input
                    id="total_units"
                    type="number"
                    min="1"
                    value={propertyForm.total_units}
                    onChange={(e) => setPropertyForm({ ...propertyForm, total_units: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={propertyForm.description}
                    onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                    placeholder="Highlight key features like location benefits, nearby amenities, views..."
                    rows={3}
                  />
                </div>
                <AmenitySelector
                  selected={propertyForm.amenities}
                  onChange={(amenities) => setPropertyForm({ ...propertyForm, amenities })}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPropertyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingProperty ? handleUpdateProperty : handleCreateProperty}>
                  {editingProperty ? "Update Property" : "Create Property"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {properties.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first property to the system
              </p>
              <Button onClick={() => setIsPropertyDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Properties List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Properties ({properties.length})</h2>
              {properties.map((property) => (
                <Card
                  key={property.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedProperty?.id === property.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedProperty(property)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          {property.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-4 w-4" />
                            {property.city}, {property.country}
                          </div>
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(property);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">
                          <Home className="h-3 w-3 mr-1" />
                          {property.total_units} Units
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {property.property_type}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/properties/${property.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                    {property.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {property.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Units Section */}
            <div>
              {selectedProperty ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      Units - {selectedProperty.name}
                    </h2>
                    <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2" onClick={resetUnitForm}>
                          <Plus className="h-4 w-4" />
                          Add Unit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>Add New Unit</DialogTitle>
                          <DialogDescription>
                            Add a unit to {selectedProperty.name}. Photos are required.
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[65vh] pr-4">
                          <div className="space-y-4 py-4">
                            {/* Image Upload Section - First and Required */}
                            <UnitImageUpload
                              images={unitForm.images}
                              onImagesChange={(images) => setUnitForm({ ...unitForm, images })}
                              propertyId={selectedProperty.id}
                              unitNumber={unitForm.unit_number || "new-unit"}
                              minImages={REQUIRED_IMAGES}
                              maxImages={10}
                            />

                            <div className="border-t pt-4 mt-4">
                              <h4 className="font-medium mb-3">Unit Details</h4>
                              
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="unit_number">Unit Number *</Label>
                                  <Input
                                    id="unit_number"
                                    value={unitForm.unit_number}
                                    onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
                                    placeholder="e.g., 101, A-205"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="bedrooms">Bedrooms *</Label>
                                    <Input
                                      id="bedrooms"
                                      type="number"
                                      min="0"
                                      value={unitForm.bedrooms}
                                      onChange={(e) => setUnitForm({ ...unitForm, bedrooms: parseInt(e.target.value) || 0 })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="bathrooms">Bathrooms *</Label>
                                    <Input
                                      id="bathrooms"
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={unitForm.bathrooms}
                                      onChange={(e) => setUnitForm({ ...unitForm, bathrooms: parseFloat(e.target.value) || 0 })}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="square_feet">Square Feet</Label>
                                  <Input
                                    id="square_feet"
                                    type="number"
                                    value={unitForm.square_feet}
                                    onChange={(e) => setUnitForm({ ...unitForm, square_feet: e.target.value })}
                                    placeholder="Optional"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="rent_amount">Rent Amount *</Label>
                                    <Input
                                      id="rent_amount"
                                      type="number"
                                      step="0.01"
                                      value={unitForm.rent_amount}
                                      onChange={(e) => setUnitForm({ ...unitForm, rent_amount: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="rent_currency">Currency *</Label>
                                    <Select value={unitForm.rent_currency} onValueChange={(value) => setUnitForm({ ...unitForm, rent_currency: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        <SelectItem value="GHS">GHS</SelectItem>
                                        <SelectItem value="NGN">NGN</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Listing Type */}
                                <div className="space-y-2">
                                  <Label>Listing Type</Label>
                                  <Select 
                                    value={unitForm.listing_type} 
                                    onValueChange={(value: "rental" | "sale") => setUnitForm({ ...unitForm, listing_type: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="rental">For Rent</SelectItem>
                                      <SelectItem value="sale">For Sale</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Sale Price - only shown when listing type is sale */}
                                {unitForm.listing_type === "sale" && (
                                  <>
                                    <div className="space-y-2">
                                      <Label htmlFor="sale_price">Sale Price *</Label>
                                      <Input
                                        id="sale_price"
                                        type="number"
                                        step="1000"
                                        value={unitForm.sale_price}
                                        onChange={(e) => setUnitForm({ ...unitForm, sale_price: e.target.value })}
                                        placeholder="e.g., 500000"
                                      />
                                    </div>

                                    {/* CribHub Mortgage Option */}
                                    <div className="bg-accent/10 rounded-lg p-4 space-y-3 border border-accent/20">
                                      <div className="flex items-center gap-3">
                                        <img src={cribhubLogo} alt="CribHub" className="h-8 object-contain" />
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">Offer Mortgage via CribHub</p>
                                          <p className="text-xs text-muted-foreground">
                                            Allow buyers to explore mortgage options brokered by CribHub
                                          </p>
                                        </div>
                                        <Switch
                                          checked={unitForm.mortgage_eligible}
                                          onCheckedChange={(checked) => setUnitForm({ ...unitForm, mortgage_eligible: checked })}
                                        />
                                      </div>
                                      {unitForm.mortgage_eligible && (
                                        <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
                                          Buyers will see a mortgage calculator and can contact CribHub for personalized rates.
                                        </p>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </ScrollArea>
                        <DialogFooter className="border-t pt-4">
                          <Button variant="outline" onClick={() => setIsUnitDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleAddUnit} 
                            disabled={!canAddUnit}
                            className="gap-2"
                          >
                            <ImageIcon className="h-4 w-4" />
                            Add Unit ({unitForm.images.length}/{REQUIRED_IMAGES} photos)
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {units.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Home className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="font-semibold mb-2">No units added</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start by adding units to this property
                        </p>
                        <Button size="sm" onClick={() => setIsUnitDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Unit
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {units.map((unit) => (
                        <Card key={unit.id}>
                          <CardContent className="pt-6">
                            <div className="flex gap-4">
                              {/* Unit thumbnail */}
                              {unit.images && unit.images.length > 0 ? (
                                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                                  <img
                                    src={unit.images[0]}
                                    alt={`Unit ${unit.unit_number}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center">
                                  <Home className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-bold text-lg">Unit {unit.unit_number}</h3>
                                  <Badge variant={unit.status === "occupied" ? "default" : unit.status === "vacant" ? "secondary" : "secondary"}>
                                    {unit.status}
                                  </Badge>
                                  {unit.images && unit.images.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      {unit.images.length} photos
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{unit.bedrooms} bed, {unit.bathrooms} bath</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Banknote className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">
                                      {unit.rent_currency} {unit.rent_amount.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                {unit.square_feet && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {unit.square_feet.toLocaleString()} sq ft
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-2">Select a property</h3>
                    <p className="text-sm text-muted-foreground">
                      Click on a property to view and manage its units
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Properties;
