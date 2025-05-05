import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "./queryClient";
import { User } from "./types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, userId: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/check", {
          credentials: "include",
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, userId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, userId });
      const userData = await res.json();
      setUser(userData);
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return React.createElement(AuthContext.Provider, {
    value: {
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading
    }
  }, children);
};
