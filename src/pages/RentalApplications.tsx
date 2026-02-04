import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, FileText, User, Banknote, Calendar, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Application {
  id: string;
  status: string;
  created_at: string;
  application_data: any;
  review_notes: string | null;
  unit: {
    id: string;
    unit_number: string;
    rent_amount: number;
    rent_currency: string;
    property: {
      id: string;
      name: string;
      address: string;
      city: string;
      state: string;
      country: string;
    };
  };
  applicant: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function RentalApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("rental_applications")
        .select(`
          id,
          status,
          created_at,
          application_data,
          review_notes,
          applicant_id,
          unit:units (
            id,
            unit_number,
            rent_amount,
            rent_currency,
            property:properties (
              id,
              name,
              address,
              city,
              state,
              country
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch applicant profiles separately
      const applicantIds = data?.map((app) => app.applicant_id) || [];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", applicantIds);

      if (profileError) throw profileError;

      // Merge profiles with applications
      const applicationsWithProfiles = data?.map((app) => ({
        ...app,
        applicant: profiles?.find((p) => p.id === app.applicant_id) || {
          id: app.applicant_id,
          full_name: "Unknown",
          email: "",
          phone: "",
        },
      })) || [];

      setApplications(applicationsWithProfiles);
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

  const handleApprove = async (application: Application) => {
    setProcessing(true);
    try {
      // Update application status
      const { error: updateError } = await supabase
        .from("rental_applications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      // Update unit status to occupied
      const { error: unitError } = await supabase
        .from("units")
        .update({
          status: "occupied",
          tenant_id: application.applicant.id,
        })
        .eq("id", application.unit.id);

      if (unitError) throw unitError;

      // Generate contract using edge function
      const { data: contractData, error: contractError } = await supabase.functions.invoke(
        "generate-contract",
        {
          body: {
            application_id: application.id,
            unit_id: application.unit.id,
            tenant_id: application.applicant.id,
            landlord_id: (await supabase.auth.getUser()).data.user?.id,
            monthly_rent: application.unit.rent_amount,
            rent_currency: application.unit.rent_currency,
            property_address: `${application.unit.property.address}, ${application.unit.property.city}`,
          },
        }
      );

      if (contractError) throw contractError;

      toast({
        title: "Application Approved",
        description: "The rental contract has been generated and sent to the tenant.",
      });
      
      setSelectedApp(null);
      setReviewNotes("");
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (application: Application) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("rental_applications")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq("id", application.id);

      if (error) throw error;

      toast({
        title: "Application Rejected",
        description: "The applicant will be notified.",
      });
      
      setSelectedApp(null);
      setReviewNotes("");
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filterApplications = (status: string) => {
    return applications.filter((app) => app.status === status);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Rental Applications</h1>
          <p className="text-muted-foreground">Review and manage tenant applications</p>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({filterApplications("pending").length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({filterApplications("approved").length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({filterApplications("rejected").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {filterApplications("pending").map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onReview={setSelectedApp}
                onApprove={handleApprove}
                onReject={handleReject}
                processing={processing}
                getStatusBadge={getStatusBadge}
              />
            ))}
            {filterApplications("pending").length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending applications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-6">
            {filterApplications("approved").map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onReview={setSelectedApp}
                getStatusBadge={getStatusBadge}
              />
            ))}
            {filterApplications("approved").length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No approved applications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-6">
            {filterApplications("rejected").map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onReview={setSelectedApp}
                getStatusBadge={getStatusBadge}
              />
            ))}
            {filterApplications("rejected").length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No rejected applications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {selectedApp && (
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Application</DialogTitle>
              <DialogDescription>
                Application for {selectedApp.unit.property.name} - Unit {selectedApp.unit.unit_number}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Applicant</Label>
                  <p className="font-medium">{selectedApp.applicant.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedApp.applicant.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedApp.applicant.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Monthly Rent</Label>
                  <p className="font-medium text-lg">
                    {selectedApp.unit.rent_currency} {selectedApp.unit.rent_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Application Details</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Employment Status</Label>
                    <p>{selectedApp.application_data.employment_status}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Annual Income</Label>
                    <p>{selectedApp.application_data.annual_income}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Previous Address</Label>
                    <p>{selectedApp.application_data.previous_address}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">References</Label>
                    <p className="whitespace-pre-wrap">{selectedApp.application_data.references}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Desired Move-in Date</Label>
                    <p>{new Date(selectedApp.application_data.move_in_date).toLocaleDateString()}</p>
                  </div>
                  {selectedApp.application_data.additional_info && (
                    <div>
                      <Label className="text-muted-foreground">Additional Information</Label>
                      <p className="whitespace-pre-wrap">{selectedApp.application_data.additional_info}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedApp.status === "pending" && (
                <div className="space-y-2">
                  <Label htmlFor="review_notes">Review Notes (Optional)</Label>
                  <Textarea
                    id="review_notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any notes about your decision..."
                    rows={3}
                  />
                </div>
              )}

              {selectedApp.review_notes && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Review Notes</Label>
                  <p className="whitespace-pre-wrap">{selectedApp.review_notes}</p>
                </div>
              )}
            </div>

            {selectedApp.status === "pending" && (
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedApp)}
                  disabled={processing}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button onClick={() => handleApprove(selectedApp)} disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve & Generate Contract
                    </>
                  )}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ApplicationCard({
  application,
  onReview,
  onApprove,
  onReject,
  processing,
  getStatusBadge,
}: {
  application: Application;
  onReview: (app: Application) => void;
  onApprove?: (app: Application) => void;
  onReject?: (app: Application) => void;
  processing?: boolean;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              {application.applicant.full_name}
            </CardTitle>
            <CardDescription className="mt-2">
              Applied on {new Date(application.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          {getStatusBadge(application.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {application.unit.property.name} - Unit {application.unit.unit_number}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <span>
              {application.unit.rent_currency} {application.unit.rent_amount.toLocaleString()}/month
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              Move-in: {new Date(application.application_data.move_in_date).toLocaleDateString()}
            </span>
          </div>
          <div className="pt-3 border-t space-y-2">
            <Button onClick={() => onReview(application)} variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              View Details
            </Button>
            {application.status === "pending" && onApprove && onReject && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => onReject(application)}
                  disabled={processing}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => onApprove(application)}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
