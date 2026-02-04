import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Ensures password-recovery links land on /reset-password even if the backend
 * redirects to "/" (some providers ignore custom redirectTo URLs).
 */
export function AuthUrlHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const isRecoveryHash = hashParams.get("type") === "recovery";

    const searchParams = new URLSearchParams(location.search);
    const isRecoveryCode = searchParams.get("type") === "recovery" && !!searchParams.get("code");

    if ((isRecoveryHash || isRecoveryCode) && location.pathname !== "/reset-password") {
      navigate(
        {
          pathname: "/reset-password",
          search: location.search,
          hash,
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, navigate]);

  return null;
}
