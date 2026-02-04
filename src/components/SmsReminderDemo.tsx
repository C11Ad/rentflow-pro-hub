import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSmsReminder } from "@/hooks/useSmsReminder";
import { MessageSquare } from "lucide-react";

export const SmsReminderDemo = () => {
  const [phone, setPhone] = useState("");
  const [testType, setTestType] = useState<"payment" | "maintenance" | "lease">("payment");
  const [loading, setLoading] = useState(false);
  
  const { sendPaymentReminder, sendMaintenanceReminder, sendLeaseReminder } = useSmsReminder();

  const handleTestSms = async () => {
    if (!phone) {
      return;
    }

    setLoading(true);

    try {
      switch (testType) {
        case "payment":
          await sendPaymentReminder(phone, 2500, "January 1, 2025");
          break;
        case "maintenance":
          await sendMaintenanceReminder(phone, "January 5, 2025", "HVAC system inspection");
          break;
        case "lease":
          await sendLeaseReminder(phone, 30);
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          SMS Reminder Test
        </CardTitle>
        <CardDescription>
          Send test SMS reminders to your phone number
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (E.164 format)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Include country code (e.g., +1 for USA, +233 for Ghana)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reminder-type">Reminder Type</Label>
          <Select value={testType} onValueChange={(value: any) => setTestType(value)}>
            <SelectTrigger id="reminder-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="payment">Payment Reminder</SelectItem>
              <SelectItem value="maintenance">Maintenance Reminder</SelectItem>
              <SelectItem value="lease">Lease Renewal Reminder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleTestSms} 
          disabled={loading || !phone}
          className="w-full"
        >
          {loading ? "Sending..." : "Send Test SMS"}
        </Button>

        <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-1">Note:</p>
          <p>SMS reminders will be automatically sent for:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Payment due dates (3 days before)</li>
            <li>Scheduled maintenance appointments</li>
            <li>Lease expiration warnings (30 days before)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
