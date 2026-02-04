import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, FileText, Shield, TrendingUp, Users, Zap, Star } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { PageTransition } from "@/components/PageTransition";

const Features = () => {
  const featuresRef = useScrollAnimation();
  const metricsRef = useScrollAnimation();

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary via-secondary to-primary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent-foreground font-semibold text-sm mb-4 border border-accent/20">
              POWERFUL FEATURES
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Everything You Need in One Platform
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
              Empower your property management operations with cutting-edge technology designed to streamline workflows, enhance financial visibility, and foster seamless communication.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section ref={featuresRef} className="py-24 bg-background opacity-0 animate-fade-in-up">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
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
      </div>
    </PageTransition>
  );
};

export default Features;
