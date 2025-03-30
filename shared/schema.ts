import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ACADEMY = "ACADEMY",
  STUDENT = "STUDENT"
}

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default(UserRole.STUDENT),
  createdAt: timestamp("created_at").defaultNow()
});

// Academies table
export const academies = pgTable("academies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  logo: text("logo"),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow()
});

// Exams table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  academyId: integer("academy_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  passingScore: doublePrecision("passing_score").notNull(), // percentage (0-100)
  price: doublePrecision("price").notNull().default(0),
  status: text("status").notNull().default("DRAFT"), // DRAFT, PUBLISHED, ARCHIVED
  examDate: timestamp("exam_date"), // scheduled date for the exam
  examTime: text("exam_time"), // scheduled time for the exam (e.g., "14:00")
  certificateTemplateId: integer("certificate_template_id"), // reference to certificate template
  manualReview: boolean("manual_review").notNull().default(false), // whether exam needs manual review
  createdAt: timestamp("created_at").defaultNow()
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  text: text("text").notNull(),
  type: text("type").notNull().default("MULTIPLE_CHOICE"), // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER
  points: integer("points").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow()
});

// Options table (for multiple choice questions)
export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Student-Exam enrollments
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  examId: integer("exam_id").notNull(),
  status: text("status").notNull().default("PURCHASED"), // PURCHASED, STARTED, COMPLETED, FAILED, PASSED
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  score: doublePrecision("score"),
  certificateId: text("certificate_id"),
  isAssigned: boolean("is_assigned").default(false), // Flag for students assigned by academies
  createdAt: timestamp("created_at").defaultNow()
});

// Attempted answers by students
export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull(),
  questionId: integer("question_id").notNull(),
  selectedOptionId: integer("selected_option_id"),
  textAnswer: text("text_answer"),
  isCorrect: boolean("is_correct"),
  createdAt: timestamp("created_at").defaultNow()
});

// Certificate Templates
export const certificateTemplates = pgTable("certificate_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  template: text("template").notNull(), // HTML/CSS template for certificate
  createdBy: integer("created_by").notNull(), // User ID of creator (Super Admin)
  isDefault: boolean("is_default").notNull().default(false),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE
  createdAt: timestamp("created_at").defaultNow()
});

// Certificates
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().unique(),
  studentId: integer("student_id").notNull(),
  examId: integer("exam_id").notNull(),
  academyId: integer("academy_id").notNull(),
  templateId: integer("template_id"), // Reference to certificate template
  certificateNumber: text("certificate_number").notNull().unique(),
  customizations: text("customizations"), // JSON string with any customizations
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// Academy Exam Purchases
export const examPurchases = pgTable("exam_purchases", {
  id: serial("id").primaryKey(),
  academyId: integer("academy_id").notNull(),
  examId: integer("exam_id").notNull(),
  quantity: integer("quantity").notNull().default(1), // Number of licenses purchased
  usedQuantity: integer("used_quantity").notNull().default(0), // Number of licenses assigned
  totalPrice: doublePrecision("total_price").notNull(), // Total price paid
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, EXPIRED, CANCELED
  expiryDate: timestamp("expiry_date"), // Optional expiry date
  paymentId: text("payment_id"), // Reference to payment/transaction ID
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true
});

export const insertAcademySchema = createInsertSchema(academies).pick({
  userId: true,
  name: true,
  description: true,
  logo: true,
  status: true
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  examId: true,
  text: true,
  type: true,
  points: true
});

export const insertOptionSchema = createInsertSchema(options).pick({
  questionId: true,
  text: true,
  isCorrect: true
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  studentId: true,
  examId: true,
  status: true,
  isAssigned: true
});

export const insertAttemptSchema = createInsertSchema(attempts).pick({
  enrollmentId: true,
  questionId: true,
  selectedOptionId: true,
  textAnswer: true,
  isCorrect: true
});

export const insertCertificateTemplateSchema = createInsertSchema(certificateTemplates).pick({
  name: true,
  description: true,
  template: true,
  createdBy: true,
  isDefault: true,
  status: true
});

export const insertCertificateSchema = createInsertSchema(certificates).pick({
  enrollmentId: true,
  studentId: true,
  examId: true,
  academyId: true,
  templateId: true,
  certificateNumber: true,
  customizations: true
});

// Update exam schema to include the new fields
export const insertExamSchema = createInsertSchema(exams).pick({
  academyId: true,
  title: true,
  description: true,
  duration: true,
  passingScore: true,
  price: true,
  status: true,
  examDate: true,
  examTime: true,
  certificateTemplateId: true,
  manualReview: true
});

// Exam purchase schema
export const insertExamPurchaseSchema = createInsertSchema(examPurchases).pick({
  academyId: true,
  examId: true,
  quantity: true,
  totalPrice: true,
  status: true,
  expiryDate: true,
  paymentId: true
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
export type InsertCertificateTemplate = z.infer<typeof insertCertificateTemplateSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type ExamPurchase = typeof examPurchases.$inferSelect;
export type InsertExamPurchase = z.infer<typeof insertExamPurchaseSchema>;
