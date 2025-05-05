import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import crypto from "crypto";
import { User } from "../shared/schema";

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    user?: User;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    console.log("Login attempt:", { email });

    try {
      const user = await storage.validateUserCredentials(email, password);
      console.log("Login user found:", user);
      
      if (!user) {
        console.log("Login failed: Invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user in session
      req.session.user = user;
      console.log("User set in session:", user);
      
      return res.status(200).json(user);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Alias login - also support /api/login path
  app.post("/api/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    console.log("Login attempt (alternate endpoint):", { email });

    try {
      const user = await storage.validateUserCredentials(email, password);
      console.log("Login user found:", user);
      
      if (!user) {
        console.log("Login failed: Invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user in session
      req.session.user = user;
      console.log("User set in session:", user);
      
      return res.status(200).json(user);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  // Alias logout
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/check", (req: Request, res: Response) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.status(200).json(user);
  });

  // User registration endpoint
  app.post("/api/register", async (req: Request, res: Response) => {
    const { name, email, password, preferredField } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    
    try {
      // Create new user with preferred field and password
      const newUser = await storage.createUser({
        name, 
        email,
        password,
        preferredField: preferredField
      });
      
      // Remove password from response
      const userResponse = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        preferredField: newUser.preferredField
      };
      
      return res.status(201).json(userResponse);
    } catch (error) {
      console.error("User registration error:", error);
      if (error instanceof Error && error.message === "البريد الإلكتروني مسجل بالفعل") {
        return res.status(400).json({ message: "Email already registered" });
      }
      return res.status(500).json({ message: "Server error during registration" });
    }
  });
  
  // Middleware to protect routes
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Exam routes - filtered by user type/role
  app.get("/api/exams/available", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get all available exams for the user based on their ID and preferred field
      const fullExams = await storage.getAvailableExamsForUser(user.id);
      
      // Remove questions from the results
      const exams = fullExams.map(({ questions, ...examWithoutQuestions }) => examWithoutQuestions);
      
      console.log(`Filtered exams for user ${user.id}:`, exams);
      return res.status(200).json(exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/exams/current", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Generate certificate immediately when exam starts
      const certificate = await storage.generateCertificate(user.id, examId || 'exam-001', 0);

      // Get exam ID from query parameters
      const { examId } = req.query;
      let targetExamId = examId as string;
      
      // If no specific exam ID provided, default to appropriate exam
      if (!targetExamId) {
        // Get available exams based on user's preferred field
        const fullExams = await storage.getAvailableExamsForUser(user.id);
        const availableExams = fullExams.map(({ questions, ...rest }) => rest);
        
        console.log(`Available exams for user with preferredField=${user.preferredField}:`, availableExams);
        
        if (availableExams.length === 0) {
          return res.status(404).json({ message: "No exams available" });
        }
        
        // For Oracle APEX users, prioritize Oracle APEX exam
        if (user.preferredField === 'oracle_apex') {
          const oracleExam = availableExams.find(exam => 
            exam.title.toLowerCase().includes('oracle') || 
            exam.title.toLowerCase().includes('apex')
          );
          
          if (oracleExam) {
            console.log("Using Oracle APEX exam for Oracle user:", oracleExam.title);
            targetExamId = oracleExam.id;
          } else {
            // Default to first available exam if no Oracle exam found
            targetExamId = availableExams[0].id;
          }
        } else {
          // Default to first available exam for other users
          targetExamId = availableExams[0].id;
        }
      }
      
      // Get the full exam with questions
      const exam = await storage.getExamById(targetExamId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      console.log(`Selected exam for user ${user.id}:`, exam.title);
      return res.status(200).json(exam);
    } catch (error) {
      console.error("Error fetching current exam:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/exams/submit", requireAuth, async (req: Request, res: Response) => {
    const { examId, answers } = req.body;
    const user = req.session.user;

    // User is guaranteed to be defined because of requireAuth middleware
    try {
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const result = await storage.submitExam(user.id, examId, answers);
      
      // Update certificate with actual score
      await storage.updateCertificateScore(user.id, examId, result.score);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error submitting exam:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Certificate routes
  app.get("/api/certificates", requireAuth, async (req: Request, res: Response) => {
    const user = req.session.user;
    
    try {
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const certificates = await storage.getCertificatesByUserId(user.id);
      return res.status(200).json(certificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/certificates/search", requireAuth, async (req: Request, res: Response) => {
    const { name, userId } = req.query;
    
    try {
      const certificates = await storage.searchCertificates(
        name as string, 
        userId as string
      );
      return res.status(200).json(certificates);
    } catch (error) {
      console.error("Error searching certificates:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // User stats route
  app.get("/api/user/stats", requireAuth, async (req: Request, res: Response) => {
    const user = req.session.user;
    
    try {
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const stats = await storage.getUserStats(user.id);
      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
