
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const { login, user } = useAuth();
  
  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting to dashboard");
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log("Attempting login with:", { email, userId });
      const success = await login(email, userId);
      
      if (success) {
        console.log("Login successful, redirecting to dashboard");
        setLocation("/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = () => {
    window.location.href = 'https://pro-courses.odoo.com/tqdym-l-lkhtbr';
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
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>

            <div className="mt-4 text-center">
              <Button variant="link" type="button" onClick={handleRegister}>
                للتسجيل في الاختبار اضغط هنا
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
