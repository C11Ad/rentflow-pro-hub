import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Zap, TrendingUp } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { PageTransition } from "@/components/PageTransition";

const About = () => {
  const aboutRef = useScrollAnimation();

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary via-secondary to-primary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent-foreground font-semibold text-sm mb-4 border border-accent/20">
              ABOUT US
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Transforming Real Estate Management
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
              We are the cloud-based ecosystem of modern real estate, enabling contributions from passionate professionals worldwide.
            </p>
          </div>
        </section>

        {/* About Content */}
        <section ref={aboutRef} className="py-24 bg-background opacity-0 animate-fade-in-up">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <Card className="border-border/50 shadow-elegant bg-card rounded-2xl overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg text-muted-foreground leading-relaxed text-justify mb-6">
                    We are the cloud-based ecosystem of modern real estate. Our advanced digital infrastructure not only provides real estate with a flexible online home, but also enables contributions from passionate real estate professionals and patrons across the world.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed text-justify mb-6">
                    Together, we are transforming and elevating the virtual valuation and management of real estate markets — from underserved regions to highly developed environments.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed text-justify">
                    Our mission is to empower property managers, landlords, and tenants with intelligent tools that simplify operations, enhance communication, and drive business growth through data-driven insights.
                  </p>
                </div>
                <div className="mt-12 pt-8 border-t border-border/50">
                  <h3 className="text-2xl font-bold text-foreground text-center mb-8">Our Core Values</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-accent-foreground" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-2 text-lg">Global Reach</h4>
                      <p className="text-muted-foreground">Empowering professionals worldwide with accessible, scalable solutions</p>
                    </div>
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent-green to-accent-green/80 flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-8 w-8 text-accent-green-foreground" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-2 text-lg">Innovation First</h4>
                      <p className="text-muted-foreground">Building advanced digital infrastructure for the future of real estate</p>
                    </div>
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-2 text-lg">Market Elevation</h4>
                      <p className="text-muted-foreground">Transforming real estate markets from underserved to thriving</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Section */}
            <div className="mt-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Vision</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  To become the leading property management platform that connects landlords, property managers, and tenants in a seamless digital ecosystem.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-border/50 shadow-card bg-card rounded-2xl">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4">For Property Owners</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We provide comprehensive tools to manage your properties efficiently, track revenue, handle tenant relationships, and ensure legal compliance—all from one intuitive dashboard.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-border/50 shadow-card bg-card rounded-2xl">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4">For Tenants</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We offer a transparent, user-friendly portal where tenants can pay rent, submit maintenance requests, access documents, and communicate directly with property managers.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default About;
