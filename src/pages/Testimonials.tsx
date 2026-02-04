import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { PageTransition } from "@/components/PageTransition";

const Testimonials = () => {
  const testimonialsRef = useScrollAnimation();

  const testimonials = [
    {
      quote: "Cribhub reduced our rent collection time by 60%. The automated reminders and easy payment portal have been game-changers for our tenants and our bottom line.",
      name: "Cyril Adams",
      role: "Property Management, Jungle Estates",
      initials: "CA",
      gradient: "from-accent to-accent/80",
    },
    {
      quote: "Managing 50+ properties used to be overwhelming. Now with Cribhub's dashboard, I have complete visibility and control. It's like having a full team at my fingertips.",
      name: "Michael Chen",
      role: "Landlord, Chen Properties",
      initials: "MC",
      gradient: "from-accent-green to-accent-green/80",
    },
    {
      quote: "The analytics features are incredible. We can now track every metric that matters and make data-driven decisions. Our revenue has increased by 25% this year.",
      name: "Emily Rodriguez",
      role: "Operations Director, Metro Living",
      initials: "ER",
      gradient: "from-primary to-primary/80",
    },
    {
      quote: "Setting up the platform was a breeze, and the customer support team has been incredibly helpful. We were up and running within a day.",
      name: "David Mensah",
      role: "CEO, Prime Realty Ghana",
      initials: "DM",
      gradient: "from-accent to-accent/80",
    },
    {
      quote: "The legal automation feature has saved us countless hours on contracts and lease agreements. Highly recommend for any serious property manager.",
      name: "Sarah Thompson",
      role: "Property Manager, Urban Spaces",
      initials: "ST",
      gradient: "from-accent-green to-accent-green/80",
    },
    {
      quote: "As a tenant, I love how easy it is to pay rent and submit maintenance requests. The communication with my landlord has never been smoother.",
      name: "James Osei",
      role: "Tenant, Accra",
      initials: "JO",
      gradient: "from-primary to-primary/80",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary via-secondary to-primary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent-foreground font-semibold text-sm mb-4 border border-accent/20">
              CUSTOMER SUCCESS STORIES
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Loved by Property Managers Worldwide
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
              See how Cribhub is transforming property management for professionals like you
            </p>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section ref={testimonialsRef} className="py-24 bg-background opacity-0 animate-fade-in-up">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card 
                  key={index}
                  className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 bg-card rounded-2xl relative group card-interactive"
                >
                  <CardContent className="pt-8 pb-8 px-6">
                    <Quote className="h-10 w-10 text-accent/20 mb-4 group-hover:text-accent/40 transition-colors duration-300" />
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className="h-4 w-4 text-accent fill-accent group-hover:scale-125 transition-transform duration-300" 
                          style={{ transitionDelay: `${i * 50}ms` }} 
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={`bg-gradient-to-br ${testimonial.gradient} text-white font-semibold`}>
                          {testimonial.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Stats Section */}
            <div className="mt-16">
              <Card className="border-border/50 shadow-elegant bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-2xl">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      Join Thousands of Satisfied Users
                    </h2>
                    <p className="text-muted-foreground">
                      Our platform is trusted by property managers across the globe
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">500+</div>
                      <div className="text-sm text-muted-foreground">Properties</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">98%</div>
                      <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-3xl md:text-4xl font-bold text-foreground">4.9</span>
                        <Star className="h-6 w-6 text-accent fill-accent" />
                      </div>
                      <div className="text-sm text-muted-foreground">Average Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">24/7</div>
                      <div className="text-sm text-muted-foreground">Support</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Testimonials;
