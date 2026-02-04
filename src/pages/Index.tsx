import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2, ArrowRight, TrendingUp, Search, Building2, UserCog, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ContactSalesDialog } from "@/components/ContactSalesDialog";
import { PageTransition } from "@/components/PageTransition";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import dashboardMockup from "@/assets/dashboard-mockup.png";
import logo from "@/assets/cribhub-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);

  // Redirect authenticated users to dashboard router (only if they have a role)
  useEffect(() => {
    if (!loading && user && userRole) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  // Don't show homepage to authenticated users
  if (loading || user) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navigation />
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,194,255,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(64,224,208,0.08),transparent_50%)]" />
          
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Value Proposition */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-primary-foreground">Trusted by 500+ Property Managers</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 leading-tight">
                  Effortless Property Management That Scales
                </h1>
                
                <p className="text-lg sm:text-xl text-primary-foreground/90 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 leading-relaxed">
                  Automate rent collection, streamline tenant communication, and gain real-time insights into your portfolio—all from one powerful platform built for landlords and property managers.
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 mb-8">
                  <Button 
                    size="lg" 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-glow hover:shadow-xl transition-all hover:-translate-y-0.5 group"
                    onClick={() => navigate("/search")}
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Find Property
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="border-2 border-primary-foreground/20 bg-primary-foreground/5 backdrop-blur text-primary-foreground hover:bg-primary-foreground hover:text-primary font-semibold px-8 py-6 text-lg rounded-xl transition-all hover:-translate-y-0.5"
                      >
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64" align="center">
                      <DropdownMenuLabel className="text-center text-muted-foreground">
                        Choose your role
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="flex items-center gap-3 p-3 cursor-pointer"
                        onClick={() => navigate("/auth?role=landlord")}
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">Sign up as Landlord</div>
                          <div className="text-xs text-muted-foreground">List & manage your properties</div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="flex items-center gap-3 p-3 cursor-pointer"
                        onClick={() => navigate("/auth?role=property_manager")}
                      >
                        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <UserCog className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <div className="font-semibold">Sign up as Property Manager</div>
                          <div className="text-xs text-muted-foreground">Manage properties for landlords</div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="flex items-center gap-3 p-3 cursor-pointer"
                        onClick={() => navigate("/auth")}
                      >
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-semibold">Sign up as Tenant</div>
                          <div className="text-xs text-muted-foreground">Find & rent properties</div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-primary-foreground/70 text-sm animate-in fade-in duration-1000 delay-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Product Screenshot */}
              <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-300">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-primary-foreground/10">
                  <img 
                    src={dashboardMockup}
                    alt="Cribhub dashboard showing real-time analytics, property listings, and tenant management"
                    className="w-full h-auto"
                    fetchPriority="high"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                </div>
                {/* Floating Badge */}
                <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-elegant p-4 border border-border/50 animate-in fade-in slide-in-from-left duration-1000 delay-700">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Revenue Growth</div>
                      <div className="text-xl font-bold text-foreground">+32% This Month</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-primary via-secondary to-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(0,194,255,0.15),transparent_50%)]" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Ready to Transform Your Property Management?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join hundreds of property managers who have streamlined their operations and increased revenue with Cribhub. Start your free 14-day trial today—no credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-10 py-6 text-lg rounded-xl shadow-glow hover:shadow-xl transition-all hover:-translate-y-0.5 group"
                onClick={() => navigate("/auth")}
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-primary-foreground/20 bg-primary-foreground/5 backdrop-blur text-primary-foreground hover:bg-primary-foreground hover:text-primary font-semibold px-10 py-6 text-lg rounded-xl transition-all hover:-translate-y-0.5"
                onClick={() => setSalesDialogOpen(true)}
              >
                Talk to Sales
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-primary-foreground/70 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>Setup in under 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>Free onboarding support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-border bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <img 
                  src={logo} 
                  alt="Cribhub" 
                  className="h-20 w-auto drop-shadow-lg"
                />
              </div>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Empowering property managers with intelligent automation and comprehensive analytics for streamlined operations and exceptional tenant experiences.
              </p>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Cribhub. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        <ContactSalesDialog 
          open={salesDialogOpen} 
          onOpenChange={setSalesDialogOpen} 
        />
      </div>
    </PageTransition>
  );
};

export default Index;
