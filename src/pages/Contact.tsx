import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { PageTransition } from "@/components/PageTransition";
import { ContactSalesDialog } from "@/components/ContactSalesDialog";
import logo from "@/assets/cribhub-logo.png";

const Contact = () => {
  const contactRef = useScrollAnimation();
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary via-secondary to-primary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent-foreground font-semibold text-sm mb-4 border border-accent/20">
              GET IN TOUCH
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
              Have questions? Our team is here to help you get started with Cribhub
            </p>
          </div>
        </section>

        {/* Contact Cards */}
        <section ref={contactRef} className="py-24 bg-background opacity-0 animate-fade-in-up">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl group">
                <CardContent className="pt-8 pb-8 px-6 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Phone className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Phone
                  </h3>
                  <a 
                    href="tel:+233504971614" 
                    className="text-muted-foreground hover:text-accent transition-colors text-lg font-medium"
                  >
                    +233 50 497 1614
                  </a>
                  <p className="text-sm text-muted-foreground mt-2">
                    24hr Phone Support
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl group">
                <CardContent className="pt-8 pb-8 px-6 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent-green to-accent-green/80 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Mail className="h-7 w-7 text-accent-green-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Email
                  </h3>
                  <a 
                    href="mailto:support@cribhub-gh.com" 
                    className="text-muted-foreground hover:text-accent transition-colors text-lg font-medium break-all"
                  >
                    support@cribhub-gh.com
                  </a>
                  <p className="text-sm text-muted-foreground mt-3">
                    24/7 Email Support
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl group">
                <CardContent className="pt-8 pb-8 px-6 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Location
                  </h3>
                  <p className="text-muted-foreground text-lg font-medium">
                    Ghana
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    Serving clients globally
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Card */}
            <div className="mt-12">
              <Card className="border-border/50 shadow-card bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-2xl">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Ready to get started?
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Schedule a personalized demo or speak with our sales team to learn how Cribhub can transform your property management operations.
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-glow hover:shadow-xl transition-all hover:-translate-y-0.5 group"
                    onClick={() => setSalesDialogOpen(true)}
                  >
                    Contact Sales Team
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Additional Contact Info */}
            <div className="mt-16">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <img 
                    src={logo} 
                    alt="Cribhub" 
                    className="h-20 w-auto drop-shadow-lg"
                  />
                </div>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  We're committed to providing exceptional support and helping you succeed with your property management needs.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                  <span>Response time: Within 24 hours</span>
                  <span className="hidden md:inline">•</span>
                  <span>Available in multiple languages</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ContactSalesDialog 
          open={salesDialogOpen} 
          onOpenChange={setSalesDialogOpen} 
        />
      </div>
    </PageTransition>
  );
};

export default Contact;
