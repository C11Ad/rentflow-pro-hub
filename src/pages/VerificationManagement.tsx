import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: string;
  status: string;
  verification_notes: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const VerificationManagement = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (userRole !== "admin" && userRole !== "landlord"))) {
      navigate("/");
      return;
    }

    if (user) {
      fetchRoleRequests();
    }
  }, [user, userRole, authLoading, navigate]);

  const fetchRoleRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("role_requests")
        .select("*")
        .order("created_at", { ascending: false });

      // Landlords can only see property_manager requests
      if (userRole === "landlord") {
        query = query.eq("requested_role", "property_manager");
      }

      const { data: requestsData, error } = await query;

      if (error) throw error;

      // Fetch profiles separately
      if (requestsData && requestsData.length > 0) {
        const userIds = requestsData.map(r => r.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.id, p]) || []
        );

        const enrichedRequests = requestsData.map(req => ({
          ...req,
          profiles: profilesMap.get(req.user_id) || { full_name: "Unknown", email: "unknown@email.com" }
        }));

        setRequests(enrichedRequests as RoleRequest[]);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching role requests:", error);
      toast({
        title: "Error",
        description: "Failed to load verification requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, userId: string, role: string) => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from("role_requests")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Assign the role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: role as "admin" | "landlord" | "property_manager" | "tenant",
        });

      if (roleError) throw roleError;

      toast({
        title: "Approved",
        description: "Role has been assigned successfully",
      });

      fetchRoleRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("role_requests")
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Rejected",
        description: "Request has been rejected",
      });

      fetchRoleRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden p-8">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Verification Management</CardTitle>
            <CardDescription>
              Review and approve role verification requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No pending verification requests
              </p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {request.profiles?.full_name || "Unknown User"}
                            </h3>
                            <Badge variant={
                              request.status === "approved" ? "default" :
                              request.status === "rejected" ? "destructive" :
                              "secondary"
                            }>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.profiles?.email}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Requesting: {request.requested_role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {request.verification_notes && (
                            <div className="mt-2 p-3 bg-muted rounded-md">
                              <p className="text-sm font-medium mb-1">Verification Notes:</p>
                              <p className="text-sm text-muted-foreground">
                                {request.verification_notes}
                              </p>
                            </div>
                          )}
                        </div>
                        {request.status === "pending" && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id, request.user_id, request.requested_role)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerificationManagement;
