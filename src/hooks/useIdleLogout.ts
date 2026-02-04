import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface UseIdleLogoutOptions {
  onWarning: () => void;
  onLogout: () => void;
}

export const useIdleLogout = ({ onWarning, onLogout }: UseIdleLogoutOptions) => {
  const { userRole } = useAuth();
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Determine timeout based on role (in milliseconds)
  const getIdleTimeout = useCallback(() => {
    if (userRole === "admin" || userRole === "property_manager") {
      return 9 * 60 * 1000; // 9 minutes (warning at 9 min, logout at 10 min)
    }
    return 14 * 60 * 1000; // 14 minutes (warning at 14 min, logout at 15 min)
  }, [userRole]);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    setSecondsRemaining(60);
    countdownRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const showWarning = useCallback(() => {
    setIsWarningVisible(true);
    startCountdown();
    onWarning();
    
    // Set timer for final logout after 60 seconds
    warningTimerRef.current = setTimeout(() => {
      setIsWarningVisible(false);
      onLogout();
    }, 60 * 1000);
  }, [onWarning, onLogout, startCountdown]);

  const resetIdleTimer = useCallback(() => {
    if (isWarningVisible) return; // Don't reset if warning is showing
    
    clearAllTimers();
    
    const timeout = getIdleTimeout();
    idleTimerRef.current = setTimeout(showWarning, timeout);
  }, [clearAllTimers, getIdleTimeout, showWarning, isWarningVisible]);

  const stayLoggedIn = useCallback(() => {
    clearAllTimers();
    setIsWarningVisible(false);
    setSecondsRemaining(60);
    resetIdleTimer();
  }, [clearAllTimers, resetIdleTimer]);

  const logoutNow = useCallback(() => {
    clearAllTimers();
    setIsWarningVisible(false);
    onLogout();
  }, [clearAllTimers, onLogout]);

  useEffect(() => {
    if (!userRole) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    
    const handleActivity = () => {
      resetIdleTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetIdleTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [userRole, resetIdleTimer, clearAllTimers]);

  return {
    isWarningVisible,
    secondsRemaining,
    stayLoggedIn,
    logoutNow,
  };
};
