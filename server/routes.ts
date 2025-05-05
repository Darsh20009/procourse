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

  // Exam routes
  app.get("/api/exams/available", requireAuth, async (req: Request, res: Response) => {
    try {
      const exams = await storage.getAvailableExams();
      return res.status(200).json(exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/exams/current", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get the first available exam for simplicity
      // In a real app, you might want to get a specific exam by ID
      const exams = await storage.getAvailableExams();
      if (exams.length === 0) {
        return res.status(404).json({ message: "No exams available" });
      }
      
      const exam = await storage.getExamById(exams[0].id);
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
