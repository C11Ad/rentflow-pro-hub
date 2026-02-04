import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { VirtualViewingDialog } from "@/components/VirtualViewingDialog";
import { PropertyHighlights } from "@/components/PropertyHighlights";
import { MortgageCalculatorDialog, MortgageBadge } from "@/components/MortgageCalculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Building2,
  Banknote,
  Search,
  Video,
  Home,
  ArrowLeft,
  Filter,
  X,
  Camera,
  Sparkles,
  Calculator,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropertyListing {
  id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  rent_amount: number;
  rent_currency: string;
  listing_type: string;
  sale_price: number | null;
  images: string[] | null;
  mortgage_eligible: boolean | null;
  mortgage_partner: string | null;
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string | null;
    country: string;
    images: string[] | null;
    property_type: string;
    description: string | null;
    amenities: string[] | null;
  };
}

const ghanaRegions = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Northern",
  "Volta",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
  "Oti",
  "Western North",
];

export default function PropertySearch() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDialogOpen, setViewingDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<PropertyListing | null>(null);
  const { toast } = useToast();

  // Filter states
  const [listingType, setListingType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [bedroomFilter, setBedroomFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, listingType, searchQuery, selectedRegion, bedroomFilter, priceRange]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("units")
        .select(`
          id,
          unit_number,
          bedrooms,
          bathrooms,
          square_feet,
          rent_amount,
          rent_currency,
          listing_type,
          sale_price,
          images,
          mortgage_eligible,
          mortgage_partner,
          property:properties (
            id,
            name,
            address,
            city,
            state,
            country,
            images,
            property_type,
            description,
            amenities
          )
        `)
        .eq("status", "vacant");

      if (error) throw error;
      setListings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    // Filter by listing type
    if (listingType !== "all") {
      filtered = filtered.filter((l) => l.listing_type === listingType);
    }

    // Filter by search query (property name, city, address)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.property.name.toLowerCase().includes(query) ||
          l.property.city.toLowerCase().includes(query) ||
          l.property.address.toLowerCase().includes(query)
      );
    }

    // Filter by region
    if (selectedRegion !== "all") {
      filtered = filtered.filter(
        (l) =>
          l.property.state?.toLowerCase() === selectedRegion.toLowerCase() ||
          l.property.city.toLowerCase().includes(selectedRegion.toLowerCase())
      );
    }

    // Filter by bedrooms
    if (bedroomFilter !== "all") {
      const bedrooms = parseInt(bedroomFilter);
      if (bedroomFilter === "4+") {
        filtered = filtered.filter((l) => l.bedrooms >= 4);
      } else {
        filtered = filtered.filter((l) => l.bedrooms === bedrooms);
      }
    }

    // Filter by price range - different ranges for rent vs sale
    if (priceRange !== "all") {
      filtered = filtered.filter((l) => {
        const price = l.listing_type === "sale" ? (l.sale_price || 0) : l.rent_amount;
        const isSale = l.listing_type === "sale";
        
        if (isSale) {
          // Sale price ranges (in GHS)
          switch (priceRange) {
            case "sale-0-500k":
              return price <= 500000;
            case "sale-500k-1m":
              return price > 500000 && price <= 1000000;
            case "sale-1m-2.5m":
              return price > 1000000 && price <= 2500000;
            case "sale-2.5m-5m":
              return price > 2500000 && price <= 5000000;
            case "sale-5m+":
              return price > 5000000;
            default:
              return true;
          }
        } else {
          // Rent price ranges (monthly in GHS)
          switch (priceRange) {
            case "rent-0-1000":
              return price <= 1000;
            case "rent-1000-2500":
              return price > 1000 && price <= 2500;
            case "rent-2500-5000":
              return price > 2500 && price <= 5000;
            case "rent-5000-10000":
              return price > 5000 && price <= 10000;
            case "rent-10000+":
              return price > 10000;
            default:
              return true;
          }
        }
      });
    }

    setFilteredListings(filtered);
  };

  const clearFilters = () => {
    setListingType("all");
    setSearchQuery("");
    setSelectedRegion("all");
    setBedroomFilter("all");
    setPriceRange("all");
  };

  const hasActiveFilters =
    listingType !== "all" ||
    searchQuery !== "" ||
    selectedRegion !== "all" ||
    bedroomFilter !== "all" ||
    priceRange !== "all";

  const handleScheduleViewing = (listing: PropertyListing) => {
    setSelectedListing(listing);
    setViewingDialogOpen(true);
  };

  const getListingImage = (listing: PropertyListing) => {
    if (listing.images && listing.images.length > 0) {
      return listing.images[0];
    }
    if (listing.property.images && listing.property.images.length > 0) {
      return listing.property.images[0];
    }
    return null;
  };

  const formatPrice = (listing: PropertyListing) => {
    const price = listing.listing_type === "sale" ? (listing.sale_price || listing.rent_amount) : listing.rent_amount;
    return price.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Return to Home Button */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Home
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Find Your Perfect Property in <span className="text-primary">Ghana</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Browse apartments for rent or sale. Schedule a virtual viewing from anywhere.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl shadow-lg p-4 md:p-6 border">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by location, property name..."
                    className="pl-10 h-12"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Listing Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={listingType === "all" ? "default" : "outline"}
                    onClick={() => setListingType("all")}
                    className="h-12"
                  >
                    All
                  </Button>
                  <Button
                    variant={listingType === "rental" ? "default" : "outline"}
                    onClick={() => setListingType("rental")}
                    className="h-12"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Rent
                  </Button>
                  <Button
                    variant={listingType === "sale" ? "default" : "outline"}
                    onClick={() => setListingType("sale")}
                    className="h-12"
                  >
                    <Banknote className="mr-2 h-4 w-4" />
                    Buy
                  </Button>
                </div>
              </div>

              {/* Additional Filters */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {ghanaRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={bedroomFilter} onValueChange={setBedroomFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Bedrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Beds</SelectItem>
                    <SelectItem value="1">1 Bedroom</SelectItem>
                    <SelectItem value="2">2 Bedrooms</SelectItem>
                    <SelectItem value="3">3 Bedrooms</SelectItem>
                    <SelectItem value="4+">4+ Bedrooms</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Price</SelectItem>
                    {listingType === "sale" ? (
                      <>
                        <SelectItem value="sale-0-500k">Up to GHS 500,000</SelectItem>
                        <SelectItem value="sale-500k-1m">GHS 500K - 1M</SelectItem>
                        <SelectItem value="sale-1m-2.5m">GHS 1M - 2.5M</SelectItem>
                        <SelectItem value="sale-2.5m-5m">GHS 2.5M - 5M</SelectItem>
                        <SelectItem value="sale-5m+">GHS 5M+</SelectItem>
                      </>
                    ) : listingType === "rental" ? (
                      <>
                        <SelectItem value="rent-0-1000">Up to GHS 1,000/mo</SelectItem>
                        <SelectItem value="rent-1000-2500">GHS 1,000 - 2,500/mo</SelectItem>
                        <SelectItem value="rent-2500-5000">GHS 2,500 - 5,000/mo</SelectItem>
                        <SelectItem value="rent-5000-10000">GHS 5,000 - 10,000/mo</SelectItem>
                        <SelectItem value="rent-10000+">GHS 10,000+/mo</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="rent-0-1000">Rent: Up to GHS 1,000/mo</SelectItem>
                        <SelectItem value="rent-1000-2500">Rent: GHS 1K - 2.5K/mo</SelectItem>
                        <SelectItem value="rent-5000-10000">Rent: GHS 5K - 10K/mo</SelectItem>
                        <SelectItem value="sale-0-500k">Sale: Up to GHS 500K</SelectItem>
                        <SelectItem value="sale-500k-1m">Sale: GHS 500K - 1M</SelectItem>
                        <SelectItem value="sale-1m-2.5m">Sale: GHS 1M - 2.5M</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Available Properties</h2>
            <p className="text-muted-foreground">
              {filteredListings.length} {filteredListings.length === 1 ? "property" : "properties"} found
            </p>
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search criteria
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => {
              const image = getListingImage(listing);
              return (
                <Card key={listing.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden relative bg-muted">
                    {image ? (
                      <img
                        src={image}
                        alt={listing.property.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <Badge className={listing.listing_type === "sale" ? "bg-accent-green text-accent-green-foreground" : "bg-primary"}>
                        {listing.listing_type === "sale" ? "For Sale" : "For Rent"}
                      </Badge>
                      {listing.listing_type === "sale" && listing.mortgage_eligible && (
                        <MortgageBadge eligible={true} />
                      )}
                    </div>

                    {/* Image count */}
                    {listing.images && listing.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        {listing.images.length}
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg line-clamp-1">{listing.property.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {listing.property.city}, {listing.property.state || listing.property.country}
                          </span>
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        Unit {listing.unit_number}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {/* Features */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          {listing.bedrooms} Bed
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          {listing.bathrooms} Bath
                        </span>
                        {listing.square_feet && (
                          <span className="flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            {listing.square_feet} ft²
                          </span>
                        )}
                      </div>

                      {/* Amenities Preview */}
                      {listing.property.amenities && listing.property.amenities.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <PropertyHighlights 
                            amenities={listing.property.amenities.slice(0, 3)} 
                            className="inline-flex"
                          />
                          {listing.property.amenities.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{listing.property.amenities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Price & CTA */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-primary">
                              {listing.rent_currency} {formatPrice(listing)}
                            </span>
                            {listing.listing_type !== "sale" && (
                              <span className="text-muted-foreground text-sm">/mo</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {listing.listing_type === "sale" && listing.mortgage_eligible && (
                            <MortgageCalculatorDialog 
                              propertyPrice={listing.sale_price || listing.rent_amount}
                              currency={listing.rent_currency}
                              propertyName={`${listing.property.name} - Unit ${listing.unit_number}`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                              >
                                <Calculator className="h-4 w-4" />
                                Mortgage
                              </Button>
                            </MortgageCalculatorDialog>
                          )}
                          <Button
                            onClick={() => handleScheduleViewing(listing)}
                            className="gap-2"
                            size="sm"
                          >
                            <Video className="h-4 w-4" />
                            Virtual Tour
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Virtual Viewing Dialog */}
      {selectedListing && (
        <VirtualViewingDialog
          open={viewingDialogOpen}
          onOpenChange={setViewingDialogOpen}
          propertyId={selectedListing.property.id}
          unitId={selectedListing.id}
          propertyName={`${selectedListing.property.name} - Unit ${selectedListing.unit_number}`}
          listingType={selectedListing.listing_type as "rental" | "sale"}
        />
      )}
    </div>
  );
}
