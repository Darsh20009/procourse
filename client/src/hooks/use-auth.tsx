import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { User } from "../lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, userId: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is logged in when component mounts
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
          console.log("User authenticated:", userData);
          setUser(userData);
        } else {
          console.log("User not authenticated");
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

  // Login function
  const login = async (email: string, userId: string): Promise<boolean> => {
    try {
      console.log("Logging in with:", { email, userId });
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId }),
        credentials: "include"
      });
      
      console.log("Login response status:", res.status);
      
      if (res.ok) {
        const userData = await res.json();
        console.log("Login successful:", userData);
        setUser(userData);
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحبًا بك في منصة Pro Course!",
        });
        
        return true;
      } else {
        console.error("Login failed");
        
        toast({
          title: "فشل تسجيل الدخول",
          description: "بيانات الاعتماد غير صالحة. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
        
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<boolean> => {
    try {
      console.log("Logging out...");
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      
      console.log("Logout response status:", res.status);
      
      if (res.ok) {
        setUser(null);
        
        toast({
          title: "تم تسجيل الخروج",
          description: "تم تسجيل خروجك بنجاح",
        });
        
        return true;
      } else {
        console.error("Logout failed");
        
        toast({
          title: "فشل تسجيل الخروج",
          description: "حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
        
        return false;
      }
    } catch (error) {
      console.error("Logout error:", error);
      
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}