import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MaintenanceRequest {
  id: string;
  unit_id: string;
  tenant_id: string;
  assigned_to: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  images: string[] | null;
  estimated_completion: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Additional data
  unit_number?: string;
  property_name?: string;
  property_id?: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
}

interface UseMaintenanceRequestsOptions {
  role: "tenant" | "landlord" | "manager";
  userId?: string;
  propertyFilter?: string | null;
}

export const useMaintenanceRequests = ({ role, userId, propertyFilter }: UseMaintenanceRequestsOptions) => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      if (role === "tenant") {
        // Tenant: fetch their own requests with unit info
        const { data, error } = await supabase
          .from("maintenance_requests")
          .select(`
            *,
            unit:units(unit_number, property_id, property:properties(id, name))
          `)
          .eq("tenant_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mappedData: MaintenanceRequest[] = (data || []).map((item: any) => ({
          ...item,
          unit_number: item.unit?.unit_number,
          property_name: item.unit?.property?.name,
          property_id: item.unit?.property?.id
        }));

        setRequests(mappedData);
      } else if (role === "landlord") {
        // Get landlord's properties
        const { data: properties } = await supabase
          .from("properties")
          .select("id")
          .eq("landlord_id", userId);

        const propertyIds = properties?.map(p => p.id) || [];

        if (propertyIds.length === 0) {
          setRequests([]);
          setLoading(false);
          return;
        }

        // Get units for those properties (with optional filter)
        const { data: units } = await supabase
          .from("units")
          .select("id, unit_number, property_id")
          .in("property_id", propertyFilter ? [propertyFilter] : propertyIds);

        const unitIds = units?.map(u => u.id) || [];

        if (unitIds.length === 0) {
          setRequests([]);
          setLoading(false);
          return;
        }

        // Get maintenance requests for those units
        const { data: requestsData, error: requestsError } = await supabase
          .from("maintenance_requests")
          .select("*")
          .in("unit_id", unitIds)
          .order("created_at", { ascending: false });

        if (requestsError) throw requestsError;

        // Get properties for names
        const { data: propertiesData } = await supabase
          .from("properties")
          .select("id, name")
          .in("id", propertyFilter ? [propertyFilter] : propertyIds);

        // Get tenant profiles
        const tenantIds = [...new Set((requestsData || []).map(r => r.tenant_id))];
        const { data: tenantProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", tenantIds);

        // Map everything together
        const mappedData: MaintenanceRequest[] = (requestsData || []).map((item) => {
          const unit = units?.find(u => u.id === item.unit_id);
          const property = propertiesData?.find(p => p.id === unit?.property_id);
          const tenant = tenantProfiles?.find(t => t.id === item.tenant_id);

          return {
            ...item,
            unit_number: unit?.unit_number,
            property_name: property?.name,
            property_id: unit?.property_id,
            tenant_name: tenant?.full_name || "Unknown Tenant",
            tenant_email: tenant?.email,
            tenant_phone: tenant?.phone
          };
        });

        setRequests(mappedData);
      }
    } catch (error: any) {
      console.error("Failed to fetch maintenance requests:", error);
      toast.error("Failed to load maintenance requests");
    } finally {
      setLoading(false);
    }
  }, [userId, role, propertyFilter]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    fetchRequests();

    const channel = supabase
      .channel("maintenance-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "maintenance_requests"
        },
        (payload) => {
          console.log("Maintenance request change:", payload);
          // Refetch to get complete data with joins
          fetchRequests();

          if (payload.eventType === "INSERT") {
            if (role === "landlord") {
              toast.info("New maintenance request received from tenant");
            }
          } else if (payload.eventType === "UPDATE") {
            if (role === "tenant") {
              toast.info("Your maintenance request has been updated");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchRequests, role]);

  // Submit new request (tenant)
  const submitRequest = async (data: {
    unit_id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    images?: string[];
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };

    try {
      const { error } = await supabase.from("maintenance_requests").insert({
        ...data,
        tenant_id: userId,
        status: "pending"
      });

      if (error) throw error;

      // Ensure UI updates even if realtime is not enabled/available
      await fetchRequests();

      toast.success("Maintenance request submitted successfully");
      return { success: true };
    } catch (error: any) {
      console.error("Failed to submit request:", error);
      toast.error("Failed to submit maintenance request");
      return { success: false, error: error.message };
    }
  };

  // Update request status (landlord/manager)
  const updateRequestStatus = async (
    requestId: string,
    status: string,
    additionalData?: {
      estimated_completion?: string;
      assigned_to?: string;
    }
  ) => {
    try {
      const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() };

      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      if (additionalData?.estimated_completion) {
        updateData.estimated_completion = additionalData.estimated_completion;
      }

      if (additionalData?.assigned_to) {
        updateData.assigned_to = additionalData.assigned_to;
      }

      const { error } = await supabase
        .from("maintenance_requests")
        .update(updateData)
        .eq("id", requestId);

      if (error) throw error;

      // Update local state so completed requests immediately move to History
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? ({ ...r, ...updateData } as MaintenanceRequest) : r))
      );

      toast.success(`Request marked as ${status}`);
      return { success: true };
    } catch (error: any) {
      console.error("Failed to update request:", error);
      toast.error("Failed to update request status");
      return { success: false, error: error.message };
    }
  };

  // Update maintenance request details (landlord - for manual entries only)
  const updateRequest = async (
    requestId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      priority?: string;
    }
  ) => {
    try {
      const updateData = { ...data, updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from("maintenance_requests")
        .update(updateData)
        .eq("id", requestId);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? ({ ...r, ...updateData } as MaintenanceRequest) : r))
      );

      toast.success("Maintenance request updated successfully");
      return { success: true };
    } catch (error: any) {
      console.error("Failed to update request:", error);
      toast.error("Failed to update maintenance request");
      return { success: false, error: error.message };
    }
  };

  // Delete maintenance request (landlord - for manual/invalid entries only)
  const deleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("maintenance_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      setRequests((prev) => prev.filter((r) => r.id !== requestId));

      toast.success("Maintenance request deleted successfully");
      return { success: true };
    } catch (error: any) {
      console.error("Failed to delete request:", error);
      toast.error("Failed to delete maintenance request");
      return { success: false, error: error.message };
    }
  };

  return {
    requests,
    loading,
    refetch: fetchRequests,
    submitRequest,
    updateRequestStatus,
    updateRequest,
    deleteRequest
  };
};
