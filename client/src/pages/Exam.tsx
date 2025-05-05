import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import TabNavigation from "@/components/TabNavigation";
import ExamTimer from "@/components/ExamTimer";
import ExamCompleteModal from "@/components/ExamCompleteModal";
import { Exam as ExamType, Question } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

export default function Exam() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [examResult, setExamResult] = useState({ score: 0, passed: false, passingScore: 70 });
  const { toast } = useToast();

  const { data: exam, isLoading, error } = useQuery<ExamType>({
    queryKey: ['/api/exams/current'],
    enabled: isExamStarted,
  });

  useEffect(() => {
    // Reset exam state when component mounts
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsExamCompleted(false);
    setIsExamStarted(false);
  }, []);

  const startExam = () => {
    setIsExamStarted(true);
  };

  const handleQuestionChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentQuestionIndex < (exam?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerIndex,
    });
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmitExam = async () => {
    if (!exam) return;
    
    try {
      const response = await apiRequest('POST', '/api/exams/submit', {
        examId: exam.id,
        answers: selectedAnswers,
      });
      
      const result = await response.json();
      setExamResult({
        score: result.score,
        passed: result.passedExam,
        passingScore: exam.passingScore,
      });
      setIsExamCompleted(true);
      
      toast({
        title: result.passedExam ? "Exam Passed!" : "Exam Completed",
        description: `Your score: ${result.score}%. ${result.passedExam ? "Congratulations!" : ""}`,
        variant: result.passedExam ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error submitting exam",
        description: "There was a problem submitting your exam. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTimeUp = () => {
    handleSubmitExam();
  };

  if (!isExamStarted) {
    return (
      <div>
        <TabNavigation />
        <Card>
          <CardHeader className="bg-primary text-white">
            <h2 className="text-xl font-bold">Programming Certification Exam</h2>
            <p className="text-sm text-gray-300 mt-1">60 questions in 60 minutes</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      Once you start the exam, a timer will begin counting down from 60 minutes. You cannot pause the exam once started.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Exam Rules:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>The exam consists of 60 multiple-choice questions</li>
                  <li>You have 60 minutes to complete the exam</li>
                  <li>You may navigate freely between questions</li>
                  <li>A passing score of 70% is required to obtain certification</li>
                  <li>Once submitted, you cannot retake the exam immediately</li>
                </ul>
              </div>
              
              <Button onClick={startExam} className="w-full md:w-auto">
                Start Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <TabNavigation />
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4 w-1/2 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded mb-2.5 w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded mb-2.5 w-3/4 mx-auto"></div>
            </div>
            <p className="mt-4 text-gray-500">Loading exam...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div>
        <TabNavigation />
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading exam. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion: Question = exam.questions[currentQuestionIndex];
  
  return (
    <div>
      <TabNavigation />
      <Card>
        <CardHeader className="bg-primary px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h2 className="text-xl font-bold text-white mb-4 sm:mb-0">{exam.title}</h2>
          <ExamTimer 
            duration={exam.duration} 
            onTimeUp={handleTimeUp} 
            isRunning={isExamStarted && !isExamCompleted}
          />
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Question {currentQuestionIndex + 1} of {exam.totalQuestions}</h3>
              <span className="text-sm text-gray-500">Category: {currentQuestion.category}</span>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-800 mb-4">{currentQuestion.text}</p>
              
              <RadioGroup 
                value={selectedAnswers[currentQuestion.id]?.toString()} 
                onValueChange={(value) => handleAnswerSelect(currentQuestion.id, parseInt(value))}
                className="space-y-3"
              >
                {currentQuestion.options.map((option, idx) => (
                  <div key={idx} className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                    <RadioGroupItem id={`option-${idx}`} value={idx.toString()} className="mt-1 mr-3" />
                    <Label htmlFor={`option-${idx}`} className="text-gray-700 cursor-pointer">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="flex justify-between mt-8">
              <Button 
                variant="secondary" 
                onClick={() => handleQuestionChange('prev')}
                disabled={currentQuestionIndex === 0}
              >
                <i className="fas fa-arrow-left mr-2"></i> Previous
              </Button>
              <Button 
                onClick={() => handleQuestionChange('next')}
                disabled={currentQuestionIndex === exam.questions.length - 1}
              >
                Next <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </div>
          </div>
          
          <div className="mt-8 border-t pt-6">
            <h4 className="text-md font-medium mb-3">Question Navigation</h4>
            <div className="grid grid-cols-10 gap-2">
              {exam.questions.map((_, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={currentQuestionIndex === index ? "default" : selectedAnswers[exam.questions[index].id] !== undefined ? "outline" : "ghost"}
                  className={`h-8 w-8 p-0 ${selectedAnswers[exam.questions[index].id] !== undefined ? "bg-gray-100" : ""}`}
                  onClick={() => handleJumpToQuestion(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSubmitExam}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Exam
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <ExamCompleteModal 
        isOpen={isExamCompleted}
        onClose={() => setIsExamCompleted(false)}
        score={examResult.score}
        passingScore={examResult.passingScore}
        passed={examResult.passed}
      />
    </div>
  );
}
