import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TabNavigation from "@/components/TabNavigation";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { CalendarClock, CheckCircle, Award, BookOpen } from "lucide-react";

interface ExamSummary {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  
  const { data: availableExams, isLoading } = useQuery<ExamSummary[]>({
    queryKey: ['/api/exams/available'],
  });
  
  const { data: userStats } = useQuery<{
    examsCompleted: number;
    certificatesEarned: number;
    latestScore?: number;
  }>({
    queryKey: ['/api/user/stats'],
  });

  const handleStartExam = () => {
    setLocation("/exam");
  };

  return (
    <div>
      <TabNavigation />
      
      <div className="mb-8">
        <div className="bg-primary rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome, {user?.name || "Student"}</h1>
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
        
        {isLoading ? (
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
