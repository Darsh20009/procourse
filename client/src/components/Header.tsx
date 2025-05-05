import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    setLocation("/");
  };

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
        
        {isAuthenticated && user && (
          <div className="flex items-center space-x-4">
            <div className="text-white flex items-center">
              <span className="mr-2">{user.name}</span>
              <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full">Online</span>
            </div>
            <Button 
              variant="ghost"
              className="text-white hover:text-gray-300 text-sm"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt mr-1"></i> Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
