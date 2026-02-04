import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { FileText, Download, Eye, Loader2, Sparkles, Calendar, MapPin, Printer, FileDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateBrandedDocument, generateBrandedPdf } from "@/lib/documentBranding";
import cribhubLogo from "@/assets/cribhub-logo.png";

interface Document {
  id: string;
  title: string;
  document_type: string;
  content: string;
  status: string;
  location: string;
  version: number;
  created_at: string;
  signed_at: string | null;
}

const LegalDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [documentType, setDocumentType] = useState("Lease Agreement");
  const [location, setLocation] = useState("Ghana");
  const [landlordName, setLandlordName] = useState("");
  const [landlordAddress, setLandlordAddress] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentDue, setPaymentDue] = useState("1st of each month");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [additionalTerms, setAdditionalTerms] = useState("");

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleGenerateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!landlordName || !tenantName || !propertyAddress || !rentAmount || !startDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-legal-document', {
        body: {
          documentType,
          location,
          parties: {
            landlordName,
            landlordAddress,
            tenantName,
            tenantAddress,
          },
          property: {
            address: propertyAddress,
            description: propertyDescription,
            rentAmount: parseFloat(rentAmount),
            currency,
          },
          terms: {
            startDate,
            endDate: endDate || undefined,
            paymentDue,
            securityDeposit: securityDeposit ? parseFloat(securityDeposit) : undefined,
            additionalTerms: additionalTerms || undefined,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Document Generated!",
        description: "Your legal document has been generated successfully",
      });

      // Refresh documents list
      await fetchDocuments();
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLandlordName("");
    setLandlordAddress("");
    setTenantName("");
    setTenantAddress("");
    setPropertyAddress("");
    setPropertyDescription("");
    setRentAmount("");
    setStartDate("");
    setEndDate("");
    setSecurityDeposit("");
    setAdditionalTerms("");
  };

  const handleDownload = async (document: Document, format: 'txt' | 'html' | 'pdf' = 'pdf') => {
    if (format === 'pdf') {
      // Generate professional PDF with CribHub branding
      try {
        const pdf = await generateBrandedPdf(
          document.title,
          document.content,
          document.document_type,
          document.location,
          document.id
        );
        pdf.save(`${document.title} - CribHub.pdf`);
      } catch (error) {
        console.error("PDF generation error:", error);
        toast({
          title: "PDF Generation Failed",
          description: "Falling back to HTML download",
          variant: "destructive",
        });
        // Fallback to HTML
        handleDownload(document, 'html');
        return;
      }
    } else if (format === 'html') {
      // Create a branded HTML document with CribHub logo
      const htmlContent = await generateBrandedDocument(
        document.title,
        document.content,
        document.id
      );
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.title} - CribHub.html`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Add CribHub branding to text file
      const brandedContent = `
═══════════════════════════════════════════════════════════════
                         CRIBHUB
              Property Management Platform
═══════════════════════════════════════════════════════════════

${document.title.toUpperCase()}

Document Type: ${document.document_type.replace(/_/g, ' ')}
Location: ${document.location}
Document ID: ${document.id}
Generated: ${new Date(document.created_at).toLocaleDateString()}

═══════════════════════════════════════════════════════════════

${document.content}

═══════════════════════════════════════════════════════════════
This document was generated through CribHub Property Management
www.cribhub.com | support@cribhub.com
═══════════════════════════════════════════════════════════════
`;
      const blob = new Blob([brandedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.title} - CribHub.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    toast({
      title: "Document Downloaded",
      description: `${document.title} has been downloaded as ${format.toUpperCase()}`,
    });
  };

  const handlePrint = async (document: Document) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const brandedHtml = await generateBrandedDocument(
        document.title,
        document.content,
        document.id
      );
      printWindow.document.write(brandedHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handlePreview = (document: Document) => {
    setSelectedDocument(document);
    setShowPreview(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Legal Documents Portal
          </h1>
          <p className="text-muted-foreground text-lg">
            Generate location-aware legal documents powered by AI
          </p>
        </div>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="generate">Generate Document</TabsTrigger>
            <TabsTrigger value="library">Document Library</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Powered Document Generation
                </CardTitle>
                <CardDescription>
                  Fill in the details below and our AI will generate a legally compliant document for your location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateDocument} className="space-y-6">
                  {/* Document Type & Location */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="documentType">Document Type *</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lease Agreement">Lease Agreement</SelectItem>
                          <SelectItem value="Renewal Notice">Renewal Notice</SelectItem>
                          <SelectItem value="Termination Notice">Termination Notice</SelectItem>
                          <SelectItem value="Eviction Notice">Eviction Notice</SelectItem>
                          <SelectItem value="Rent Increase Notice">Rent Increase Notice</SelectItem>
                          <SelectItem value="Maintenance Notice">Maintenance Notice</SelectItem>
                          <SelectItem value="Custom Agreement">Custom Agreement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Country/Jurisdiction *
                      </Label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ghana">Ghana</SelectItem>
                          <SelectItem value="Nigeria">Nigeria</SelectItem>
                          <SelectItem value="Kenya">Kenya</SelectItem>
                          <SelectItem value="South Africa">South Africa</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
                          <SelectItem value="Tanzania">Tanzania</SelectItem>
                          <SelectItem value="Uganda">Uganda</SelectItem>
                          <SelectItem value="Rwanda">Rwanda</SelectItem>
                          <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                          <SelectItem value="Egypt">Egypt</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        The agreement will be generated according to the tenancy laws of this country
                      </p>
                    </div>
                  </div>

                  {/* Parties Information */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">Parties Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="landlordName">Landlord Name *</Label>
                        <Input
                          id="landlordName"
                          value={landlordName}
                          onChange={(e) => setLandlordName(e.target.value)}
                          placeholder="Full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="landlordAddress">Landlord Address</Label>
                        <Input
                          id="landlordAddress"
                          value={landlordAddress}
                          onChange={(e) => setLandlordAddress(e.target.value)}
                          placeholder="Full address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tenantName">Tenant Name *</Label>
                        <Input
                          id="tenantName"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          placeholder="Full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tenantAddress">Tenant Address</Label>
                        <Input
                          id="tenantAddress"
                          value={tenantAddress}
                          onChange={(e) => setTenantAddress(e.target.value)}
                          placeholder="Full address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Property Information */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">Property Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="propertyAddress">Property Address *</Label>
                      <Input
                        id="propertyAddress"
                        value={propertyAddress}
                        onChange={(e) => setPropertyAddress(e.target.value)}
                        placeholder="Full property address"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyDescription">Property Description</Label>
                      <Textarea
                        id="propertyDescription"
                        value={propertyDescription}
                        onChange={(e) => setPropertyDescription(e.target.value)}
                        placeholder="e.g., 2-bedroom apartment, ground floor..."
                        rows={3}
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GHS">GHS (₵) - Ghana Cedis</SelectItem>
                            <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                            <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                            <SelectItem value="NGN">NGN (₦) - Nigerian Naira</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rentAmount">Monthly Rent *</Label>
                        <Input
                          id="rentAmount"
                          type="number"
                          value={rentAmount}
                          onChange={(e) => setRentAmount(e.target.value)}
                          placeholder="Amount"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="securityDeposit">Security Deposit</Label>
                        <Input
                          id="securityDeposit"
                          type="number"
                          value={securityDeposit}
                          onChange={(e) => setSecurityDeposit(e.target.value)}
                          placeholder="Amount"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">Lease Terms</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Start Date *
                        </Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentDue">Payment Due Date</Label>
                        <Input
                          id="paymentDue"
                          value={paymentDue}
                          onChange={(e) => setPaymentDue(e.target.value)}
                          placeholder="e.g., 1st of each month"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="additionalTerms">Additional Terms & Conditions</Label>
                      <Textarea
                        id="additionalTerms"
                        value={additionalTerms}
                        onChange={(e) => setAdditionalTerms(e.target.value)}
                        placeholder="Any additional clauses, restrictions, or special terms..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Generating Document...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Legal Document
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle>Your Documents</CardTitle>
                <CardDescription>
                  View, download, and manage your generated legal documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No documents generated yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="border-border">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{doc.title}</h3>
                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-2">
                                <span className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  {doc.document_type.replace(/_/g, ' ')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {doc.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex gap-2 text-xs">
                                <span className={`px-2 py-1 rounded-full ${
                                  doc.status === 'signed' ? 'bg-green-100 text-green-800' :
                                  doc.status === 'generated' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {doc.status}
                                </span>
                                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                  v{doc.version}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePreview(doc)}
                                title="View Document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrint(doc)}
                                title="Print Document"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" title="Download">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleDownload(doc, 'pdf')}>
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Download as PDF (Recommended)
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownload(doc, 'html')}>
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Download as HTML
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownload(doc, 'txt')}>
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Download as TXT
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <img src={cribhubLogo} alt="CribHub" className="h-8" />
              <DialogTitle>{selectedDocument?.title}</DialogTitle>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                {selectedDocument?.document_type.replace(/_/g, ' ')}
              </span>
              <span>•</span>
              <span>{selectedDocument?.location}</span>
              <span>•</span>
              <span>v{selectedDocument?.version}</span>
            </div>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg border-l-4 border-primary">
            {selectedDocument?.content}
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center text-xs text-muted-foreground mt-4">
            <p className="font-semibold text-primary">CribHub Property Management</p>
            <p>Document ID: {selectedDocument?.id}</p>
            <p>Generated: {selectedDocument && new Date(selectedDocument.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            {selectedDocument && (
              <>
                <Button variant="outline" onClick={() => handlePrint(selectedDocument)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDownload(selectedDocument, 'pdf')}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download as PDF (Recommended)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(selectedDocument, 'html')}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download as HTML
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(selectedDocument, 'txt')}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download as TXT
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LegalDocuments;