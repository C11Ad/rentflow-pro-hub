import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin, Building2, Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Unit {
  id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  rent_amount: number;
  rent_currency: string;
  status: string;
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    images: string[];
  };
}

export default function BrowseUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchVacantUnits();
  }, []);

  const fetchVacantUnits = async () => {
    try {
      const { data, error } = await supabase
        .from("units")
        .select(`
          id,
          unit_number,
          bedrooms,
          bathrooms,
          square_feet,
          rent_amount,
          rent_currency,
          status,
          property:properties (
            id,
            name,
            address,
            city,
            state,
            country,
            images
          )
        `)
        .eq("status", "vacant");

      if (error) throw error;
      setUnits(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (unitId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for a unit",
        variant: "destructive",
      });
      return;
    }

    // Check if user already has a pending application for this unit
    const { data: existingApp } = await supabase
      .from("rental_applications")
      .select("id")
      .eq("unit_id", unitId)
      .eq("applicant_id", user.id)
      .eq("status", "pending")
      .single();

    if (existingApp) {
      toast({
        title: "Application Exists",
        description: "You already have a pending application for this unit",
      });
      return;
    }

    navigate(`/apply/${unitId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading available units...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Available Units</h1>
          <p className="text-muted-foreground">Browse and apply for vacant rental units</p>
        </div>

        {units.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No vacant units available at this time</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <Card key={unit.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {unit.property.images && unit.property.images.length > 0 && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={unit.property.images[0]}
                      alt={unit.property.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-1">{unit.property.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {unit.property.city}, {unit.property.state || unit.property.country}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Unit {unit.unit_number}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          {unit.bedrooms} Bed
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-4 w-4 text-muted-foreground" />
                          {unit.bathrooms} Bath
                        </span>
                      </div>
                      {unit.square_feet && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Square className="h-4 w-4" />
                          {unit.square_feet} sq ft
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <Banknote className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-bold">
                          {unit.rent_amount.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground text-sm">/{unit.rent_currency}/mo</span>
                      </div>
                      <Button onClick={() => handleApply(unit.id)}>
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
