import { Badge } from "@/components/ui/badge";
import { 
  Wifi, 
  Car, 
  Shield, 
  Droplets, 
  Zap, 
  TreeDeciduous, 
  Building, 
  UtensilsCrossed,
  Waves,
  Lock,
  Dumbbell,
  Baby
} from "lucide-react";

interface PropertyHighlightsProps {
  amenities?: string[];
  className?: string;
}

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  parking: Car,
  security: Shield,
  water: Droplets,
  electricity: Zap,
  garden: TreeDeciduous,
  elevator: Building,
  kitchen: UtensilsCrossed,
  pool: Waves,
  gated: Lock,
  gym: Dumbbell,
  playground: Baby,
};

const amenityLabels: Record<string, string> = {
  wifi: "Free WiFi",
  parking: "Parking",
  security: "24/7 Security",
  water: "Running Water",
  electricity: "Steady Power",
  garden: "Garden",
  elevator: "Elevator",
  kitchen: "Fitted Kitchen",
  pool: "Swimming Pool",
  gated: "Gated Community",
  gym: "Gym",
  playground: "Kids Playground",
};

export const AVAILABLE_AMENITIES = Object.keys(amenityLabels);

export function PropertyHighlights({ amenities = [], className }: PropertyHighlightsProps) {
  if (amenities.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {amenities.map((amenity) => {
          const key = amenity.toLowerCase();
          const Icon = amenityIcons[key];
          const label = amenityLabels[key] || amenity;

          return (
            <Badge key={amenity} variant="outline" className="gap-1.5 py-1.5 px-2.5">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

interface AmenitySelectorProps {
  selected: string[];
  onChange: (amenities: string[]) => void;
}

export function AmenitySelector({ selected, onChange }: AmenitySelectorProps) {
  const toggleAmenity = (amenity: string) => {
    if (selected.includes(amenity)) {
      onChange(selected.filter((a) => a !== amenity));
    } else {
      onChange([...selected, amenity]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Property Amenities</p>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_AMENITIES.map((amenity) => {
          const Icon = amenityIcons[amenity];
          const label = amenityLabels[amenity];
          const isSelected = selected.includes(amenity);

          return (
            <Badge
              key={amenity}
              variant={isSelected ? "default" : "outline"}
              className={`cursor-pointer gap-1.5 py-1.5 px-2.5 transition-colors ${
                isSelected ? "" : "hover:bg-accent"
              }`}
              onClick={() => toggleAmenity(amenity)}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
            </Badge>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Select amenities that apply to attract more interest
      </p>
    </div>
  );
}
