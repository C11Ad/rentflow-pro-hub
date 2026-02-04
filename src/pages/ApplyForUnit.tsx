import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function ApplyForUnit() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unit, setUnit] = useState<any>(null);
  const [formData, setFormData] = useState({
    employment_status: "",
    annual_income: "",
    previous_address: "",
    references: "",
    move_in_date: "",
    additional_info: "",
  });

  useEffect(() => {
    if (unitId) {
      fetchUnitDetails();
    }
  }, [unitId]);

  const fetchUnitDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("units")
        .select(`
          id,
          unit_number,
          bedrooms,
          bathrooms,
          rent_amount,
          rent_currency,
          property:properties (
            id,
            name,
            address,
            city,
            state,
            country,
            landlord_id
          )
        `)
        .eq("id", unitId)
        .single();

      if (error) throw error;
      setUnit(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/browse-units");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !unit) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("rental_applications")
        .insert({
          unit_id: unitId,
          applicant_id: user.id,
          application_data: formData,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your rental application has been submitted successfully. The landlord will review it shortly.",
      });
      navigate("/tenant-portal");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!unit) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Apply for {unit.property.name} - Unit {unit.unit_number}</CardTitle>
            <CardDescription>
              {unit.property.address}, {unit.property.city}, {unit.property.state || unit.property.country}
              <br />
              Monthly Rent: {unit.rent_currency} {unit.rent_amount.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="employment_status">Employment Status *</Label>
                <Input
                  id="employment_status"
                  required
                  value={formData.employment_status}
                  onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                  placeholder="e.g., Full-time, Self-employed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annual_income">Annual Income *</Label>
                <Input
                  id="annual_income"
                  type="number"
                  required
                  value={formData.annual_income}
                  onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                  placeholder="Enter your annual income"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous_address">Previous Address *</Label>
                <Input
                  id="previous_address"
                  required
                  value={formData.previous_address}
                  onChange={(e) => setFormData({ ...formData, previous_address: e.target.value })}
                  placeholder="Your current or previous address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="references">References (Name and Contact) *</Label>
                <Textarea
                  id="references"
                  required
                  value={formData.references}
                  onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                  placeholder="Please provide at least 2 references with their contact information"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="move_in_date">Desired Move-in Date *</Label>
                <Input
                  id="move_in_date"
                  type="date"
                  required
                  value={formData.move_in_date}
                  onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_info">Additional Information</Label>
                <Textarea
                  id="additional_info"
                  value={formData.additional_info}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  placeholder="Any additional information you'd like to share"
                  rows={4}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/browse-units")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
