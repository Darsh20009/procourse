import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import TabNavigation from "@/components/TabNavigation";
import { Certificate } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Download, Share2 } from "lucide-react";

export default function Certificates() {
  const [searchName, setSearchName] = useState("");
  const [searchId, setSearchId] = useState("");
  const { toast } = useToast();

  // Fetch user's certificates
  const { data: certificates, isLoading, refetch } = useQuery<Certificate[]>({
    queryKey: ['/api/certificates'],
  });

  // Function to handle certificate search
  const handleSearch = async () => {
    try {
      await refetch();
      toast({
        title: "Search completed",
        description: "Found your certificates",
      });
    } catch (error) {
      toast({
        title: "Search error",
        description: "Could not retrieve certificates. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to download certificate as PDF
  const downloadCertificate = async (certificateId: string) => {
    const certificateElement = document.getElementById(`certificate-${certificateId}`);
    if (!certificateElement) return;

    try {
      // Show loading toast
      toast({
        title: "جاري تحضير الشهادة",
        description: "يتم إنشاء ملف PDF للشهادة، يرجى الانتظار...",
      });
      
      // Enhanced rendering settings for higher quality output
      const canvas = await html2canvas(certificateElement, {
        scale: 4, // Higher scale for better quality
        logging: false,
        useCORS: true,
        backgroundColor: "#172554", // Match the blue certificate background color
        allowTaint: true,
        foreignObjectRendering: false,
      });
      
      const imgData = canvas.toDataURL("image/png", 1.0);
      
      // Create PDF with precise square dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [210, 210], // Square format exactly like the example
      });
      
      // Add blue background to match the certificate style
      pdf.setFillColor(23, 37, 84); // #172554 (blue-950)
      pdf.rect(0, 0, 210, 210, 'F');
      
      // Calculate positioning to perfectly center the image
      const imgWidth = 170; // Slightly smaller than the page for better margins
      const imgHeight = 170;
      const xPosition = (210 - imgWidth) / 2;
      const yPosition = (210 - imgHeight) / 2;
      
      // Add the certificate image
      pdf.addImage(imgData, "PNG", xPosition, yPosition, imgWidth, imgHeight);
      
      // Generate a meaningful filename that matches the certificate number
      const cert = certificates?.find(c => c.id === certificateId);
      let filename;
      
      if (cert) {
        // Use the certificate number format directly as the filename
        // This ensures consistency between the certificate number and the downloaded file
        filename = `${cert.certificateNumber}-${cert.userName.replace(/\s/g, "_")}.pdf`;
      } else {
        filename = `Certificate-${certificateId}.pdf`;
      }
      
      // Save the PDF
      pdf.save(filename);
      
      toast({
        title: "تم تنزيل الشهادة",
        description: "تم تنزيل الشهادة بنجاح.",
      });
    } catch (error) {
      console.error("Certificate download error:", error);
      toast({
        title: "خطأ في التنزيل",
        description: "تعذر تنزيل الشهادة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  // Function to share certificate (simulate)
  const shareCertificate = (certificateId: string) => {
    // In a real app, this would open a share dialog or copy a link
    toast({
      title: "Share functionality",
      description: "This would allow sharing your certificate via email or social media.",
    });
  };

  return (
    <div>
      <TabNavigation />
      <Card>
        <CardHeader className="bg-primary px-6 py-4">
          <h2 className="text-xl font-bold text-white">شهاداتي</h2>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">البحث عن الشهادات</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search-name" className="mb-1">الاسم أو البريد الإلكتروني</Label>
                <Input 
                  id="search-name" 
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="أدخل الاسم أو البريد الإلكتروني"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="search-id" className="mb-1">رقم الهوية</Label>
                <Input 
                  id="search-id" 
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="أدخل رقم الهوية"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full md:w-auto">
                  <i className="fas fa-search mr-2"></i> بحث
                </Button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center p-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
              <p className="mt-4 text-gray-600">جاري تحميل الشهادات...</p>
            </div>
          ) : certificates && certificates.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium mb-4">الشهادات الخاصة بك</h3>
              
              {certificates.map((cert) => (
                <div key={cert.id} className="certificate-card bg-gray-50 rounded-lg border overflow-hidden mb-6 hover:shadow-md transition duration-200">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 p-4 flex justify-center items-center bg-primary-light">
                      <div id={`certificate-${cert.id}`} className="certificate rounded overflow-hidden shadow-lg max-w-xs">
                        <div className="relative bg-gradient-to-br from-blue-900 to-blue-950 border border-blue-700/30 p-6 flex flex-col items-center justify-center text-center aspect-square">
                          {/* Background Pattern */}
                          <div className="absolute inset-0 opacity-5">
                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                          </div>
                          
                          {/* Certificate Border */}
                          <div className="absolute inset-3 border border-blue-400/10 rounded"></div>
                          
                          {/* PRO COURSE Logo */}
                          <div className="relative z-10 flex items-center mb-4">
                            <div className="w-8 h-8 bg-blue-300 flex items-center justify-center rounded-full mr-1">
                              <span className="text-blue-900 text-sm font-bold">PRO</span>
                            </div>
                            <div className="text-blue-300 text-sm font-bold tracking-wider">COURSE</div>
                          </div>
                          
                          {/* CERTIFICATE Title */}
                          <div className="relative z-10 text-blue-100 text-2xl font-bold mb-3 tracking-wider">شهادة اجتياز</div>
                          
                          {/* Decorative Line */}
                          <div className="relative z-10 w-24 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent mb-3"></div>
                          
                          {/* Certificate Content */}
                          <p className="relative z-10 text-blue-200 text-xs mb-2">تشهد منصة Pro Course أن</p>
                          <div className="relative z-10 text-white text-xl font-bold mb-2" style={{ fontFamily: 'Arial, "Noto Sans Arabic", sans-serif' }}>{cert.userName}</div>
                          <p className="relative z-10 text-blue-200 text-xs mb-1">قد أكمل بنجاح اختبار</p>
                          <div className="relative z-10 text-white text-lg font-bold mb-4">{cert.examTitle}</div>
                          <div className="relative z-10 text-blue-300 text-xs mb-4">بنسبة نجاح {cert.score}%</div>
                          
                          {/* Certificate Details */}
                          <div className="relative z-10 flex justify-between w-full text-xs mt-1">
                            <div className="text-right">
                              <div className="text-blue-300 text-[9px] mb-0.5">رقم الشهادة</div>
                              <div className="text-blue-100 text-xs mb-1 font-medium tracking-wide">{cert.certificateNumber}</div>
                              <div className="text-blue-300 text-[9px]">{new Date(cert.issueDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                            <div className="flex items-end">
                              <div className="flex flex-col items-center">
                                <div className="text-[10px] mb-1 text-blue-300">معتمدة</div>
                                <div className="rounded-full border border-blue-400/30 p-1 text-[8px] text-blue-200">CERT-PRO</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Signature */}
                          <div className="relative z-10 mt-4 text-blue-200 text-xs">
                            <div>مدير المنصة</div>
                            <svg width="70" height="20" viewBox="0 0 70 20" className="mx-auto my-1">
                              <path d="M5,10 C10,5 15,15 20,10 C25,5 30,15 35,10 C40,5 45,15 50,10 C55,5 60,15 65,10" stroke="rgb(147, 197, 253)" fill="none" strokeWidth="1" strokeLinecap="round" />
                            </svg>
                            <div>Pro Course Director</div>
                          </div>
                          
                          {/* Background Embellishments */}
                          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-2xl"></div>
                          <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 bg-blue-300/5 rounded-full blur-xl"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-2/3 p-6">
                      <h4 className="text-lg font-bold mb-2">شهادة {cert.examTitle}</h4>
                      <div className="flex items-center mb-4">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium mr-2">مكتملة</span>
                        <span className="text-gray-500 text-sm">تاريخ الإصدار: {new Date(cert.issueDate).toLocaleDateString('ar-EG')}</span>
                      </div>
                      
                      <div className="space-y-4 mb-3">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">رقم الشهادة</h5>
                          <p className="text-gray-900">{cert.certificateNumber}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">نوع الشهادة</h5>
                          <p className="text-gray-900">شهادة اختبار {cert.examTitle}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">الحالة</h5>
                          <p className="text-gray-900">سارية بشكل دائم</p>
                        </div>
                      </div>
                      
                      {/* Alert for certificate download */}
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
                        <div className="flex items-start">
                          <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <p>
                            <strong>تنبيه هام:</strong> يرجى تنزيل الشهادة وحفظها. قد يتم حذف الشهادات من النظام بعد فترة للحفاظ على الخصوصية.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 rtl:space-x-reverse">
                        <Button
                          onClick={() => downloadCertificate(cert.id)}
                          className="bg-accent hover:bg-accent-dark"
                        >
                          <Download className="mr-2 h-4 w-4" /> تنزيل الشهادة
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => shareCertificate(cert.id)}
                        >
                          <Share2 className="mr-2 h-4 w-4" /> مشاركة
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-500 mb-2">لم يتم العثور على شهادات</div>
              <p className="text-sm text-gray-600">أكمل اختبارًا للحصول على شهادتك</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
