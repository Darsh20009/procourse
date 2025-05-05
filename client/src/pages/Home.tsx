
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";

export default function Home() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary text-white py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Pro Course - منصة الاختبارات المهنية</h1>
            <p className="text-xl mb-8">اختبارات معتمدة للمحترفين في مجال تكنولوجيا المعلومات</p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setLocation("/auth")}
              className="text-lg px-8"
            >
              ابدأ الآن
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">مميزات المنصة</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-bold mb-4">اختبارات احترافية</h3>
                <p>اختبارات معتمدة في مختلف مجالات البرمجة والتقنية</p>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-bold mb-4">شهادات معتمدة</h3>
                <p>احصل على شهادة معتمدة فور اجتياز الاختبار</p>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-bold mb-4">دعم فني متواصل</h3>
                <p>فريق دعم متخصص لمساعدتك في كل خطوة</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">الأسعار</h2>
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">الاختبار المهني</h3>
                <div className="text-4xl font-bold mb-6">
                  <span className="text-primary">$120</span>
                </div>
                <ul className="text-right mb-8 space-y-3">
                  <li className="flex items-center">
                    <span className="ml-2">✓</span>
                    <span>اختبار شامل ومعتمد</span>
                  </li>
                  <li className="flex items-center">
                    <span className="ml-2">✓</span>
                    <span>شهادة معتمدة عند النجاح</span>
                  </li>
                  <li className="flex items-center">
                    <span className="ml-2">✓</span>
                    <span>دعم فني متواصل</span>
                  </li>
                  <li className="flex items-center">
                    <span className="ml-2">✓</span>
                    <span>صلاحية مدى الحياة</span>
                  </li>
                </ul>
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={() => setLocation("/register")}
                >
                  سجل الآن
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
