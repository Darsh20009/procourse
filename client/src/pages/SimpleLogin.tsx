import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function SimpleLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "حقول مطلوبة",
        description: "يرجى إدخال البريد الإلكتروني وكلمة المرور",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Attempting login with:", { email, password });
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });
      
      console.log("Login response status:", res.status);
      
      if (res.ok) {
        const userData = await res.json();
        console.log("Login successful:", userData);
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحبًا بك في منصة Pro Course!",
        });
        
        setLocation("/dashboard");
      } else {
        console.error("Login failed");
        
        toast({
          title: "فشل تسجيل الدخول",
          description: "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.",
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
      setIsSubmitting(false);
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
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الخاصة بك"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>

            {/* Test credentials */}
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>للتجربة: example@test.com / password123</p>
            </div>
            
            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">ليس لديك حساب؟</span>{" "}
              <a 
                href="/register"
                className="text-accent hover:text-accent-dark font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  setLocation("/register");
                }}
              >
                إنشاء حساب جديد
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}