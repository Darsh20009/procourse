import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { User, Exam, Question, Certificate, UserExamResponse } from "../client/src/lib/types";

// Paths to data files
const DATA_DIR = path.join(process.cwd(), "server", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const EXAMS_FILE = path.join(DATA_DIR, "exams.json");
const CERTIFICATES_FILE = path.join(DATA_DIR, "certificates.json");

// Ensure data directory exists
async function ensureDataDirExists() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// Read data from JSON file
async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T[];
  } catch (error) {
    // If file doesn't exist, create it with empty array
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.writeFile(filePath, JSON.stringify([]), "utf-8");
      return [];
    }
    throw error;
  }
}

// Write data to JSON file
async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDataDirExists();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export const storage = {
  // User methods
  async getAllUsers(): Promise<User[]> {
    return await readJsonFile<User>(USERS_FILE);
  },

  async getUserById(userId: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(user => user.id === userId) || null;
  },

  async getUserByEmailAndId(email: string, userId: string): Promise<User | null> {
    console.log("Looking for user with email and id:", { email, userId });
    const users = await this.getAllUsers();
    console.log("Available users:", users);
    const user = users.find(user => user.email === email && user.id === userId) || null;
    console.log("Found user:", user);
    return user;
  },

  async createUser(user: Omit<User, "id">): Promise<User> {
    const users = await this.getAllUsers();
    const newUser = { ...user, id: crypto.randomUUID() };
    users.push(newUser);
    await writeJsonFile(USERS_FILE, users);
    return newUser;
  },

  // Exam methods
  async getAllExams(): Promise<Exam[]> {
    return await readJsonFile<Exam>(EXAMS_FILE);
  },

  async getAvailableExams(): Promise<Omit<Exam, "questions">[]> {
    const exams = await this.getAllExams();
    return exams.map(({ questions, ...examWithoutQuestions }) => examWithoutQuestions);
  },

  async getExamById(examId: string): Promise<Exam | null> {
    const exams = await this.getAllExams();
    return exams.find(exam => exam.id === examId) || null;
  },

  async createExam(exam: Omit<Exam, "id">): Promise<Exam> {
    const exams = await this.getAllExams();
    const newExam = { ...exam, id: crypto.randomUUID() };
    exams.push(newExam);
    await writeJsonFile(EXAMS_FILE, exams);
    return newExam;
  },

  async submitExam(
    userId: string, 
    examId: string, 
    answers: { [key: number]: number }
  ): Promise<UserExamResponse> {
    const exam = await this.getExamById(examId);
    if (!exam) {
      throw new Error("Exam not found");
    }

    // Calculate score
    let correctAnswers = 0;
    exam.questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / exam.questions.length) * 100);
    const passedExam = score >= exam.passingScore;

    const response: UserExamResponse = {
      examId,
      userId,
      answers,
      score,
      passedExam,
      completedAt: new Date().toISOString(),
    };

    // In a real app, save the exam response
    // For simplicity, we're not persisting this data
    
    return response;
  },

  // Certificate methods
  async getAllCertificates(): Promise<Certificate[]> {
    return await readJsonFile<Certificate>(CERTIFICATES_FILE);
  },

  async getCertificateById(certificateId: string): Promise<Certificate | null> {
    const certificates = await this.getAllCertificates();
    return certificates.find(cert => cert.id === certificateId) || null;
  },

  async getCertificatesByUserId(userId: string): Promise<Certificate[]> {
    const certificates = await this.getAllCertificates();
    return certificates.filter(cert => cert.userId === userId);
  },

  async searchCertificates(name?: string, userId?: string): Promise<Certificate[]> {
    const certificates = await this.getAllCertificates();
    
    return certificates.filter(cert => {
      const nameMatch = !name || cert.userName.toLowerCase().includes(name.toLowerCase());
      const idMatch = !userId || cert.userId === userId;
      
      return nameMatch && idMatch;
    });
  },

  async generateCertificate(userId: string, examId: string): Promise<Certificate> {
    const user = await this.getUserById(userId);
    const exam = await this.getExamById(examId);
    
    if (!user || !exam) {
      throw new Error("User or exam not found");
    }
    
    const certificates = await this.getAllCertificates();
    
    // Check if certificate already exists
    const existingCert = certificates.find(
      cert => cert.userId === userId && cert.examId === examId
    );
    
    if (existingCert) {
      return existingCert;
    }
    
    // Generate a certificate number
    const date = new Date();
    const month = date.toLocaleString('en-US', { month: '2-digit' });
    const year = date.getFullYear().toString().substring(2);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const certificateNumber = `PC-${exam.title.substring(0, 3).toUpperCase()}-${month}${year}-${randomNum}`;
    
    // Create a new certificate
    const newCertificate: Certificate = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      examId: exam.id,
      examTitle: exam.title,
      certificateNumber,
      issueDate: new Date().toISOString(),
      expiryDate: new Date(date.setFullYear(date.getFullYear() + 2)).toISOString(), // Valid for 2 years
      score: 0, // This would come from the exam result
    };
    
    certificates.push(newCertificate);
    await writeJsonFile(CERTIFICATES_FILE, certificates);
    
    return newCertificate;
  },

  // User stats
  async getUserStats(userId: string): Promise<{
    examsCompleted: number;
    certificatesEarned: number;
    latestScore?: number;
  }> {
    const certificates = await this.getCertificatesByUserId(userId);
    
    return {
      examsCompleted: certificates.length,
      certificatesEarned: certificates.length,
      latestScore: certificates.length > 0 ? 86 : undefined, // Mock score
    };
  }
};
