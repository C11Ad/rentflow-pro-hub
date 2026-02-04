import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendSmsParams {
  to: string;
  message: string;
  reminderType?: "payment" | "maintenance" | "lease" | "general";
}

export const useSmsReminder = () => {
  const sendSmsReminder = async ({ to, message, reminderType = "general" }: SendSmsParams) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-sms-reminder", {
        body: {
          to,
          message,
          reminderType,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("SMS reminder sent successfully");
        return { success: true, data };
      } else {
        throw new Error(data?.error || "Failed to send SMS");
      }
    } catch (error: any) {
      console.error("Error sending SMS reminder:", error);
      toast.error(error.message || "Failed to send SMS reminder");
      return { success: false, error: error.message };
    }
  };

  // Pre-configured reminder templates
  const sendPaymentReminder = async (phone: string, amount: number, dueDate: string) => {
    const message = `Rent Payment Reminder: Your payment of $${amount} is due on ${dueDate}. Please ensure timely payment to avoid late fees. - Cribhub`;
    return sendSmsReminder({ to: phone, message, reminderType: "payment" });
  };

  const sendMaintenanceReminder = async (phone: string, date: string, description: string) => {
    const message = `Maintenance Reminder: Scheduled maintenance for "${description}" on ${date}. Our team will contact you shortly. - Cribhub`;
    return sendSmsReminder({ to: phone, message, reminderType: "maintenance" });
  };

  const sendLeaseReminder = async (phone: string, daysLeft: number) => {
    const message = `Lease Renewal Reminder: Your lease expires in ${daysLeft} days. Please contact us to discuss renewal options. - Cribhub`;
    return sendSmsReminder({ to: phone, message, reminderType: "lease" });
  };

  return {
    sendSmsReminder,
    sendPaymentReminder,
    sendMaintenanceReminder,
    sendLeaseReminder,
  };
};
