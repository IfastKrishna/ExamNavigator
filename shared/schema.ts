import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ACADEMY = "ACADEMY",
  STUDENT = "STUDENT",
}

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default(UserRole.STUDENT),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Academies table
export const academies = pgTable("academies", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  website: text("website"),
  location: text("location"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("createdAt").defaultNow(),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE
});

// Exams table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  passingScore: doublePrecision("passingScore").notNull(), // percentage (0-100)
  price: doublePrecision("price").notNull().default(0),
  status: text("status").notNull().default("DRAFT"), // DRAFT, PUBLISHED, ARCHIVED
  examDate: timestamp("examDate"), // scheduled date for the exam
  examTime: text("examTime"), // scheduled time for the exam (e.g., "14:00")
  certificateTemplateId: integer("certificateTemplateId"), // reference to certificate template
  manualReview: boolean("manualReview").notNull().default(false), // whether exam needs manual review
  createdAt: timestamp("createdAt").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("examId").notNull(),
  text: text("text").notNull(),
  type: text("type").notNull().default("MULTIPLE_CHOICE"), // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER
  points: integer("points").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Options table (for multiple choice questions)
export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  questionId: integer("questionId").notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("isCorrect").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Student-Exam enrollments
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull(),
  examId: integer("examId").notNull(),
  status: text("status").notNull().default("PURCHASED"), // PURCHASED, STARTED, COMPLETED, FAILED, PASSED
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  score: doublePrecision("score"),
  certificateId: text("certificateId"),
  isAssigned: boolean("isAssigned").default(false), // Flag for students assigned by academies
  createdAt: timestamp("createdAt").defaultNow(),
});

// Attempted answers by students
export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollmentId").notNull(),
  questionId: integer("questionId").notNull(),
  selectedOptionId: integer("selectedOptionId"),
  textAnswer: text("textAnswer"),
  isCorrect: boolean("isCorrect"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Certificate Templates
export const certificateTemplates = pgTable("certificate_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  template: text("template").notNull(), // HTML/CSS template for certificate
  isDefault: boolean("isDefault").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Certificates
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollmentId").notNull().unique(),
  templateId: integer("templateId"), // Reference to certificate template
  issuedAt: timestamp("issuedAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt"),
  academyId: integer("academyId").notNull(),
  studentId: integer("studentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Academy Exam Purchases
export const examPurchases = pgTable("exam_purchases", {
  id: serial("id").primaryKey(),
  academyId: integer("academyId").notNull(),
  examId: integer("examId").notNull(),
  quantity: integer("quantity").notNull().default(1), // Number of licenses purchased
  usedQuantity: integer("usedQuantity").notNull().default(0), // Number of licenses assigned
  totalPrice: doublePrecision("totalPrice").notNull(), // Total price paid
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, EXPIRED, CANCELED
  paymentId: text("paymentId"), // Reference to payment/transaction ID
  expiryDate: timestamp("expiryDate"), // Optional expiry date
  createdAt: timestamp("createdAt").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
});

export const insertAcademySchema = createInsertSchema(academies).pick({
  userId: true,
  name: true,
  description: true,
  logoUrl: true,
  website: true,
  location: true,
  contactEmail: true,
  contactPhone: true,
  status: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  examId: true,
  text: true,
  type: true,
  points: true,
});

export const insertOptionSchema = createInsertSchema(options).pick({
  questionId: true,
  text: true,
  isCorrect: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  studentId: true,
  examId: true,
  status: true,
  isAssigned: true,
});

export const insertAttemptSchema = createInsertSchema(attempts).pick({
  enrollmentId: true,
  questionId: true,
  selectedOptionId: true,
  textAnswer: true,
  isCorrect: true,
});

export const insertCertificateTemplateSchema = createInsertSchema(
  certificateTemplates
).pick({
  name: true,
  description: true,
  template: true,
  isDefault: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).pick({
  enrollmentId: true,
  studentId: true,
  academyId: true,
  templateId: true,
  expiresAt: true,
});

// Update exam schema to include the new fields
export const insertExamSchema = createInsertSchema(exams).pick({
  title: true,
  description: true,
  duration: true,
  passingScore: true,
  price: true,
  status: true,
  examDate: true,
  examTime: true,
  certificateTemplateId: true,
  manualReview: true,
});

// Exam purchase schema
export const insertExamPurchaseSchema = createInsertSchema(examPurchases).pick({
  academyId: true,
  examId: true,
  quantity: true,
  usedQuantity: true,
  totalPrice: true,
  status: true,
  expiryDate: true,
  paymentId: true,
});

// Extended schema for question with options - used in frontend for forms
export const questionWithOptionsSchema = insertQuestionSchema.extend({
  text: z.string().min(5, "Question text must be at least 5 characters"),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
  points: z.coerce.number().min(1, "Points must be at least 1"),
  options: z
    .array(
      z.object({
        text: z.string().min(1, "Option text is required"),
        isCorrect: z.boolean().default(false),
      })
    )
    .optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Academy = typeof academies.$inferSelect;
export type InsertAcademy = z.infer<typeof insertAcademySchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Option = typeof options.$inferSelect;
export type InsertOption = z.infer<typeof insertOptionSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Attempt = typeof attempts.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;

export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type InsertCertificateTemplate = z.infer<
  typeof insertCertificateTemplateSchema
>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type ExamPurchase = typeof examPurchases.$inferSelect;
export type InsertExamPurchase = z.infer<typeof insertExamPurchaseSchema>;
