import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon, Building, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UnitImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  propertyId: string;
  unitNumber: string;
  minImages?: number;
  maxImages?: number;
}

const UnitImageUpload = ({
  images,
  onImagesChange,
  propertyId,
  unitNumber,
  minImages = 5,
  maxImages = 10
}: UnitImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} exceeds 5MB limit`);
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${propertyId}/${unitNumber}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("unit-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("unit-images")
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload images");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];
    
    // Extract path from URL for deletion
    try {
      const urlPath = new URL(imageUrl).pathname;
      const storagePath = urlPath.split("/unit-images/")[1];
      
      if (storagePath) {
        await supabase.storage.from("unit-images").remove([storagePath]);
      }
    } catch (error) {
      console.error("Error removing from storage:", error);
    }

    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const remainingRequired = Math.max(0, minImages - images.length);
  const isValid = images.length >= minImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Unit Photos *
        </Label>
        <span className={`text-sm ${isValid ? "text-green-600" : "text-amber-600"}`}>
          {images.length}/{minImages} required ({maxImages} max)
        </span>
      </div>

      {/* Requirements info */}
      <div className="bg-muted/50 rounded-lg p-3 text-sm">
        <p className="font-medium mb-2">Required: {minImages} photos minimum</p>
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Exterior views</span>
          </div>
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span>Interior rooms</span>
          </div>
        </div>
      </div>

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square group">
              <img
                src={url}
                alt={`Unit photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {index < 2 ? "Exterior" : "Interior"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="unit-images"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {images.length === 0 ? "Upload Photos" : "Add More Photos"}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Validation message */}
      {!isValid && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <span className="font-medium">
            {remainingRequired} more {remainingRequired === 1 ? "photo" : "photos"} required
          </span>
          (exterior + interior views)
        </p>
      )}
    </div>
  );
};

export default UnitImageUpload;
