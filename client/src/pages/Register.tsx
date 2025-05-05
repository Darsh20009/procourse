import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

export default function Register() {
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [field, setField] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Navigation and toast
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Available certification fields
  const certificationFields = [
    { id: "java", name: "Java" },
    { id: "javascript", name: "JavaScript" },
    { id: "python", name: "Python" },
    { id: "oracle_apex", name: "Oracle APEX" },
    { id: "cpp", name: "C++" },
    { id: "csharp", name: "C#" },
    { id: "web", name: "HTML/CSS/Web Development" },
    { id: "php", name: "PHP" },
    { id: "sql", name: "SQL" },
    { id: "r_matlab", name: "R & MATLAB" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !field) {
      toast({
        title: "حقول مطلوبة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Register the user
      const registerRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          preferredField: field 
        }),
        credentials: "include"
      });
      
      if (registerRes.ok) {
        const userData = await registerRes.json();
        
        toast({
          title: "تم التسجيل بنجاح",
          description: `تم إنشاء حسابك برقم الهوية: ${userData.id}. احتفظ بهذا الرقم للدخول لاحقاً.`,
        });
        
        // Auto-login the user
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email, 
            userId: userData.id 
          }),
          credentials: "include"
        });
        
        if (loginRes.ok) {
          // Redirect to dashboard
          setLocation("/dashboard");
        } else {
          // If auto-login fails, redirect to login page
          setLocation("/auth");
        }
      } else {
        const errorData = await registerRes.json();
        toast({
          title: "فشل في التسجيل",
          description: errorData.message || "حدث خطأ أثناء محاولة التسجيل. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "خطأ في التسجيل",
        description: "حدث خطأ أثناء محاولة التسجيل. يرجى المحاولة مرة أخرى.",
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
            <h2 className="text-2xl font-bold text-gray-800">إنشاء حساب جديد</h2>
            <p className="text-gray-600 mt-2">أنشئ حسابك للوصول إلى اختبارات الشهادات في مجال البرمجة</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>

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
              <Label htmlFor="field">مجال الاختبار</Label>
              <Select value={field} onValueChange={setField} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مجال الاختبار" />
                </SelectTrigger>
                <SelectContent>
                  {certificationFields.map(field => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">اختر المجال الذي ترغب في الاختبار فيه للحصول على شهادة</p>
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </Button>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">لديك حساب بالفعل؟</span>{" "}
              <a 
                href="/auth"
                className="text-accent hover:text-accent-dark font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  setLocation("/auth");
                }}
              >
                تسجيل الدخول
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}