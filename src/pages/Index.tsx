import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BarChart3, FileText, Shield, TrendingUp, Users, Zap, CheckCircle2, ArrowRight, Star, Quote, Phone, Mail, MapPin, Search, Building2, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ContactSalesDialog } from "@/components/ContactSalesDialog";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
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
  const featuresRef = useScrollAnimation();
  const metricsRef = useScrollAnimation();
  const testimonialsRef = useScrollAnimation();
  const aboutRef = useScrollAnimation();
  const contactRef = useScrollAnimation();

  // Redirect authenticated users to dashboard router (only if they have a role)
  // If they don't have a role, let Dashboard component handle it
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

      {/* Features Grid */}
      <section ref={featuresRef} className="py-24 bg-background opacity-0 animate-fade-in-up">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-4">
              POWERFUL FEATURES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-justify">
              Empower your property management operations with cutting-edge technology designed to streamline workflows, enhance financial visibility, and foster seamless communication between landlords and tenants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl group hover:border-accent/30 card-interactive">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <BarChart3 className="h-7 w-7 text-accent-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Real-Time Analytics
                </h3>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Gain comprehensive visibility into your property portfolio with real-time cashflow tracking, automated expense monitoring, and intelligent infographics that enable data-driven decisions and maximize profitability across all assets.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl group hover:border-accent-green/30 card-interactive">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent-green to-accent-green/80 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Users className="h-7 w-7 text-accent-green-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Smart Tenant Portal
                </h3>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Enhance tenant satisfaction with modern self-service capabilities, automated payment reminders, comprehensive transaction history, and transparent communication channels that streamline interactions and ensure timely rent collection.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl group hover:border-primary/30 card-interactive">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <TrendingUp className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Automated Billing
                </h3>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Eliminate payment delays with intuitive countdown timers, automated invoicing workflows, integrated payment processing, and proactive reminder systems that ensure consistent cashflow and reduce administrative overhead.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl group hover:border-accent/30 card-interactive">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <FileText className="h-7 w-7 text-accent-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Legal Automation
                </h3>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Streamline legal documentation with intelligent contract generation, customizable lease templates, integrated e-signature workflows, and automated availability that ensures compliance and eliminates paperwork throughout the tenant lifecycle.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl group hover:border-accent-green/30 card-interactive">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent-green to-accent-green/80 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Zap className="h-7 w-7 text-accent-green-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Multi-Property Dashboard
                </h3>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Oversee unlimited properties from a centralized command center with comprehensive occupancy tracking, maintenance scheduling, tenant management tools, and performance analytics that provide complete portfolio visibility.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl group hover:border-primary/30 card-interactive">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Shield className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Enterprise Security
                </h3>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Protect sensitive data with bank-level encryption, maintain compliance with rental regulations, and leverage SOC 2 Type II certified infrastructure that ensures your operations meet the highest security standards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Metrics Section */}
      <section ref={metricsRef} className="py-16 bg-muted/30 border-y border-border/50 opacity-0 animate-fade-in-up">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            <div className="text-center group cursor-default">
              <div className="text-4xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors duration-300">500+</div>
              <div className="text-sm text-muted-foreground font-medium">Properties Managed</div>
            </div>
            <div className="text-center group cursor-default">
              <div className="text-4xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors duration-300">99.9%</div>
              <div className="text-sm text-muted-foreground font-medium">Platform Uptime</div>
            </div>
            <div className="text-center group cursor-default">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-4xl font-bold text-foreground group-hover:text-accent transition-colors duration-300">4.9</span>
                <Star className="h-6 w-6 text-accent fill-accent group-hover:scale-125 transition-transform duration-300" />
              </div>
              <div className="text-sm text-muted-foreground font-medium">User Rating</div>
            </div>
            <div className="text-center group cursor-default">
              <div className="text-4xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors duration-300">24/7</div>
              <div className="text-sm text-muted-foreground font-medium">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-24 bg-background opacity-0 animate-fade-in-up">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-4">
              CUSTOMER SUCCESS STORIES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Loved by Property Managers Worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how Cribhub is transforming property management for professionals like you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl relative group card-interactive">
              <CardContent className="pt-8 pb-8 px-6">
                <Quote className="h-10 w-10 text-accent/20 mb-4 group-hover:text-accent/40 transition-colors duration-300" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-accent fill-accent group-hover:scale-125 transition-transform duration-300" style={{ transitionDelay: `${i * 50}ms` }} />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "Cribhub reduced our rent collection time by 60%. The automated reminders and easy payment portal have been game-changers for our tenants and our bottom line."
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground font-semibold">
                      CA
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">Cyril Adams</div>
                    <div className="text-sm text-muted-foreground">Property Management, Jungle Estates</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl relative group card-interactive">
              <CardContent className="pt-8 pb-8 px-6">
                <Quote className="h-10 w-10 text-accent/20 mb-4 group-hover:text-accent/40 transition-colors duration-300" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-accent fill-accent group-hover:scale-125 transition-transform duration-300" style={{ transitionDelay: `${i * 50}ms` }} />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "Managing 50+ properties used to be overwhelming. Now with Cribhub's dashboard, I have complete visibility and control. It's like having a full team at my fingertips."
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-accent-green to-accent-green/80 text-accent-green-foreground font-semibold">
                      MC
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">Michael Chen</div>
                    <div className="text-sm text-muted-foreground">Landlord, Chen Properties</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl relative group card-interactive">
              <CardContent className="pt-8 pb-8 px-6">
                <Quote className="h-10 w-10 text-accent/20 mb-4 group-hover:text-accent/40 transition-colors duration-300" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-accent fill-accent group-hover:scale-125 transition-transform duration-300" style={{ transitionDelay: `${i * 50}ms` }} />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "The analytics features are incredible. We can now track every metric that matters and make data-driven decisions. Our revenue has increased by 25% this year."
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                      ER
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">Emily Rodriguez</div>
                    <div className="text-sm text-muted-foreground">Operations Director, Metro Living</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section ref={aboutRef} id="about" className="py-24 bg-muted/30 opacity-0 animate-fade-in-up">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-4">
              ABOUT US
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Transforming Real Estate Management
            </h2>
          </div>
          
          <Card className="border-border/50 shadow-elegant bg-card rounded-2xl overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed text-justify mb-6">
                  We are the cloud-based ecosystem of modern real estate. Our advanced digital infrastructure not only provides real estate with a flexible online home, but also enables contributions from passionate real estate professionals and patrons across the world.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed text-justify">
                  Together, we are transforming and elevating the virtual valuation and management of real estate markets — from underserved regions to highly developed environments.
                </p>
              </div>
              <div className="mt-8 pt-8 border-t border-border/50">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Global Reach</h4>
                    <p className="text-sm text-muted-foreground">Empowering professionals worldwide</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent-green to-accent-green/80 flex items-center justify-center mx-auto mb-3">
                      <Zap className="h-6 w-6 text-accent-green-foreground" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Innovation First</h4>
                    <p className="text-sm text-muted-foreground">Advanced digital infrastructure</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Market Elevation</h4>
                    <p className="text-sm text-muted-foreground">Transforming real estate markets</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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

      {/* Contact Information Section */}
      <section ref={contactRef} id="contact" className="py-24 bg-background border-t border-border/50 opacity-0 animate-fade-in-up">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-4">
              GET IN TOUCH
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions? Our team is here to help you get started
            </p>
          </div>

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

          <div className="mt-12 text-center">
            <Card className="border-border/50 shadow-card bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-2xl">
              <CardContent className="p-8">
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
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto text-justify">
              Empowering property managers with intelligent automation and comprehensive analytics for streamlined operations and exceptional tenant experiences.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
              <a href="#about" className="text-muted-foreground hover:text-accent transition-colors">
                About Us
              </a>
              <a href="#contact" className="text-muted-foreground hover:text-accent transition-colors">
                Contact
              </a>
              <a href="tel:+233504971614" className="text-muted-foreground hover:text-accent transition-colors">
                +233 50 497 1614
              </a>
              <a href="mailto:support@cribhub-gh.com" className="text-muted-foreground hover:text-accent transition-colors">
                Email Us
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2025 Cribhub. All rights reserved.
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
