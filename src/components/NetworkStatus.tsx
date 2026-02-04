import { useEffect, useState, useCallback } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Hook to monitor network connectivity status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success("Back online", {
          description: "Your connection has been restored",
          duration: 3000,
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.error("You're offline", {
        description: "Check your internet connection",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

/**
 * Visual indicator for network connectivity
 */
export function NetworkStatusIndicator() {
  const { isOnline } = useNetworkStatus();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
    } else {
      // Delay hiding to show "back online" state briefly
      const timer = setTimeout(() => setIsVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!isVisible && isOnline) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300",
        isOnline
          ? "bg-accent-green text-accent-green-foreground"
          : "bg-destructive text-destructive-foreground"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">No connection</span>
        </>
      )}
    </div>
  );
}

interface RetryButtonProps {
  onRetry: () => void;
  loading?: boolean;
  className?: string;
}

export function RetryButton({ onRetry, loading, className }: RetryButtonProps) {
  return (
    <Button
      onClick={onRetry}
      disabled={loading}
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
    >
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      {loading ? "Retrying..." : "Retry"}
    </Button>
  );
}

/**
 * Hook for detecting slow connections
 */
export function useConnectionQuality() {
  const [connectionQuality, setConnectionQuality] = useState<"good" | "slow" | "offline">("good");

  useEffect(() => {
    if (!navigator.onLine) {
      setConnectionQuality("offline");
      return;
    }

    // Check connection type if available
    const connection = (navigator as any).connection;
    if (connection) {
      const updateConnectionQuality = () => {
        if (!navigator.onLine) {
          setConnectionQuality("offline");
        } else if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") {
          setConnectionQuality("slow");
        } else {
          setConnectionQuality("good");
        }
      };

      connection.addEventListener("change", updateConnectionQuality);
      updateConnectionQuality();

      return () => connection.removeEventListener("change", updateConnectionQuality);
    }
  }, []);

  return connectionQuality;
}
