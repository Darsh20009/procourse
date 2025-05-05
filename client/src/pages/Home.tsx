
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
      <h1 className="text-4xl font-bold mb-6">مرحباً بك في Pro Course</h1>
      <div className="max-w-2xl mb-8">
        <p className="text-xl mb-4">
          منصة متخصصة للاختبارات والشهادات المهنية في مجال تكنولوجيا المعلومات
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-neutral-100 rounded-lg">
            <h3 className="font-bold mb-2">اختبارات احترافية</h3>
            <p>اختبارات معتمدة في مختلف مجالات البرمجة والتقنية</p>
          </div>
          <div className="p-4 bg-neutral-100 rounded-lg">
            <h3 className="font-bold mb-2">شهادات معتمدة</h3>
            <p>احصل على شهادة معتمدة فور اجتياز الاختبار</p>
          </div>
          <div className="p-4 bg-neutral-100 rounded-lg">
            <h3 className="font-bold mb-2">تطوير مستمر</h3>
            <p>تحديث مستمر للمحتوى ومواكبة أحدث التقنيات</p>
          </div>
        </div>
      </div>
      <div className="space-x-4 rtl:space-x-reverse">
        <Button size="lg" onClick={() => setLocation("/auth")}>
          تسجيل الدخول
        </Button>
        <Button size="lg" variant="outline" onClick={() => setLocation("/register")}>
          إنشاء حساب جديد
        </Button>
      </div>
    </div>
  );
}
