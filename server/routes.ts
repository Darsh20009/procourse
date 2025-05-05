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
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, userId } = req.body;
    
    console.log("Login attempt:", { email, userId });

    try {
      const user = await storage.getUserByEmailAndId(email, userId);
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
    const { email, userId } = req.body;
    
    console.log("Login attempt (alternate endpoint):", { email, userId });

    try {
      const user = await storage.getUserByEmailAndId(email, userId);
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
      
      let exams;
      
      // Get available exams based on user ID - will return different exams for Yusuf
      if (user.id === '2277131963') { // Yusuf
        // Get all available exams for Yusuf (including Java, JavaScript, Python)
        const fullExams = await storage.getAvailableExamsForUser(user.id);
        // Remove questions from the results
        exams = fullExams.map(({ questions, ...examWithoutQuestions }) => examWithoutQuestions);
      } else {
        // Get only standard exams for other users
        exams = await storage.getAvailableExams();
      }
      
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

      // Get exam ID from query parameters
      const { examId } = req.query;
      let targetExamId = examId as string;
      
      // If no specific exam ID provided, default to appropriate exam
      if (!targetExamId) {
        // Get available exams
        let availableExams;
        
        if (user.id === '2277131963') { // Yusuf
          // All exams for Yusuf (including Java, JavaScript, Python)
          const fullExams = await storage.getAvailableExamsForUser(user.id);
          availableExams = fullExams.map(({ questions, ...rest }) => rest);
        } else {
          // Standard exams for other users
          availableExams = await storage.getAvailableExams();
        }
        
        if (availableExams.length === 0) {
          return res.status(404).json({ message: "No exams available" });
        }
        
        // Default to first available exam
        targetExamId = availableExams[0].id;
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
      
      // If exam is passed, generate a certificate
      if (result.passedExam) {
        await storage.generateCertificate(user.id, examId);
      }
      
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
