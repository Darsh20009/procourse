import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { User, Exam, Question, Certificate, UserExamResponse } from "../client/src/lib/types";

// Paths to data files
const DATA_DIR = path.join(process.cwd(), "server", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const EXAMS_FILE = path.join(DATA_DIR, "exams.json");
const CERTIFICATES_FILE = path.join(DATA_DIR, "certificates.json");

// Paths to special exam files
const JAVA_EXAM_FILE = path.join(DATA_DIR, "java_exam.json");
const JAVASCRIPT_EXAM_FILE = path.join(DATA_DIR, "javascript_exam.json");
const PYTHON_EXAM_FILE = path.join(DATA_DIR, "python_exam.json");
const PHP_EXAM_FILE = path.join(DATA_DIR, "php_exam.json");
const CPP_EXAM_FILE = path.join(DATA_DIR, "cpp_exam.json");
const ORACLE_EXAM_FILE = path.join(DATA_DIR, "orcale-apex_exam.json");
const HTML_EXAM_FILE = path.join(DATA_DIR, "html_exam.json");
const SQL_EXAM_FILE = path.join(DATA_DIR, "sql_exam.json");
const MATLAB_EXAM_FILE = path.join(DATA_DIR, "matlab_exam.json");
const CSHARP_EXAM_FILE = path.join(DATA_DIR, "csharp_exam.json");

// Ensure data directory exists
async function ensureDataDirExists() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// Read data from JSON file (for arrays)
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

// Read a single object from JSON file
async function readJsonObject<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
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

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(user => user.email === email) || null;
  },

  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    try {
      const users = await this.getAllUsers();

      // Find users by email
      const user = users.find(user => user.email === email);

      if (!user) {
        return null;
      }

      // For existing users that might not have a password field yet
      if (!user.password) {
        // Handle existing test accounts (example@test.com and yusuf@example.com)
        if ((email === 'test@example.com' && password === 'password123') ||
            (email === 'yusuf@example.com' && password === 'password123')) {
          // Add password to these users
          user.password = password;
          await writeJsonFile(USERS_FILE, users);
          return user;
        }
        return null;
      }

      // Check if password matches
      if (user.password === password) {
        return user;
      }

      return null;
    } catch (error) {
      console.error("Error validating credentials:", error);
      return null;
    }
  },

  async createUser(userData: { name: string; email: string; password: string; preferredField?: string }): Promise<User> {
    const users = await this.getAllUsers();

    // Check if user with the same email already exists
    const existingUser = users.find(user => user.email === userData.email);
    if (existingUser) {
      throw new Error("البريد الإلكتروني مسجل بالفعل");
    }

    const newUser: User = { 
      id: crypto.randomUUID(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      preferredField: userData.preferredField
    };
    users.push(newUser);
    await writeJsonFile(USERS_FILE, users);
    return newUser;
  },

  // Special exam readers
  async getJavaExam(): Promise<Exam | null> {
    return await readJsonObject<Exam>(JAVA_EXAM_FILE);
  },

  async getJavaScriptExam(): Promise<Exam | null> {
    return await readJsonObject<Exam>(JAVASCRIPT_EXAM_FILE);
  },

  async getPythonExam(): Promise<Exam | null> {
    return await readJsonObject<Exam>(PYTHON_EXAM_FILE);
  },

  async getPHPExam(): Promise<Exam | null> {
    return await readJsonObject<Exam>(PHP_EXAM_FILE);
  },

  async getCPPExam(): Promise<Exam | null> {
    return await readJsonObject<Exam>(CPP_EXAM_FILE);
  },

  // Exam methods
  async getAllExams(): Promise<Exam[]> {
    // Get the standard exams
    const standardExams = await readJsonFile<Exam>(EXAMS_FILE);

    // Return all exams, not filtering Oracle APEX specifically
    return standardExams;
  },

  // This method gets all available exams based on the user ID and preferred field
  async getAvailableExamsForUser(userId: string): Promise<Exam[]> {
    const user = await this.getUserById(userId);
    if (!user) {
      return [];
    }

    const allExams = await this.getAllExams();

    // Filter exams based on user's preferredField
    return allExams.filter(exam => {
      // If user has a specific exam assignment, only show that
      if (user.assignedExamId) {
        return exam.id === user.assignedExamId;
      }

      // Map preferredField to exam IDs
      const examMapping: { [key: string]: string[] } = {
        'oracle_apex': ['exam-001'],
        'java': ['exam-004'],
        'javascript': ['exam-003'], 
        'python': ['exam-010'],
        'php': ['exam-007'],
        'cpp': ['exam-005'],
        'sql': ['exam-009'],
        'matlab': ['exam-008'],
        'csharp': ['exam-006'],
        'html_css': ['exam-002']
      };

      if (!user.preferredField) {
        return [];
      }

      // Get allowed exam IDs for user's preferred field
      const allowedExamIds = examMapping[user.preferredField] || [];
      return allExams.filter(exam => allowedExamIds.includes(exam.id));
    });
  },

  async getAvailableExams(): Promise<Omit<Exam, "questions">[]> {
    const exams = await this.getAllExams();
    return exams.map(({ questions, ...examWithoutQuestions }) => examWithoutQuestions);
  },

  // Helper method to limit exam to 30 questions and duration to 30 minutes
  limitExamQuestionsAndTime(exam: Exam): Exam {
    if (!exam) return exam;

    // Create a copy of the exam to avoid modifying the original
    const modifiedExam = { ...exam };

    // If more than 30 questions, select only 30 randomly
    if (modifiedExam.questions && modifiedExam.questions.length > 30) {
      // Shuffle questions using Fisher-Yates algorithm
      const shuffledQuestions = [...modifiedExam.questions];
      for (let i = shuffledQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
      }

      // Take only the first 30 questions
      modifiedExam.questions = shuffledQuestions.slice(0, 30);
      modifiedExam.totalQuestions = 30;
    }

    // Set duration to 30 minutes
    modifiedExam.duration = 30;

    return modifiedExam;
  },

  async getExamById(examId: string): Promise<Exam | null> {
    console.log("Looking for exam:", examId);

    // Get exam based on ID
    let exam = null;
    
    // First try to get exam from specific file
    const examFiles: { [key: string]: string } = {
      'exam-001': ORACLE_EXAM_FILE,
      'exam-004': JAVA_EXAM_FILE, 
      'exam-003': JAVASCRIPT_EXAM_FILE,
      'exam-010': PYTHON_EXAM_FILE,
      'exam-007': PHP_EXAM_FILE,
      'exam-005': CPP_EXAM_FILE
    };

    if (examId in examFiles) {
      exam = await readJsonObject<Exam>(examFiles[examId]);
    }

    // If not found, check standard exams
    if (!exam) {
      const exams = await this.getAllExams();
      exam = exams.find(e => e.id === examId) || null;
    }

    // Add default questions if none exist
    if (exam && (!exam.questions || exam.questions.length === 0)) {
      exam.questions = [
        {
          id: 1,
          text: "سؤال اختبار",
          options: ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
          correctAnswer: 0,
          category: "عام"
        }
      ];
    }

    if (!exam) {
      // Check special exams if not found
      if (examId === 'exam-java') {
        exam = await this.getJavaExam();
      } else if (examId === 'exam-javascript') {
        exam = await this.getJavaScriptExam();
      } else if (examId === 'exam-python') {
        exam = await this.getPythonExam();
      } else if (examId === 'exam-php') {
        exam = await this.getPHPExam();
      } else if (examId === 'exam-cpp') {
        exam = await this.getCPPExam();
      }
      
      if (!exam) {
        return null;
      }
    }

    // Apply 30 question/30 minute limit for all exams
    if (exam) {
      return this.limitExamQuestionsAndTime(exam);
    }

    return null;
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
    // Changed passing score to 50 as per client's request
    const passedExam = score >= 50;

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

  async generateCertificate(userId: string, examId: string, score = 0): Promise<Certificate> {
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

    // Generate a certificate number in the format specified (PRC-ORG-0123-*****)
    const date = new Date();
    const month = date.toLocaleString('en-US', { month: '2-digit' });
    const year = date.getFullYear().toString().substring(2);

    // Extract the first 3 letters of the exam title and capitalize
    const examCode = exam.title.split(" ")[0].substring(0, 3).toUpperCase();

    // Generate unique user-specific identifier (last 5 digits of user ID + sequential number)
    const userDigits = user.id.substring(Math.max(0, user.id.length - 5));
    const certCount = (await this.getCertificatesByUserId(user.id)).length + 1;
    const sequentialNum = certCount.toString().padStart(2, '0');

    const certificateNumber = `PRC-${examCode}-${month}${year}-${userDigits}${sequentialNum}`;

    // Create a new certificate - No expiry date as requested
    const newCertificate: Certificate = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      examId: exam.id,
      examTitle: exam.title,
      certificateNumber,
      issueDate: new Date().toISOString(),
      score: score, // Use the provided score or default to 85
    };

    certificates.push(newCertificate);
    await writeJsonFile(CERTIFICATES_FILE, certificates);

    return newCertificate;
  },

  // User stats
  async assignExamToUser(userId: string, examId: string): Promise<User | null> {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return null;
    
    users[userIndex] = {
      ...users[userIndex],
      assignedExamId: examId
    };
    
    await writeJsonFile(USERS_FILE, users);
    return users[userIndex];
  },

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