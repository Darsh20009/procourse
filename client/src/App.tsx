import React from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Login from "@/pages/Login";
import Exam from "@/pages/Exam";
import Certificates from "@/pages/Certificates";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { useAuth } from "./lib/auth";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();
  const isAuthenticated = !!user;

  // Check session on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking auth status...");
        const res = await fetch("/api/auth/check", {
          credentials: "include",
        });
        
        console.log("Auth check status:", res.status);
        
        if (res.ok) {
          const userData = await res.json();
          console.log("User is authenticated:", userData);
          setUser(userData);
        } else {
          console.log("User is not authenticated");
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle redirect
  useEffect(() => {
    if (!isLoading) {
      // Redirect to login if not authenticated and not already on login page
      if (!isAuthenticated && location !== "/") {
        console.log("Not authenticated, redirecting to login");
        setLocation("/");
      }
    }
  }, [isAuthenticated, location, setLocation, isLoading]);

  // Create auth context value
  const authContextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    setUser
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Switch>
            <Route path="/" component={Login} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/exam" component={Exam} />
            <Route path="/certificates" component={Certificates} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
        <Toaster />
      </div>
    </AuthContext.Provider>
  );
}

export default App;
