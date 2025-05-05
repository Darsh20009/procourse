import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../App";

export default function Login() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const { user, setUser } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("Login form submitted:", { email, userId });

    try {
      console.log("Sending login request to /api/auth/login");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId }),
        credentials: "include"
      });
      
      console.log("Login response status:", res.status);
      
      if (res.ok) {
        const userData = await res.json();
        console.log("Login successful, user data:", userData);
        
        // Update auth context
        setUser(userData);
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحبًا بك في منصة Pro Course!",
        });
        
        setLocation("/dashboard");
      } else {
        const errorData = await res.text();
        console.error("Login failed:", errorData);
        
        toast({
          title: "فشل تسجيل الدخول",
          description: "بيانات الاعتماد غير صالحة. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardContent className="pt-6 px-6 pb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">الدخول إلى Pro Course</h2>
            <p className="text-gray-600 mt-2">أدخل بيانات الاعتماد الخاصة بك للوصول إلى الاختبارات والشهادات</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userId">رقم الهوية</Label>
              <Input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="أدخل رقم الهوية الخاص بك"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}