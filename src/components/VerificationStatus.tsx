import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface RoleRequest {
  id: string;
  requested_role: string;
  status: string;
  created_at: string;
}

export const VerificationStatus = () => {
  const { user, userRole } = useAuth();
  const [request, setRequest] = useState<RoleRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPendingRequest();
    }
  }, [user]);

  const fetchPendingRequest = async () => {
    try {
      const { data, error } = await supabase
        .from("role_requests")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setRequest(data);
    } catch (error) {
      console.error("Error fetching verification status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !request) return null;

  const getStatusIcon = () => {
    switch (request.status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getAlertVariant = () => {
    switch (request.status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  // Don't show if already has the role
  if (userRole === request.requested_role) return null;

  return (
    <Alert variant={getAlertVariant()} className="mb-6">
      <div className="flex items-start gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <AlertTitle className="mb-1 flex items-center gap-2">
            Verification Status
            <Badge variant={
              request.status === "approved" ? "default" :
              request.status === "rejected" ? "destructive" :
              "secondary"
            }>
              {request.status.toUpperCase()}
            </Badge>
          </AlertTitle>
          <AlertDescription>
            {request.status === "pending" && (
              <>
                Your {request.requested_role} verification request is being reviewed. 
                You'll be notified once it's processed.
              </>
            )}
            {request.status === "approved" && (
              <>
                Your {request.requested_role} verification has been approved! 
                Your role will be active shortly.
              </>
            )}
            {request.status === "rejected" && (
              <>
                Your {request.requested_role} verification request was not approved. 
                Please contact support for more information.
              </>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
