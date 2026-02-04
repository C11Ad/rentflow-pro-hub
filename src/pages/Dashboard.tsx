import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/PageLoader";

const Dashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [roleTimeout, setRoleTimeout] = useState(false);

  useEffect(() => {
    // Wait until initial auth check is done
    if (loading) return;

    // If not authenticated, redirect to auth
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    // Set a timeout if role doesn't load within 5 seconds
    const timeoutId = setTimeout(() => {
      if (!userRole) {
        console.warn("⚠️ User role not found after timeout. User may not have a role assigned.");
        setRoleTimeout(true);
        // Redirect to home page if role can't be determined
        navigate("/", { replace: true });
      }
    }, 5000);

    // If user is authenticated but role not yet resolved, wait
    if (!userRole) {
      return () => clearTimeout(timeoutId);
    }

    // Clear timeout if role is found
    clearTimeout(timeoutId);

    // Redirect based on user role once we have a role
    switch (userRole) {
      case "property_manager":
      case "admin":
        navigate("/manager-dashboard", { replace: true });
        break;
      case "landlord":
        navigate("/landlord-dashboard", { replace: true });
        break;
      case "tenant":
        navigate("/tenant-portal", { replace: true });
        break;
      default:
        // If no valid role, send to home
        console.warn(`⚠️ Unknown user role: ${userRole}`);
        navigate("/", { replace: true });
        break;
    }

    return () => clearTimeout(timeoutId);
  }, [user, userRole, loading, navigate]);

  // Show timeout message if role loading takes too long
  if (roleTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Unable to Load User Role</h2>
          <p className="text-muted-foreground mb-4">
            Your account may not have a role assigned. Please contact support or sign in again.
          </p>
          <button
            onClick={() => {
              navigate("/auth");
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return <PageLoader />;
};

export default Dashboard;
