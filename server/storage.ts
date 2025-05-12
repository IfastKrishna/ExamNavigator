import {
  users,
  academies,
  exams,
  questions,
  options,
  enrollments,
  attempts,
  certificates,
  certificateTemplates,
  examPurchases,
  type User,
  type InsertUser,
  type Academy,
  type InsertAcademy,
  type Exam,
  type InsertExam,
  type Question,
  type InsertQuestion,
  type Option,
  type InsertOption,
  type Enrollment,
  type InsertEnrollment,
  type Attempt,
  type InsertAttempt,
  type Certificate,
  type InsertCertificate,
  type CertificateTemplate,
  type InsertCertificateTemplate,
  type ExamPurchase,
  type InsertExamPurchase,
  UserRole,
} from "@shared/schema";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { DBStorage } from "./db-service";
import { neon } from "@neondatabase/serverless";

const PgStore = pgSession(session);
const dbUrl = process.env.DATABASE_URL || "";

// Create session store that persists between server restarts
const sessionStore = new PgStore({
  conString: dbUrl,
  tableName: "session", // Use custom table name
  createTableIfMissing: true, // Automatically create the session table if it doesn't exist
  pruneSessionInterval: 172800, // Cleanup every 48h (in seconds)
});

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // Academy methods
  createAcademy(academy: InsertAcademy): Promise<Academy>;
  getAcademy(id: number): Promise<Academy | undefined>;
  getAcademies(): Promise<Academy[]>;
  getAcademyByUserId(userId: number): Promise<Academy | undefined>;
  updateAcademy(
    id: number,
    academy: Partial<Academy>
  ): Promise<Academy | undefined>;

  // Exam methods
  createExam(exam: InsertExam): Promise<Exam>;
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByAcademy(academyId: number): Promise<Exam[]>;
  getAllExams(): Promise<Exam[]>;
  updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined>;

  // Question methods
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByExam(examId: number): Promise<Question[]>;
  updateQuestion(
    id: number,
    question: Partial<Question>
  ): Promise<Question | undefined>;

  // Option methods
  createOption(option: InsertOption): Promise<Option>;
  getOption(id: number): Promise<Option | undefined>;
  getOptionsByQuestion(questionId: number): Promise<Option[]>;

  // Enrollment methods
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByExam(examId: number): Promise<Enrollment[]>;
  updateEnrollment(
    id: number,
    enrollment: Partial<Enrollment>
  ): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<void>;

  // Attempt methods
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  getAttemptsByEnrollment(enrollmentId: number): Promise<Attempt[]>;

  // Certificate Template methods
  createCertificateTemplate(
    template: InsertCertificateTemplate
  ): Promise<CertificateTemplate>;
  getCertificateTemplate(id: number): Promise<CertificateTemplate | undefined>;
  getCertificateTemplates(): Promise<CertificateTemplate[]>;
  getDefaultCertificateTemplate(): Promise<CertificateTemplate | undefined>;
  updateCertificateTemplate(
    id: number,
    template: Partial<CertificateTemplate>
  ): Promise<CertificateTemplate | undefined>;

  // Certificate methods
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificatesByStudent(studentId: number): Promise<Certificate[]>;
  getCertificatesByAcademy(academyId: number): Promise<Certificate[]>;
  getCertificateByEnrollment(
    enrollmentId: number
  ): Promise<Certificate | undefined>;

  // Exam Purchase methods
  createExamPurchase(purchase: InsertExamPurchase): Promise<ExamPurchase>;
  getExamPurchase(id: number): Promise<ExamPurchase | undefined>;
  getExamPurchasesByAcademy(academyId: number): Promise<ExamPurchase[]>;
  getExamPurchasesByExam(examId: number): Promise<ExamPurchase[]>;
  getExamPurchaseByAcademyAndExam(
    academyId: number,
    examId: number
  ): Promise<ExamPurchase | undefined>;
  incrementUsedQuantity(purchaseId: number): Promise<ExamPurchase | undefined>;

  // Session store
  sessionStore: any;
}

// Create a new DBStorage instance with the session store
export const storage = new DBStorage(sessionStore);
