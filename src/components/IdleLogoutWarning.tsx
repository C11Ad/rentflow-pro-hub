import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

export const IdleLogoutWarning = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const { isWarningVisible, secondsRemaining, stayLoggedIn, logoutNow } = useIdleLogout({
    onWarning: () => {},
    onLogout: handleLogout,
  });

  // Don't render if user is not logged in
  if (!user) return null;

  return (
    <AlertDialog open={isWarningVisible}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            You have been inactive. For your security, you will be logged out in{" "}
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {secondsRemaining} seconds
            </span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={logoutNow}
            className="w-full sm:w-auto gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout Now
          </Button>
          <AlertDialogAction
            onClick={stayLoggedIn}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
