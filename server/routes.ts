import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import crypto from "crypto";

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
  app.post("/api/auth/login", async (req, res) => {
    const { email, userId } = req.body;

    try {
      const user = await storage.getUserByEmailAndId(email, userId);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user in session
      (req.session as any).user = user;
      
      return res.status(200).json(user);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/check", (req, res) => {
    const user = (req.session as any).user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.status(200).json(user);
  });

  // Middleware to protect routes
  const requireAuth = (req, res, next) => {
    const user = (req.session as any).user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Exam routes
  app.get("/api/exams/available", requireAuth, async (req, res) => {
    try {
      const exams = await storage.getAvailableExams();
      return res.status(200).json(exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/exams/current", requireAuth, async (req, res) => {
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

  app.post("/api/exams/submit", requireAuth, async (req, res) => {
    const { examId, answers } = req.body;
    const user = (req.session as any).user;

    try {
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
  app.get("/api/certificates", requireAuth, async (req, res) => {
    const user = (req.session as any).user;
    
    try {
      const certificates = await storage.getCertificatesByUserId(user.id);
      return res.status(200).json(certificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/certificates/search", requireAuth, async (req, res) => {
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
  app.get("/api/user/stats", requireAuth, async (req, res) => {
    const user = (req.session as any).user;
    
    try {
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
