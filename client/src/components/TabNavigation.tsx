import { Link, useLocation } from "wouter";

interface TabNavigationProps {
  showLoginTab?: boolean;
}

export default function TabNavigation({ showLoginTab = false }: TabNavigationProps) {
  const [location] = useLocation();

  return (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {showLoginTab && (
            <Link href="/" className={`px-6 py-3 border-b-2 font-medium text-sm ${
              location === "/" 
                ? "border-accent text-accent" 
                : "border-transparent hover:border-gray-300 hover:text-gray-700"
            }`}>
              Login
            </Link>
          )}
          <Link href="/dashboard" className={`px-6 py-3 border-b-2 font-medium text-sm ${
            location === "/dashboard" 
              ? "border-accent text-accent" 
              : "border-transparent hover:border-gray-300 hover:text-gray-700"
          }`}>
            Dashboard
          </Link>
          <Link href="/exam" className={`px-6 py-3 border-b-2 font-medium text-sm ${
            location === "/exam" 
              ? "border-accent text-accent" 
              : "border-transparent hover:border-gray-300 hover:text-gray-700"
          }`}>
            Take Exam
          </Link>
          <Link href="/certificates" className={`px-6 py-3 border-b-2 font-medium text-sm ${
            location === "/certificates" 
              ? "border-accent text-accent" 
              : "border-transparent hover:border-gray-300 hover:text-gray-700"
          }`}>
            My Certificates
          </Link>
        </nav>
      </div>
    </div>
  );
}
