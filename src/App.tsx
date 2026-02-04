import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { IdleLogoutWarning } from "@/components/IdleLogoutWarning";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/PageLoader";
import { AuthUrlHandler } from "@/components/AuthUrlHandler";

// Eagerly load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load other pages for faster initial load
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const LandlordDashboard = lazy(() => import("./pages/LandlordDashboard"));
const TenantPortal = lazy(() => import("./pages/TenantPortal"));
const LegalDocuments = lazy(() => import("./pages/LegalDocuments"));
const Contracts = lazy(() => import("./pages/Contracts"));
const VerificationManagement = lazy(() => import("./pages/VerificationManagement"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDetails = lazy(() => import("./pages/PropertyDetails"));
const BrowseUnits = lazy(() => import("./pages/BrowseUnits"));
const ApplyForUnit = lazy(() => import("./pages/ApplyForUnit"));
const RentalApplications = lazy(() => import("./pages/RentalApplications"));
const PropertySearch = lazy(() => import("./pages/PropertySearch"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure React Query with enhanced defaults for reliability
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute - increased for smoother UX
      gcTime: 10 * 60 * 1000, // 10 minutes cache
      retry: 2,
      refetchOnWindowFocus: false, // Disable to reduce flicker
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthUrlHandler />
          <AuthProvider>
            <CurrencyProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/search" element={<PropertySearch />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/manager-dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={["property_manager", "admin"]}>
                        <ManagerDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/landlord-dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={["landlord", "admin"]}>
                        <LandlordDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/tenant-portal" 
                    element={
                      <ProtectedRoute allowedRoles={["tenant"]}>
                        <TenantPortal />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/legal-documents" 
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <LegalDocuments />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/contracts" 
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <Contracts />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/verification-management" 
                    element={
                      <ProtectedRoute allowedRoles={["admin", "landlord"]}>
                        <VerificationManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/properties" 
                    element={
                      <ProtectedRoute allowedRoles={["landlord", "admin"]}>
                        <Properties />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/properties/:propertyId" 
                    element={
                      <ProtectedRoute allowedRoles={["landlord", "admin"]}>
                        <PropertyDetails />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/browse-units" 
                    element={
                      <ProtectedRoute allowedRoles={["tenant", "admin"]}>
                        <BrowseUnits />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/apply/:unitId" 
                    element={
                      <ProtectedRoute allowedRoles={["tenant", "admin"]}>
                        <ApplyForUnit />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/rental-applications" 
                    element={
                      <ProtectedRoute allowedRoles={["landlord", "admin"]}>
                        <RentalApplications />
                      </ProtectedRoute>
                    } 
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <IdleLogoutWarning />
            </CurrencyProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;