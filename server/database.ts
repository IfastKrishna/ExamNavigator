import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";

// Get the database URL from environment variables
const dbUrl = process.env.DATABASE_URL || "";
// console.log("Database URL:", dbUrl);

if (!dbUrl) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Create SQL client and connect to database
const sql = neon(dbUrl);
export const db = drizzle(sql, { schema });

// Function to initialize the database
export async function initializeDatabase() {
  console.log("Initializing database...");

  try {
    // Check if tables exist, create them if they don't

    // Create users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create academies table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS academies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        logo_url VARCHAR(255),
        website VARCHAR(255),
        location VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        "userId" INTEGER NOT NULL REFERENCES users(id),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create exams table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL,
        "passingScore" INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        "academyId" INTEGER NOT NULL REFERENCES academies(id),
        "examDate" TIMESTAMP,
        "examTime" VARCHAR(10),
        "certificateTemplateId" INTEGER,
        "manualReview" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create questions table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        points INTEGER NOT NULL,
        "examId" INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create options table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS options (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        "isCorrect" BOOLEAN NOT NULL,
        "questionId" INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create enrollments table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        "examId" INTEGER NOT NULL REFERENCES exams(id),
        "studentId" INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(20) NOT NULL,
        "startedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        score INTEGER,
        "certificateId" VARCHAR(255),
        "isAssigned" BOOLEAN,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create attempts table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS attempts (
        id SERIAL PRIMARY KEY,
        "enrollmentId" INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
        "questionId" INTEGER NOT NULL REFERENCES questions(id),
        "selectedOptionId" INTEGER REFERENCES options(id),
        "textAnswer" TEXT,
        "isCorrect" BOOLEAN,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create certificate_templates table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS certificate_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        template TEXT NOT NULL,
        "isDefault" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create certificates table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS certificates (
        id VARCHAR(255) PRIMARY KEY,
        "enrollmentId" INTEGER NOT NULL REFERENCES enrollments(id),
        "templateId" INTEGER REFERENCES certificate_templates(id),
        "issuedAt" TIMESTAMP NOT NULL,
        "expiresAt" TIMESTAMP,
        "academyId" INTEGER NOT NULL REFERENCES academies(id),
        "studentId" INTEGER NOT NULL REFERENCES users(id),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create exam_purchases table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS exam_purchases (
        id SERIAL PRIMARY KEY,
        "academyId" INTEGER NOT NULL REFERENCES academies(id),
        "examId" INTEGER NOT NULL REFERENCES exams(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        "usedQuantity" INTEGER NOT NULL DEFAULT 0,
        "totalPrice" DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "paymentId" VARCHAR(255),
        "expiryDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
