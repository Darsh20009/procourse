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
import { Download, Share2 } from "lucide-react";

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
      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#0F172A", // Match the certificate background color
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [210, 210], // Square format
      });
      
      // Calculate positioning to center the image
      const imgWidth = 200;
      const imgHeight = 200;
      const xPosition = (210 - imgWidth) / 2;
      const yPosition = (210 - imgHeight) / 2;
      
      pdf.addImage(imgData, "PNG", xPosition, yPosition, imgWidth, imgHeight);
      pdf.save(`Certificate-${certificateId}.pdf`);
      
      toast({
        title: "Certificate downloaded",
        description: "Your certificate has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download error",
        description: "Could not download certificate. Please try again.",
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
          <h2 className="text-xl font-bold text-white">My Certificates</h2>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Find Your Certificate</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search-name" className="mb-1">Name or Email</Label>
                <Input 
                  id="search-name" 
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Enter name or email"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="search-id" className="mb-1">ID Number</Label>
                <Input 
                  id="search-id" 
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter ID number"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full md:w-auto">
                  <i className="fas fa-search mr-2"></i> Search
                </Button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center p-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
              <p className="mt-4 text-gray-600">Loading certificates...</p>
            </div>
          ) : certificates && certificates.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium mb-4">Your Certificates</h3>
              
              {certificates.map((cert) => (
                <div key={cert.id} className="certificate-card bg-gray-50 rounded-lg border overflow-hidden mb-6 hover:shadow-md transition duration-200">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 p-4 flex justify-center items-center bg-primary-light">
                      <div id={`certificate-${cert.id}`} className="certificate rounded-lg overflow-hidden shadow-lg max-w-xs">
                        <div className="bg-primary-dark border border-gray-700 p-6 flex flex-col items-center justify-center text-center aspect-square">
                          <div className="flex items-center mb-2">
                            <div className="w-6 h-6 bg-gray-400 flex items-center justify-center mr-1">
                              <span className="text-primary text-xs font-bold">Q</span>
                            </div>
                            <div className="text-gray-400 text-sm font-bold">PRO COURSE</div>
                          </div>
                          <div className="text-gray-300 text-xl font-bold mb-3">CERTIFICATE</div>
                          <p className="text-gray-400 text-xs mb-2">This is to certify that</p>
                          <div className="text-white text-lg font-bold mb-2">{cert.userName}</div>
                          <p className="text-gray-400 text-xs mb-1">has successfully completed the programming certification in</p>
                          <div className="text-white text-lg font-bold mb-3">{cert.examTitle}</div>
                          <div className="flex justify-between w-full text-xs text-gray-500">
                            <div>
                              <div>Certificate number</div>
                              <div>{cert.certificateNumber}</div>
                              <div>{new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                            <div className="flex items-end">
                              <div className="ml-2 flex flex-col items-center">
                                <div className="text-xs">Certified</div>
                                <div className="rounded-full border border-gray-600 p-1 text-xs">ISO 9001:2015</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-2/3 p-6">
                      <h4 className="text-lg font-bold mb-2">{cert.examTitle} Certification</h4>
                      <div className="flex items-center mb-4">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium mr-2">Completed</span>
                        <span className="text-gray-500 text-sm">Issued on: {new Date(cert.issueDate).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="space-y-4 mb-6">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">Certificate ID</h5>
                          <p className="text-gray-900">{cert.certificateNumber}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">Certification Type</h5>
                          <p className="text-gray-900">Programming Certification</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">Status</h5>
                          <p className="text-gray-900">Valid (expires {new Date(cert.expiryDate).toLocaleDateString()})</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => downloadCertificate(cert.id)}
                          className="bg-accent hover:bg-accent-dark"
                        >
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => shareCertificate(cert.id)}
                        >
                          <Share2 className="mr-2 h-4 w-4" /> Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-500 mb-2">No certificates found</div>
              <p className="text-sm text-gray-600">Complete an exam to earn your certificate</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
