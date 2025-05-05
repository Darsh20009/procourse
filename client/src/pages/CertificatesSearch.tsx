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
              <div id="certificate-template" className="relative bg-white border-8 border-double border-primary/20 p-8 mx-auto text-center" style={{ minHeight: '500px' }}>
                {/* Certificate Header Logo */}
                <div className="flex justify-center mb-8">
                  <div className="bg-primary text-white rounded-full w-24 h-24 flex items-center justify-center text-4xl font-bold">
                    PRC
                  </div>
                </div>
                
                {/* Certificate Title */}
                <h1 className="text-3xl text-primary font-bold uppercase mb-2">شهادة اجتياز</h1>
                <h2 className="text-2xl text-gray-800 font-semibold mb-6">Pro Course Certification</h2>
                
                {/* Separator */}
                <div className="mx-auto w-1/2 h-1 bg-primary/60 mb-8"></div>
                
                {/* Certificate Text */}
                <div className="mb-8">
                  <p className="text-xl mb-4">تشهد منصة Pro Course أن</p>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">{selectedCert.userName}</h3>
                  <p className="text-xl mb-6">
                    قد أكمل بنجاح اختبار {selectedCert.examTitle} بنسبة نجاح{" "}
                    <span className="font-bold text-primary">{selectedCert.score}%</span>
                  </p>
                </div>
                
                {/* Certificate Details */}
                <div className="grid grid-cols-2 gap-8 mb-8 text-left">
                  <div>
                    <p className="text-gray-500 mb-1">رقم الشهادة</p>
                    <p className="text-lg font-semibold">{selectedCert.certificateNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">تاريخ الإصدار</p>
                    <p className="text-lg font-semibold">{formatDate(selectedCert.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">تاريخ الانتهاء</p>
                    <p className="text-lg font-semibold">{formatDate(selectedCert.expiryDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">رقم الهوية</p>
                    <p className="text-lg font-semibold">{selectedCert.userId.substring(0, 12)}...</p>
                  </div>
                </div>
                
                {/* Certificate Footer */}
                <div className="absolute bottom-8 left-0 right-0">
                  <div className="mx-auto w-1/3 h-0.5 bg-primary/40 mb-4"></div>
                  <p className="text-gray-500 text-sm">هذه الشهادة صالحة لمدة سنتين من تاريخ الإصدار</p>
                  <p className="text-gray-400 text-xs mt-2">للتحقق من صحة هذه الشهادة، يرجى زيارة موقعنا الإلكتروني</p>
                </div>
                
                {/* Certificate Seal/Stamp */}
                <div className="absolute bottom-16 right-10 rotate-12 opacity-30">
                  <div className="rounded-full border-2 border-primary w-24 h-24 flex items-center justify-center">
                    <div className="text-xs text-primary">ختم رسمي</div>
                  </div>
                </div>
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