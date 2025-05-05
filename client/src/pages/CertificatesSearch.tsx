import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Certificate } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CertificatesSearch() {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const { toast } = useToast();

  // Search for certificates
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current user from session
      const authRes = await fetch('/api/auth/check', {
        credentials: 'include'
      });
      const user = await authRes.json();

      let queryParams = new URLSearchParams();
      // Use authenticated user's email if no search params provided
      if (!name && !userId && user?.email) {
        queryParams.append("email", user.email);
      } else {
        if (name) queryParams.append("name", name);
        if (userId) queryParams.append("userId", userId);
      }

      const res = await fetch(`/api/certificates/search?${queryParams.toString()}`, {
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        setCertificates(data);

        if (data.length === 0) {
          toast({
            title: "لم يتم العثور على شهادات",
            description: "لا توجد شهادات مطابقة لمعايير البحث",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "خطأ في البحث",
          description: "حدث خطأ أثناء البحث عن الشهادات",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error searching certificates:", error);
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ غير متوقع أثناء البحث عن الشهادات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // View certificate details
  const viewCertificate = (cert: Certificate) => {
    setSelectedCert(cert);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Download certificate as PDF with improved capture
  const downloadCertificate = async () => {
    if (!selectedCert) return;

    const certificateElement = document.getElementById('certificate-template');
    if (!certificateElement) return;

    try {
      toast({
        title: "جاري إنشاء الشهادة",
        description: "يرجى الانتظار... قد تستغرق هذه العملية بضع ثوان"
      });

      // ننتظر لحظة للتأكد من أن الشهادة مرئية تمامًا 
      await new Promise(resolve => setTimeout(resolve, 200));

      // إعدادات متقدمة لالتقاط الشهادة بالكامل
      const canvas = await html2canvas(certificateElement, {
        scale: 3, // دقة عالية
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // نعدل النسخة المستخدمة للتصوير لضمان ظهورها كاملة
          const clonedElement = clonedDoc.getElementById('certificate-template');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'static';
            clonedElement.style.width = `${certificateElement.offsetWidth}px`;
            clonedElement.style.height = `${certificateElement.offsetHeight}px`;
            clonedElement.style.margin = '0';
            clonedElement.style.padding = '20px';
            clonedElement.style.boxSizing = 'content-box';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // ننشئ PDF بتنسيق مناسب للشهادة المستطيلة الجديدة
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // حساب أبعاد الصفحة والصورة
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth - 20; // هامش 10مم من كل جانب
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      // حساب الإزاحة لوضع الصورة في وسط الصفحة
      const xOffset = 10;
      const yOffset = (pdfHeight - imgHeight) / 2;

      // إضافة الصورة إلى PDF مع ضبط الموضع
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

      // حفظ الملف باسم ذي معنى يتضمن رقم الشهادة واسم الشخص
      const safeUserName = selectedCert.userName.replace(/\s+/g, '_');
      const fileName = `Pro_Course_Certificate_${selectedCert.certificateNumber}_${safeUserName}.pdf`;

      pdf.save(fileName);

      toast({
        title: "تم إنشاء الشهادة بنجاح",
        description: "تم حفظ الشهادة كملف PDF"
      });
    } catch (error) {
      console.error("Error generating certificate PDF:", error);
      toast({
        title: "خطأ في إنشاء الشهادة",
        description: "حدث خطأ أثناء إنشاء ملف PDF للشهادة",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">بحث عن الشهادات</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المتقدم</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اكتب اسم المتقدم"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">رقم الهوية</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="أدخل رقم الهوية"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "جاري البحث..." : "بحث"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">نتائج البحث</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الشهادة</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>نوع الاختبار</TableHead>
                    <TableHead>تاريخ الإصدار</TableHead>
                    <TableHead>النتيجة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.certificateNumber}</TableCell>
                      <TableCell>{cert.userName}</TableCell>
                      <TableCell>{cert.examTitle}</TableCell>
                      <TableCell>{formatDate(cert.issueDate)}</TableCell>
                      <TableCell>{cert.score}%</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => viewCertificate(cert)}>
                          عرض الشهادة
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCert && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-xl">عرض الشهادة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg shadow-inner">
              <div id="certificate-template" className="relative bg-gradient-to-br from-blue-900 to-blue-950 border-4 border-blue-600/30 p-10 mx-auto text-center rounded-lg" style={{ minHeight: '700px', maxWidth: '1000px' }}>
                {/* Elegant Border Frame */}
                <div className="absolute inset-0 border-[1px] border-blue-400/20 m-4"></div>
                <div className="absolute inset-0 border-[2px] border-blue-400/10 m-8"></div>
                
                {/* Modern Geometric Patterns */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(147, 197, 253, 0.2) 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }}></div>
                </div>

                {/* Dynamic Gradient Background */}
                <div className="absolute inset-0 bg-gradient-radial from-blue-800/50 via-transparent to-blue-900/50 opacity-20"></div>
                
                {/* Animated Holographic Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-blue-400/10 opacity-30"
                     style={{animation: 'gradient 8s ease infinite'}}></div>
                
                {/* Pro Course Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <div className="text-white text-[200px] font-bold transform rotate-[-30deg]" style={{fontFamily: 'Arial Black'}}>
                    PRO COURSE
                  </div>
                </div>
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-10">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-900" />
                      </pattern>
                      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <rect width="50" height="50" fill="url(#smallGrid)" />
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-900" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" className="text-blue-900" />
                  </svg>
                </div>

                {/* Fancy Border */}
                <div className="absolute inset-0 border-[3px] border-blue-700/20 m-3 pointer-events-none rounded-sm"></div>
                <div className="absolute inset-0 border-[1px] border-blue-700/10 m-6 pointer-events-none rounded-sm"></div>

                {/* Top Banner */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 opacity-90">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                        <path d="M0,0 L100,0 L100,5 C80,15 70,20 50,30 C30,40 20,45 0,55 L0,0 Z" fill="white" />
                        <path d="M0,55 C20,45 30,40 50,30 C70,20 80,15 100,5 L100,20 C80,30 70,35 50,45 C30,55 20,60 0,70 L0,50 Z" fill="white" opacity="0.3" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* QR Code (Decorative) */}
                <div className="absolute top-28 right-8 w-20 h-20 bg-white border border-blue-200 shadow-sm rounded-lg overflow-hidden flex items-center justify-center">
                  <div className="grid grid-cols-5 grid-rows-5 gap-0.5 w-16 h-16 opacity-80">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`${Math.random() > 0.6 ? 'bg-blue-900' : 'bg-transparent'}`}></div>
                    ))}
                  </div>
                </div>

                {/* Hologram Effect (Left Side) */}
                <div className="absolute top-32 left-8 w-16 h-16 opacity-70">
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-transparent to-purple-400 rounded-full blur-sm"></div>
                    <div className="absolute inset-2 border border-white/20 rounded-full"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white/70">
                        <path d="M12 2L3 7l9 5l9-5l-9-5z" />
                        <path d="M3 17l9 5l9-5M3 12l9 5l9-5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Certificate Header Logo */}
                <div className="relative z-10 pt-16 mb-6">
                  <div className="bg-gradient-to-b from-blue-100 to-white border-4 border-blue-800 shadow-xl rounded-full w-32 h-32 mx-auto flex items-center justify-center overflow-hidden">
                    <div className="bg-blue-800 text-white rounded-full w-24 h-24 flex items-center justify-center text-3xl font-bold relative">
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8),transparent_70%)]"></div>
                      <div className="relative z-10 flex flex-col items-center">
                        <span className="text-sm font-normal tracking-widest">PRO</span>
                        <span className="text-xl">COURSE</span>
                        <div className="w-12 h-0.5 bg-blue-200 my-0.5"></div>
                        <span className="text-xs font-light">EST. 2023</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate Title */}
                <div className="relative z-10">
                  <h1 className="text-5xl font-bold mb-2 text-blue-900" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)', fontFamily: 'serif' }}>CERTIFICATE OF ACHIEVEMENT</h1>
                  <h2 className="text-2xl text-blue-700 font-semibold mb-2">Professional Programming Certification</h2>

                  {/* Decorative Separator */}
                  <div className="flex items-center justify-center my-6">
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-60"></div>
                  </div>
                </div>

                {/* Certificate Content */}
                <div className="mb-8 relative z-10">
                  {/* Background Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <div className="w-96 h-96 rotate-45">
                      <img src="/pro-course-logo.png" alt="Watermark" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Geometric Watermark Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="w-full h-full" style={{
                      backgroundImage: `repeating-linear-gradient(45deg, #1e40af 0px, #1e40af 2px, transparent 2px, transparent 10px)`
                    }}></div>
                  </div>

                  {/* Royal Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-5">
                    <div className="w-96 h-96 rotate-45">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <defs>
                          <pattern id="royal" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M0 5 Q2.5 0, 5 5 T10 5" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#royal)" className="text-blue-900"/>
                      </svg>
                    </div>
                  </div>

                  {/* Geometric Accents */}
                  <div className="absolute top-20 left-10 w-16 h-16">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-blue-200/30">
                      <polygon points="50,0 100,25 100,75 50,100 0,75 0,25" fill="currentColor"/>
                    </svg>
                  </div>


                  {/* Security Thread */}
                  <div className="absolute left-20 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200/20 via-blue-400/20 to-blue-200/20"></div>

                  {/* Content */}
                  <div className="relative">
                    <p className="text-xl mb-6 text-blue-800 font-serif" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.1)'}}>
                      This is to certify that
                    </p>
                    <h3 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-700" 
                        style={{textShadow: '2px 2px 4px rgba(0,0,0,0.1)'}}>
                      {selectedCert.userName}
                    </h3>
                    <div className="h-0.5 w-32 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-6"></div>
                    <p className="text-xl mb-6 leading-relaxed">
                      has successfully completed the
                      <span className="block font-bold text-2xl my-2 text-blue-800">{selectedCert.examTitle}</span>
                      examination with distinction and achieved a score of
                      <span className="block text-3xl font-bold text-blue-900 mt-2" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.1)'}}>
                        {selectedCert.score}%
                      </span>
                    </p>
                  </div>

                  {/* Holographic Effect */}
                  <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full" style={{
                    background: 'linear-gradient(45deg, rgba(59,130,246,0.1), rgba(30,64,175,0.2))',
                    filter: 'blur(10px)',
                    animation: 'pulse 2s infinite'
                  }}></div>
                </div>

                <style jsx>{`
                  @keyframes pulse {
                    0% { opacity: 0.3; }
                    50% { opacity: 0.7; }
                    100% { opacity: 0.3; }
                  }
                `}</style>

                {/* Security Elements */}
                <div className="flex items-center justify-center relative z-10 mb-8">
                  <div className="px-8 py-2 bg-blue-50 border border-blue-200 rounded-lg shadow-sm text-xs text-blue-800 font-mono tracking-wider">
                    ⬤ CERTIFICATE ID: {selectedCert.certificateNumber} ⬤ AUTHENTICATED ⬤ 
                  </div>
                </div>

                {/* Certificate Details in styled boxes */}
                <div className="grid grid-cols-3 gap-4 mx-auto max-w-3xl relative z-10 mb-12">
                  <div className="bg-gradient-to-b from-white to-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-center mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mr-1">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                      <p className="text-blue-800 font-semibold text-sm">Certificate ID</p>
                    </div>
                    <p className="text-sm font-mono tracking-wider text-blue-900 bg-white/80 p-1 rounded-md">{selectedCert.certificateNumber}</p>
                  </div>

                  <div className="bg-gradient-to-b from-white to-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-center mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mr-1">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <p className="text-blue-800 font-semibold text-sm">Issue Date</p>
                    </div>
                    <p className="text-sm text-blue-900 bg-white/80 p-1 rounded-md">{formatDate(selectedCert.issueDate)}</p>
                  </div>

                  <div className="bg-gradient-to-b from-white to-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-center mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mr-1">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <polyline points="17 11 19 13 23 9"></polyline>
                      </svg>
                      <p className="text-blue-800 font-semibold text-sm">User ID</p>
                    </div>
                    <p className="text-sm font-mono tracking-wider text-blue-900 bg-white/80 p-1 rounded-md">{selectedCert.userId.substring(0, 8)}...</p>
                  </div>
                </div>

                {/* Signature Area */}
                <div className="grid grid-cols-2 gap-8 mb-4 relative z-10 pt-4">
                  <div className="text-center">
                    <div className="mb-2">
                      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAAkCAYAAABCKP5eAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAF+0lEQVR4nO2afWhbVRTAf+fFrFvXdJ3dOrepm9M5QVenVfwAbWcVdOI/TsGBiNt0iE6nk2KdXxVEQRgWmjRFHfgBKogiiAO1HSidiopYnGyd62zXdq5ba9Kkyct9/pG8JC95SZrXpKn0B4G8d+8599yT+9659757nyilFAZDjmLlOgBDbjEJNuQ0JsGGnMYk2JDTmAQbchqTYENOYxJsyGlMgg05jUmwIacxCTbkNMMmWLkucQi0qxCH0K7CcXUdTnRQKD+xh/p5+XAVg+kRxo4XMlCGlXrRrkJsv4PXSvS1K9DbC4f15JBzLKA00iU6kPW4Mm2sDZVsxR/qRwzQx1AZVgmmTwzlcdDOA78lO1q6OPQluApCdV1gd4FdBfZ8x0EpP64dwiUH9zzx+YTgdwW3qGVMxTXchvJxVHuCNYAzqD1BjxIX+wuoJXbx2K/RJgCuQuMkONIlTI4z3cJV1B30DV24GlyrYCwUOEmiYW8ww0NW1bRBuCodlJx2F0y+4Nh3ow1CuyBnpbBZmPuLY+8NHm88wcm2cVVd8hJ7b3RwLrr4+hJoX0AtQaWs7SkVGu4i7TrE920oPq+RCbQ32KRdQE9FcmyGgcIMCo89DrEzw4tHN3eDPefG9mFOsALty61gZWQM5SLKGwj+FrxPRQ4ojwszcJggJ1g3QjKqA1eBCLcMFaA2olTQFuVh4chQEBjZCY71/IxA9wZwq1Jc7yYXlMdBNQZX3SjVl+z8lkH7HdT8YXpYd9A9wcNZxhJIXk+wDgQCjzA6qNi9IFWlQmhNugNW4vVZOdYO6pJQ3enoYI2qs4MJ6lJANcUfUQFQjWBNDsbuBudVvT+U130iBd54O+nXGRWC9gYG9MSEvujBJ4C7A9QsxSCg231a22egZ4S3UQqcVeA+HnlmKwfVjDCK/K6R7YmufYCpUfnTHvDWR9pYubrrg0JHRXwNZiY3GgRFc5IQuxEpz5UU0Isd4IjOBY2NeVsVeCvwP11vdYW72fF+UJ4l3RxTozrJNk7CdWLAEpx1gh2F2RlLXxJkjzTUQl+CvQHcjSipUBlKkX5e+fsjb1+gAcv45MYYO8F9fF6G9UyBUKEcVjYIxFvhFJhVtOhS5ZmJdZAOSXz7n8EaORc2+zQTZZz7hKO6gmvn2tnuvYK87pzIBnqdYK+mQSiXLLs7JZntOLHPHs7QV4UtJ4C9ZWBfmSCZu1n2xUZW0eMJp2Aw9wslzz1BKbZ2hd8byBXhlvT4dZcUAeGi8+pR3oDYeYlhJHY5RCb2u0PuRRsGH5PgkU5GBUY++hkpK19GhpHnrE7l5D06lbKMZhqTYENOYxJsyGlMgg05jUmwIacxCTbkNCbBhpzGJNiQ05gEG3IaK9cBZIpuw18+1zGwb/uYAe/RoULR7eK8bfsTrtu3l7uDXrf/1c+NeTnmI05WJ7izs5P169fT2toKwI4dO2hubmbSpElpH2v16tV0dnYCsHPnzozjycaYJwN7eCc4s//4YFV8gCNlsNdJVif40qVLrF27lgMHDsSUd3V10dDQQEtLCxMnTkzpOJs2baKurm7Y4szGmBUVFezevRtHdvTrAc5H0uOYJLg+ItEDbS+rEzx+/HgaGxspLy+PKa+traWhoYHt27fT3Nw84DFaW1vZtGnTZRlLrJGR4MRjJtsvF9mdYEtRUlKSUF5cXExJSQm9vb0DtneK/6NRXiwXXP2Ik+qY4+Yd2aGBpfTwXUr1Wa9TdoC7YCsxsZUlte1SieMykdUJPnnyJEuWLElYR9fV1dHV1UVt7c//9bq1tTXu3p1tnDgxD7jydjI9P8UE92csPaaUxN9X1Uz3r3I+IfhVBhMKnL5vO7WP7GL/rQejTi73lOVfR0nvzymFEeIyEZs/K0Yfg50Ys+9U/YvR1NQ04PpbKUVbW9tljyRVMRqyRNRcJNOm5CAXP10QV15/7x7+bGhEO/6r3I+cw8rCYQbZO3nDyKCzNHJ2bNQm2DCysd1cxyMoD1gXBtgqpyV7lxB22/t+tCfxjjaMHKxXOlGnQF0YvDX0mFG0Iacx/4s25DT/AJQIbVQPZIA+AAAAAElFTkSuQmCC" alt="Signature" className="mx-auto h-14" />
                    </div>
                    <p className="font-semibold text-blue-900 text-sm">Chief Executive Officer</p>
                    <p className="text-xs text-blue-600">Pro Course</p>
                  </div>

                  <div className="text-center">
                    <div className="mb-2">
                      <img src="data:image/png;base64,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" alt="Signature" className="mx-auto h-14" />
                    </div>
                    <p className="font-semibold text-blue-900 text-sm">Educational Programs Director</p>
                    <p className="text-xs text-blue-600">Pro Course</p>
                  </div>
                </div>

                {/* Legal Text */}
                <div className="text-center text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2 max-w-xl mx-auto relative z-10">
                  This is an official certificate that serves as proof of passing the specified examination. This certificate complies with Pro Course global standards for professional qualification.
                  <br/><span className="font-mono text-[8px] tracking-widest mt-1 inline-block opacity-70">SER-AUTH-PRO-CERT-ISO9001-2023-V2</span>
                </div>

                {/* Certificate Gold Seal */}
                <div className="absolute bottom-14 right-10 w-36 h-36">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 opacity-80 flex items-center justify-center shadow-inner relative overflow-hidden">
                      <div className="absolute inset-2 rounded-full border-2 border-yellow-200 opacity-40"></div>
                      <div className="absolute inset-0 bg-yellow-300 opacity-20"></div>

                      {/* Gold Seal Content */}
                      <div className="text-center relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 mx-auto text-yellow-800 opacity-70 mb-1">
                          <path d="M12 2a10 10 0 0 0-6.88 17.28L11 13l5.83 2.8A10 10 0 0 0 12 2z"></path>
                          <path d="M15.83 15.8 11 13l-7 6.95c1.91 1.31 4.22 2.05 6.64 2.05 4.31 0 8.08-2.28 10.19-5.67z"></path>
                          <path d="m14 13 4.74-4.74A10 10 0 0 0 12 2v11h2z"></path>
                        </svg>
                        <div className="text-yellow-900 font-bold text-xs leading-tight">PRO COURSE</div>
                        <div className="text-yellow-900 text-[10px] font-medium">VERIFIED</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Border Corners - More Decorative */}
                <div className="absolute top-3 left-3 w-20 h-20 border-l-4 border-t-4 border-blue-700/40 rounded-tl-lg pointer-events-none"></div>
                <div className="absolute top-3 right-3 w-20 h-20 border-r-4 border-t-4 border-blue-700/40 rounded-tr-lg pointer-events-none"></div>
                <div className="absolute bottom-3 left-3 w-20 h-20 border-l-4 border-b-4 border-blue-700/40 rounded-bl-lg pointer-events-none"></div>
                <div className="absolute bottom-3 right-3 w-20 h-20 border-r-4 border-b-4 border-blue-700/40 rounded-br-lg pointer-events-none"></div>

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-blue-100 text-[150px] font-serif opacity-5 select-none transform -rotate-12">Pro</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={downloadCertificate}>
                Download Certificate (PDF)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}