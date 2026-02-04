import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ScanLine, Camera, Upload, CheckCircle, X, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface NationalIdUploadProps {
  onIdUploaded: (url: string) => void;
  currentIdUrl?: string;
  onRemove?: () => void;
  label?: string;
}

export function NationalIdUpload({ 
  onIdUploaded, 
  currentIdUrl, 
  onRemove,
  label = "National ID (Ghana Card)"
}: NationalIdUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentIdUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      // Create a preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `id-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `national-ids/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("verification-documents")
        .getPublicUrl(filePath);

      onIdUploaded(publicUrl);
      toast.success("ID uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload ID. Please try again.");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onRemove?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary" className="text-xs">Required</Badge>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />

      {previewUrl ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative">
            <img
              src={previewUrl}
              alt="National ID"
              className="w-full h-40 object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Badge className="bg-accent-green text-accent-green-foreground gap-1">
                <CheckCircle className="h-3 w-3" />
                Uploaded
              </Badge>
              <Button
                size="icon"
                variant="destructive"
                className="h-7 w-7"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card 
          className="border-dashed border-2 cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              {uploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-3 rounded-full bg-primary/10">
                        <ScanLine className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">Scan</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Camera className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">Camera</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tap to scan or upload your Ghana Card</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clear photo of the front side • Max 5MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
