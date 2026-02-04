import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SUPPORTED_CURRENCIES } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2, Sparkles, Building2, Users, Home, Globe, ArrowRight, CheckCircle2, ArrowLeft, Mail, KeyRound, Trash2 } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import logo from "@/assets/cribhub-logo.png";
import heroBuilding from "@/assets/hero-building.jpg";

const emailSchema = z.string().email("Invalid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100);
const nameSchema = z.string().trim().min(1, "Name is required").max(100);
const phoneSchema = z.string().regex(/^\+\d{10,15}$/, "Phone must be in international format (e.g., +233501234567)").optional().or(z.literal(""));

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Signup step state
  const [signupStep, setSignupStep] = useState(1);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Get role from URL query parameter
  const roleFromUrl = searchParams.get("role") as "tenant" | "landlord" | "property_manager" | null;

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<"tenant" | "landlord" | "property_manager">("tenant");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupNationalId, setSignupNationalId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"tenant" | "landlord" | "property_manager">("tenant");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("GHS");

  // Handle role from URL parameter - switch to signup tab and pre-select role
  useEffect(() => {
    if (roleFromUrl && (roleFromUrl === "landlord" || roleFromUrl === "property_manager" || roleFromUrl === "tenant")) {
      setActiveTab("signup");
      setSelectedRole(roleFromUrl);
    }
  }, [roleFromUrl]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", loginRole)
        .maybeSingle();

      if (roleError) {
        console.error("Error checking role:", roleError);
        await supabase.auth.signOut();
        toast({
          title: "Error",
          description: "Failed to verify your account role. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!roleData) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: `You don't have ${loginRole.replace('_', ' ')} access. Please select the correct role or contact support.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      localStorage.setItem("activeRole", loginRole);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${loginRole.replace('_', ' ')}`,
      });
      
      if (loginRole === "landlord") {
        navigate("/landlord-dashboard");
      } else if (loginRole === "property_manager") {
        navigate("/manager-dashboard");
      } else {
        navigate("/tenant-portal");
      }
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(forgotEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setResetEmailSent(true);
    setLoading(false);
  };

  const handleSignupStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setSignupStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone if provided
    if (signupPhone) {
      try {
        phoneSchema.parse(signupPhone);
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            title: "Validation Error",
            description: error.errors[0].message,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setLoading(true);

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: signupName,
          phone: signupPhone,
        },
      },
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      const alreadyExists =
        msg.includes("already") && (msg.includes("registered") || msg.includes("exists"));

      if (alreadyExists) {
        setShowForgotPassword(true);
        setForgotEmail(signupEmail);
        setResetEmailSent(false);

        toast({
          title: "Account already exists",
          description: "Use password reset to set a new password for this email.",
        });
      } else {
        toast({
          title: "Signup Failed",
          description: authError.message,
          variant: "destructive",
        });
      }

      setLoading(false);
      return;
    }

    if (authData.user) {
      // Update profile with additional data
      const updateData: Record<string, string> = {};
      if (signupPhone) updateData.phone = signupPhone;
      if (signupNationalId) updateData.national_id = signupNationalId;
      if (selectedRole === "landlord") updateData.default_currency = selectedCurrency;

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", authData.user.id);
      }

      // Assign role or create role request
      if (selectedRole === "tenant") {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "tenant",
          });

        if (roleError) {
          console.error("Error assigning tenant role:", roleError);
        } else {
          localStorage.setItem("activeRole", "tenant");
        }
      } else {
        // Landlords and Property managers need verification
        await supabase
          .from("role_requests")
          .insert([{
            user_id: authData.user.id,
            requested_role: selectedRole as "landlord" | "property_manager",
            verification_notes: verificationNotes,
            status: "pending",
          }]);
      }

      // Send welcome email (don't block on this)
      supabase.functions.invoke("send-welcome-email", {
        body: {
          email: signupEmail,
          name: signupName,
          role: selectedRole,
        },
      }).catch(console.error);

      toast({
        title: "🎉 Account Created!",
        description: "Welcome to Cribhub! You're now logged in.",
      });

      // Navigate to dashboard
      navigate("/dashboard");
    }

    setLoading(false);
  };

  const roleCards = [
    {
      value: "tenant",
      label: "Tenant",
      icon: Home,
      description: "Find and rent properties",
      color: "secondary",
    },
    {
      value: "landlord",
      label: "Landlord",
      icon: Building2,
      description: "Manage your properties",
      color: "primary",
    },
    {
      value: "property_manager",
      label: "Manager",
      icon: Users,
      description: "Manage for landlords",
      color: "accent",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left Side - Ghanaian Artwork */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src={heroBuilding}
          alt="Beautiful Ghanaian real estate architecture"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <img 
              src={logo}
              alt="Cribhub"
              className="h-20 w-auto mb-8"
            />
          </div>
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Trusted Across Ghana</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Empowering Property Management Excellence
            </h2>
            
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Join thousands of property managers and landlords across Ghana who trust Cribhub to streamline operations and deliver exceptional experiences.
            </p>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-primary-foreground/80">Properties</div>
              </div>
              <div className="h-12 w-px bg-primary-foreground/20" />
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-primary-foreground/80">Satisfaction</div>
              </div>
              <div className="h-12 w-px bg-primary-foreground/20" />
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-primary-foreground/80">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Home Button */}
          <div className="mb-6 flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <img 
              src={logo}
              alt="Cribhub"
              className="h-16 w-auto mx-auto"
            />
          </div>
          
          <Card className="border-border shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-center text-foreground">
                {showForgotPassword 
                  ? "Reset Password" 
                  : activeTab === "login" 
                    ? "Welcome Back" 
                    : "Get Started"}
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                {showForgotPassword
                  ? "Enter your email to receive a reset link"
                  : activeTab === "login" 
                    ? "Sign in to access your dashboard" 
                    : signupStep === 1 
                      ? "Create your account in seconds" 
                      : "Tell us a bit more about yourself"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showForgotPassword ? (
                <div className="space-y-4">
                  {resetEmailSent ? (
                    <div className="text-center space-y-4 py-4">
                      <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Check your email</h3>
                        <p className="text-sm text-muted-foreground">
                          We've sent a password reset link to<br />
                          <span className="font-medium text-foreground">{forgotEmail}</span>
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Didn't receive the email? Check your spam folder or try again.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetEmailSent(false);
                          setForgotEmail("");
                        }}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <KeyRound className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">Email Address</Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="your@email.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          disabled={loading}
                          autoFocus
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Reset Link
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotEmail("");
                        }}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Button>
                    </form>
                  )}
                </div>
              ) : (
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSignupStep(1); }} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  {/* Role Selection */}
                  <div className="mt-6 mb-6 space-y-3">
                    <p className="text-sm font-medium text-foreground text-center">
                      I am logging in as
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {roleCards.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setLoginRole(role.value as typeof loginRole)}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            loginRole === role.value
                              ? `bg-${role.color}/10 border-${role.color} shadow-md`
                              : `bg-${role.color}/5 border-${role.color}/10 hover:border-${role.color}/30`
                          }`}
                        >
                          <role.icon className={`h-5 w-5 mb-1 ${loginRole === role.value ? `text-${role.color}` : "text-muted-foreground"}`} />
                          <span className={`text-xs font-medium ${loginRole === role.value ? `text-${role.color}` : "text-foreground"}`}>{role.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  {signupStep === 1 ? (
                    <form onSubmit={handleSignupStep1} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          required
                          disabled={loading}
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <PasswordStrengthIndicator password={signupPassword} />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-4 mt-4">
                      {/* Progress indicator */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1 bg-primary rounded" />
                        <div className="flex-1 h-1 bg-primary rounded" />
                      </div>

                      {/* Role Selection */}
                      <div className="space-y-3">
                        <Label>I am registering as</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {roleCards.map((role) => (
                            <button
                              key={role.value}
                              type="button"
                              onClick={() => setSelectedRole(role.value as typeof selectedRole)}
                              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                                selectedRole === role.value
                                  ? "bg-primary/10 border-primary shadow-md"
                                  : "bg-muted/50 border-border hover:border-primary/30"
                              }`}
                            >
                              <role.icon className={`h-5 w-5 mb-1 ${selectedRole === role.value ? "text-primary" : "text-muted-foreground"}`} />
                              <span className={`text-xs font-medium ${selectedRole === role.value ? "text-primary" : "text-foreground"}`}>{role.label}</span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">{role.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">Phone Number <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="+233501234567"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-national-id">
                          Ghana Card Number <span className="text-muted-foreground text-xs">(Optional)</span>
                        </Label>
                        <Input
                          id="signup-national-id"
                          type="text"
                          placeholder="GHA-XXXXXXXXX-X"
                          value={signupNationalId}
                          onChange={(e) => setSignupNationalId(e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      {/* Currency Selector - Only for Landlords */}
                      {selectedRole === "landlord" && (
                        <div className="space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" />
                            <Label htmlFor="currency-select" className="font-medium text-sm">
                              Operating Currency
                            </Label>
                          </div>
                          <Select value={selectedCurrency} onValueChange={setSelectedCurrency} disabled={loading}>
                            <SelectTrigger id="currency-select" className="w-full bg-background">
                              <SelectValue placeholder="Select currency">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency)?.symbol}</span>
                                  <span>{selectedCurrency}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {SUPPORTED_CURRENCIES.map((curr) => (
                                <SelectItem key={curr.code} value={curr.code}>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-lg w-8">{curr.symbol}</span>
                                    <div>
                                      <div className="font-medium">{curr.code}</div>
                                      <div className="text-xs text-muted-foreground">{curr.name}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Verification notes for non-tenants */}
                      {selectedRole !== "tenant" && (
                        <div className="space-y-2">
                          <Label htmlFor="verification-notes">
                            Verification Info <span className="text-muted-foreground text-xs">(Optional)</span>
                          </Label>
                          <textarea
                            id="verification-notes"
                            className="w-full min-h-[60px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none"
                            placeholder={
                              selectedRole === "landlord"
                                ? "Tell us about your properties..."
                                : "Tell us about your experience..."
                            }
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                            disabled={loading}
                          />
                          <p className="text-xs text-muted-foreground">
                            Your account will be reviewed for full access.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSignupStep(1)}
                          disabled={loading}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button type="submit" className="flex-[2]" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Create Account
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Auth;
