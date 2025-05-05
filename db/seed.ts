import { db } from "./index";
import * as schema from "@shared/schema";
import fs from "fs/promises";
import path from "path";

async function ensureDirectoryExists(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
  }
}

async function writeJsonFile<T>(filePath: string, data: T) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`File created: ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
}

async function seed() {
  try {
    // Create data directory
    const dataDir = path.join(process.cwd(), "server", "data");
    await ensureDirectoryExists(dataDir);

    // Seed users.json if it doesn't exist
    const usersFile = path.join(dataDir, "users.json");
    try {
      await fs.access(usersFile);
      console.log("Users file already exists, skipping...");
    } catch {
      const users = [
        {
          id: "2277131963",
          email: "yusuf@example.com",
          name: "Yusuf Mohamed"
        },
        {
          id: "1234567890",
          email: "test@example.com",
          name: "Test User"
        }
      ];
      await writeJsonFile(usersFile, users);
    }

    // Create sample APEX questions for exams.json
    const examsFile = path.join(dataDir, "exams.json");
    try {
      await fs.access(examsFile);
      console.log("Exams file already exists, skipping...");
    } catch {
      // See the full exam JSON content in server/data/exams.json
      const exams = [
        {
          id: "exam-001",
          title: "ORACLE APEX",
          description: "Certification exam for Oracle APEX application development",
          duration: 60,
          totalQuestions: 60,
          passingScore: 70,
          questions: []
        },
        {
          id: "exam-002",
          title: "Node.js Development",
          description: "Certification exam for Node.js application development",
          duration: 60,
          totalQuestions: 60,
          passingScore: 70,
          questions: []
        },
        {
          id: "exam-003",
          title: "React Framework",
          description: "Certification exam for React.js front-end development",
          duration: 60,
          totalQuestions: 60,
          passingScore: 70,
          questions: []
        }
      ];
      await writeJsonFile(examsFile, exams);
    }

    // Create certificates.json with Yusuf's certificate
    const certificatesFile = path.join(dataDir, "certificates.json");
    try {
      await fs.access(certificatesFile);
      console.log("Certificates file already exists, skipping...");
    } catch {
      const certificates = [
        {
          id: "cert-001",
          userId: "2277131963",
          userName: "Yusuf Mohamed",
          examId: "exam-001",
          examTitle: "ORACLE APEX",
          certificateNumber: "PC-ORA-0525-001",
          issueDate: "2025-05-05T10:30:00.000Z",
          expiryDate: "2027-05-05T10:30:00.000Z",
          score: 86
        }
      ];
      await writeJsonFile(certificatesFile, certificates);
    }
  } catch (error) {
    console.error("Seed error:", error);
  }
}

seed();
