import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import logo from "@/assets/cribhub-logo.png";

export const Navigation = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string, closeMobile?: boolean) => {
    if (closeMobile) closeMobileMenu();
    
    // If not on home page, navigate to home with hash
    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
    } else {
      // Scroll to section on same page
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getRoleDisplay = (role: string | null) => {
    if (!role) return null;
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const NavigationLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Public search - always visible */}
      <NavLink 
        to="/search" 
        className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md' : ''}`}
        activeClassName="text-accent"
        onClick={mobile ? closeMobileMenu : undefined}
      >
        Find Property
      </NavLink>
      {!user && (
        <>
          <button 
            onClick={() => handleNavClick("about", mobile)}
            className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors text-left ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md w-full' : ''}`}
          >
            About Us
          </button>
          <button 
            onClick={() => handleNavClick("contact", mobile)}
            className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors text-left ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md w-full' : ''}`}
          >
            Contact
          </button>
        </>
      )}
      {user && (
        <>
          {/* Property Manager & Admin Navigation */}
          {(userRole === "property_manager" || userRole === "admin") && (
            <NavLink 
              to="/manager-dashboard" 
              className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md' : ''}`}
              activeClassName="text-accent"
              onClick={mobile ? closeMobileMenu : undefined}
            >
              Manager Dashboard
            </NavLink>
          )}
          
          {/* Landlord Navigation */}
          {(userRole === "landlord" || userRole === "admin") && (
            <>
              <NavLink 
                to="/landlord-dashboard" 
                className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md' : ''}`}
                activeClassName="text-accent"
                onClick={mobile ? closeMobileMenu : undefined}
              >
                Landlord Dashboard
              </NavLink>
              <NavLink 
                to="/properties" 
                className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md' : ''}`}
                activeClassName="text-accent"
                onClick={mobile ? closeMobileMenu : undefined}
              >
                Properties
              </NavLink>
              <NavLink 
                to="/rental-applications" 
                className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md' : ''}`}
                activeClassName="text-accent"
                onClick={mobile ? closeMobileMenu : undefined}
              >
                Applications
              </NavLink>
            </>
          )}
          
          {/* Tenant Navigation */}
          {userRole === "tenant" && (
            <>
              <NavLink 
                to="/browse-units" 
                className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md' : ''}`}
                activeClassName="text-accent"
                onClick={mobile ? closeMobileMenu : undefined}
              >
                Browse Units
              </NavLink>
              <NavLink 
                to="/tenant-portal" 
                className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md' : ''}`}
                activeClassName="text-accent"
                onClick={mobile ? closeMobileMenu : undefined}
              >
                My Portal
              </NavLink>
            </>
          )}
          
          {/* Legal Documents - Landlords and Property Managers only */}
          {(userRole === "landlord" || userRole === "property_manager" || userRole === "admin") && (
            <NavLink 
              to="/legal-documents" 
              className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md' : ''}`}
              activeClassName="text-accent"
              onClick={mobile ? closeMobileMenu : undefined}
            >
              Legal Documents
            </NavLink>
          )}
          
          {/* Contracts - Landlords and Property Managers only */}
          {(userRole === "landlord" || userRole === "property_manager" || userRole === "admin") && (
            <NavLink 
              to="/contracts" 
              className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md' : ''}`}
              activeClassName="text-accent"
              onClick={mobile ? closeMobileMenu : undefined}
            >
              Contracts
            </NavLink>
          )}
          
          {/* Verifications - Admin and Landlord only */}
          {(userRole === "admin" || userRole === "landlord") && (
            <NavLink 
              to="/verification-management" 
              className={`text-sm font-semibold text-muted-foreground hover:text-accent transition-colors ${mobile ? 'block py-3 px-4 hover:bg-muted/50 rounded-md' : ''}`}
              activeClassName="text-accent"
              onClick={mobile ? closeMobileMenu : undefined}
            >
              Verifications
            </NavLink>
          )}
        </>
      )}
    </>
  );

  return (
    <nav className="border-b border-border/50 bg-card/80 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 group">
            <img 
              src={logo} 
              alt="Cribhub" 
              className="h-16 w-auto transition-transform group-hover:scale-105"
              width="auto"
              height="64"
            />
          </NavLink>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavigationLinks />
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            {user && userRole && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {getRoleDisplay(userRole)}
              </Badge>
            )}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 hover-scale">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-4 mt-8">
                  {user && (
                    <div className="pb-4 border-b border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground truncate">
                          {user.email}
                        </span>
                      </div>
                      {userRole && (
                        <Badge variant="secondary" className="mb-3">
                          {getRoleDisplay(userRole)}
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleSignOut();
                          closeMobileMenu();
                        }}
                        className="w-full font-semibold"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <NavigationLinks mobile />
                  </div>
                  {!user && (
                    <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        className="w-full font-semibold"
                        onClick={() => {
                          navigate("/auth");
                          closeMobileMenu();
                        }}
                      >
                        Sign In
                      </Button>
                      <Button 
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                        onClick={() => {
                          navigate("/auth");
                          closeMobileMenu();
                        }}
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop User Section - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground max-w-[200px] truncate">
                        {user.email}
                      </span>
                      {userRole && (
                        <Badge variant="secondary" className="ml-1">
                          {getRoleDisplay(userRole)}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="font-semibold"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="font-semibold"
                      onClick={() => navigate("/auth")}
                    >
                      Sign In
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                      onClick={() => navigate("/auth")}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
