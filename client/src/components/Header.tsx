import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Header() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  return (
    <header className="bg-primary shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="text-white font-bold text-xl flex items-center">
            <div className="w-8 h-8 bg-gray-400 flex items-center justify-center mr-2">
              <span className="text-primary font-bold">Q</span>
            </div>
            <span>PRO COURSE</span>
          </div>
        </div>
      </div>
    </header>
  );
}