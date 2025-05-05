import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CheckCircle } from "lucide-react";

interface ExamCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  passingScore: number;
  passed: boolean;
}

export default function ExamCompleteModal({
  isOpen,
  onClose,
  score,
  passingScore,
  passed,
}: ExamCompleteModalProps) {
  const [_, setLocation] = useLocation();

  const handleViewCertificates = () => {
    onClose();
    setLocation("/certificates");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exam Completed</DialogTitle>
        </DialogHeader>
        
        <div className="mb-6">
          <div className="bg-green-50 text-green-800 p-4 rounded-md mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Your exam has been submitted successfully!</p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">Thank you for completing the certification exam. Your results have been processed.</p>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Exam Score</span>
              <span className="text-sm font-medium">{score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${passed ? 'bg-green-600' : 'bg-red-500'}`} 
                style={{ width: `${score}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">Passing score: {passingScore}%</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleViewCertificates}>
            View My Certificates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
