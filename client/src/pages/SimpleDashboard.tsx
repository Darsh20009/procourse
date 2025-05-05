import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CalendarClock, CheckCircle, Award, BookOpen } from "lucide-react";
import TabNavigation from "@/components/TabNavigation";

// Simple User type
interface User {
  id: string;
  name: string;
  email: string;
}

interface ExamSummary {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
}

export default function SimpleDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_, setLocation] = useLocation();
  
  // Check auth status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking auth status...");
        const res = await fetch("/api/auth/check", {
          credentials: "include",
        });
        
        console.log("Auth check status:", res.status);
        
        if (res.ok) {
          const userData = await res.json();
          console.log("User authenticated:", userData);
          setUser(userData);
        } else {
          console.log("User not authenticated, redirecting to login");
          setUser(null);
          setLocation("/");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
        setLocation("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setLocation]);
  
  // Fetch available exams
  const { data: availableExams, isLoading: isLoadingExams } = useQuery<ExamSummary[]>({
    queryKey: ['/api/exams/available'],
    enabled: !!user, // Only fetch if user is logged in
  });
  
  // Fetch user stats
  const { data: userStats } = useQuery<{
    examsCompleted: number;
    certificatesEarned: number;
    latestScore?: number;
  }>({
    queryKey: ['/api/user/stats'],
    enabled: !!user, // Only fetch if user is logged in
  });

  const handleStartExam = () => {
    setLocation("/exam");
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If user is not authenticated (should redirect anyway)
  if (!user) {
    return null;
  }

  return (
    <div>
      <TabNavigation />
      
      <div className="mb-8">
        <div className="bg-primary rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome, {user.name}</h1>
          <p className="text-gray-300">Continue your certification journey with Pro Course</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-10 w-10 text-primary" />
              <div>
                <CardTitle className="text-2xl font-bold">{userStats?.examsCompleted || 0}</CardTitle>
                <p className="text-sm text-gray-500">Exams Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Award className="h-10 w-10 text-accent" />
              <div>
                <CardTitle className="text-2xl font-bold">{userStats?.certificatesEarned || 0}</CardTitle>
                <p className="text-sm text-gray-500">Certificates Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div>
                <CardTitle className="text-2xl font-bold">
                  {userStats?.latestScore !== undefined ? `${userStats.latestScore}%` : 'N/A'}
                </CardTitle>
                <p className="text-sm text-gray-500">Latest Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Available Exams</h2>
        
        {isLoadingExams ? (
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ) : availableExams && availableExams.length > 0 ? (
          <div className="space-y-4">
            {availableExams.map((exam) => (
              <Card key={exam.id}>
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <CardTitle className="mb-1">{exam.title}</CardTitle>
                    <CardDescription className="text-sm text-gray-600 mb-2">{exam.description}</CardDescription>
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarClock className="h-4 w-4 mr-1" />
                      <span>{exam.duration} minutes | {exam.totalQuestions} questions</span>
                    </div>
                  </div>
                  <Button onClick={handleStartExam}>
                    Take Exam
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No exams available at this time.</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Achievements</h2>
        {userStats?.certificatesEarned ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Certificate Earned</h3>
                  <p className="text-sm text-gray-600">You have earned a new certificate! View it in your certificates section.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Complete an exam to earn achievements.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}