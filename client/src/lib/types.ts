export interface User {
  id: string;
  email: string;
  name: string;
  preferredField?: string; // المجال المفضل للاختبار
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  totalQuestions: number;
  passingScore: number; // percentage
  questions: Question[];
}

export interface UserExamResponse {
  examId: string;
  userId: string;
  answers: { [key: number]: number };
  score: number;
  passedExam: boolean;
  completedAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  examId: string;
  examTitle: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate?: string; // Made optional for backward compatibility
  score: number;
}
