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
      let queryParams = new URLSearchParams();
      if (name) queryParams.append("name", name);
      if (userId) queryParams.append("userId", userId);
      
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

  // Download certificate as PDF
  const downloadCertificate = async () => {
    if (!selectedCert) return;
    
    const certificateElement = document.getElementById('certificate-template');
    if (!certificateElement) return;
    
    try {
      toast({
        title: "جاري إنشاء الشهادة",
        description: "يرجى الانتظار..."
      });
      
      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps= pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`certificate-${selectedCert.certificateNumber}.pdf`);
      
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
              <div id="certificate-template" className="relative bg-gradient-to-br from-white to-blue-50 border-8 border-double border-blue-700/20 p-8 mx-auto text-center" style={{ minHeight: '600px', maxWidth: '800px', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.08) 10%, transparent 10.5%), radial-gradient(circle at 70% 20%, rgba(14, 165, 233, 0.08) 8%, transparent 8.5%), radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.08) 15%, transparent 15.5%)' }}>
                {/* Top Border Design */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-700 via-blue-500 to-blue-700 opacity-90"></div>
                
                {/* Certificate Header Logo */}
                <div className="relative z-10 pt-10 mb-8">
                  <div className="bg-white border-4 border-blue-700 shadow-xl rounded-full w-28 h-28 mx-auto flex items-center justify-center">
                    <div className="bg-blue-700 text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold relative overflow-hidden">
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8),transparent_70%)]"></div>
                      PRC
                    </div>
                  </div>
                </div>
                
                {/* Certificate Title */}
                <div className="relative z-10">
                  <h1 className="text-4xl font-bold mb-2 text-blue-800" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>شهادة اجتياز</h1>
                  <h2 className="text-2xl text-blue-600 font-semibold mb-2">Pro Course Certification</h2>
                  
                  {/* Decorative Separator */}
                  <div className="flex items-center justify-center my-6">
                    <div className="h-px bg-blue-300 w-20"></div>
                    <div className="mx-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M12 2L20 7L12 12L4 7L12 2Z"></path>
                        <path d="M20 17L12 22L4 17"></path>
                        <path d="M20 12L12 17L4 12"></path>
                      </svg>
                    </div>
                    <div className="h-px bg-blue-300 w-20"></div>
                  </div>
                </div>
                
                {/* Certificate Text */}
                <div className="mb-10 relative z-10">
                  <p className="text-xl mb-5">تشهد منصة Pro Course أن</p>
                  <h3 className="text-4xl font-bold text-blue-900 mb-4" style={{ fontFamily: 'Arial, "Noto Sans Arabic", sans-serif' }}>{selectedCert.userName}</h3>
                  <p className="text-xl mb-6">
                    قد أكمل بنجاح اختبار <span className="font-bold text-blue-700">{selectedCert.examTitle}</span> بنسبة نجاح{" "}
                    <span className="font-bold text-blue-700">{selectedCert.score}%</span>
                  </p>
                </div>
                
                {/* Certificate Details in styled boxes */}
                <div className="grid grid-cols-2 gap-6 mb-12 mx-auto max-w-2xl relative z-10">
                  <div className="bg-white bg-opacity-60 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <p className="text-blue-800 font-semibold mb-1 text-sm">رقم الشهادة</p>
                    <p className="text-lg font-mono tracking-wider text-blue-900">{selectedCert.certificateNumber}</p>
                  </div>
                  <div className="bg-white bg-opacity-60 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <p className="text-blue-800 font-semibold mb-1 text-sm">تاريخ الإصدار</p>
                    <p className="text-lg text-blue-900">{formatDate(selectedCert.issueDate)}</p>
                  </div>
                  <div className="bg-white bg-opacity-60 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <p className="text-blue-800 font-semibold mb-1 text-sm">تاريخ الانتهاء</p>
                    <p className="text-lg text-blue-900">{formatDate(selectedCert.expiryDate)}</p>
                  </div>
                  <div className="bg-white bg-opacity-60 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <p className="text-blue-800 font-semibold mb-1 text-sm">معرف المستخدم</p>
                    <p className="text-lg font-mono tracking-wider text-blue-900">{selectedCert.userId.substring(0, 10)}...</p>
                  </div>
                </div>
                
                {/* Signature Area */}
                <div className="flex justify-end mb-8 relative z-10 pt-6 border-t border-blue-200">
                  <div className="text-center">
                    <div className="mb-2">
                      <svg width="120" height="40" viewBox="0 0 120 40" className="mx-auto">
                        <path d="M10,20 C20,10 30,30 40,20 C50,10 60,30 70,20 C80,10 90,30 100,20" stroke="#1e40af" fill="none" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="font-semibold text-blue-900">مدير المنصة</p>
                    <p className="text-sm text-blue-600">Pro Course Director</p>
                  </div>
                </div>
                
                {/* Certificate Footer */}
                <div className="absolute bottom-6 left-4 right-4 text-center">
                  <p className="text-blue-700 text-sm font-medium">هذه الشهادة صالحة لمدة سنتين من تاريخ الإصدار</p>
                  <p className="text-blue-500 text-xs mt-1">للتحقق من صحة هذه الشهادة، يرجى زيارة موقعنا واستخدام رقم الشهادة</p>
                </div>
                
                {/* Certificate Stamp/Seal */}
                <div className="absolute bottom-24 right-10 rotate-12">
                  <div className="w-32 h-32 relative">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-700 opacity-30"></div>
                    <div className="absolute inset-2 rounded-full border border-blue-600 opacity-20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-blue-800 opacity-40 font-semibold text-lg rotate-[-12deg]">
                        PRO COURSE
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-blue-800 opacity-30 text-xs rotate-[-12deg] mt-8">
                        OFFICIAL SEAL
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Corner Elements */}
                <div className="absolute top-20 left-8 w-16 h-16 border-l-2 border-t-2 border-blue-300 opacity-60"></div>
                <div className="absolute top-20 right-8 w-16 h-16 border-r-2 border-t-2 border-blue-300 opacity-60"></div>
                <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-blue-300 opacity-60"></div>
                <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-blue-300 opacity-60"></div>
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <Button onClick={downloadCertificate}>
                تحميل الشهادة (PDF)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}