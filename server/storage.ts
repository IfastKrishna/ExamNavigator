import { 
  users, academies, exams, questions, options, 
  enrollments, attempts, certificates,
  type User, type InsertUser,
  type Academy, type InsertAcademy,
  type Exam, type InsertExam,
  type Question, type InsertQuestion,
  type Option, type InsertOption,
  type Enrollment, type InsertEnrollment,
  type Attempt, type InsertAttempt,
  type Certificate, type InsertCertificate,
  UserRole
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  updateAcademy(id: number, academy: Partial<Academy>): Promise<Academy | undefined>;
  
  // Exam methods
  createExam(exam: InsertExam): Promise<Exam>;
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByAcademy(academyId: number): Promise<Exam[]>;
  updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined>;
  
  // Question methods
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByExam(examId: number): Promise<Question[]>;
  updateQuestion(id: number, question: Partial<Question>): Promise<Question | undefined>;
  
  // Option methods
  createOption(option: InsertOption): Promise<Option>;
  getOption(id: number): Promise<Option | undefined>;
  getOptionsByQuestion(questionId: number): Promise<Option[]>;
  
  // Enrollment methods
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByExam(examId: number): Promise<Enrollment[]>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined>;
  
  // Attempt methods
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  getAttemptsByEnrollment(enrollmentId: number): Promise<Attempt[]>;
  
  // Certificate methods
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificatesByStudent(studentId: number): Promise<Certificate[]>;
  getCertificatesByAcademy(academyId: number): Promise<Certificate[]>;
  getCertificateByEnrollment(enrollmentId: number): Promise<Certificate | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private academies: Map<number, Academy>;
  private exams: Map<number, Exam>;
  private questions: Map<number, Question>;
  private options: Map<number, Option>;
  private enrollments: Map<number, Enrollment>;
  private attempts: Map<number, Attempt>;
  private certificates: Map<number, Certificate>;
  sessionStore: session.SessionStore;
  
  private currentIds: {
    users: number;
    academies: number;
    exams: number;
    questions: number;
    options: number;
    enrollments: number;
    attempts: number;
    certificates: number;
  };

  constructor() {
    this.users = new Map();
    this.academies = new Map();
    this.exams = new Map();
    this.questions = new Map();
    this.options = new Map();
    this.enrollments = new Map();
    this.attempts = new Map();
    this.certificates = new Map();
    
    this.currentIds = {
      users: 1,
      academies: 1,
      exams: 1,
      questions: 1,
      options: 1,
      enrollments: 1,
      attempts: 1,
      certificates: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Create super admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$X.QRbdVQQrfQXSUzZ3xrqOY.9FBo8ycVj09/2om.QIY3SwIoHTMQm", // "password"
      email: "admin@examportal.com",
      name: "Super Admin",
      role: UserRole.SUPER_ADMIN
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUsersByRole(role: UserRole): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Academy methods
  async createAcademy(insertAcademy: InsertAcademy): Promise<Academy> {
    const id = this.currentIds.academies++;
    const now = new Date();
    const academy: Academy = { ...insertAcademy, id, createdAt: now };
    this.academies.set(id, academy);
    return academy;
  }
  
  async getAcademy(id: number): Promise<Academy | undefined> {
    return this.academies.get(id);
  }
  
  async getAcademies(): Promise<Academy[]> {
    return Array.from(this.academies.values());
  }
  
  async getAcademyByUserId(userId: number): Promise<Academy | undefined> {
    return Array.from(this.academies.values()).find(
      (academy) => academy.userId === userId
    );
  }
  
  async updateAcademy(id: number, academyData: Partial<Academy>): Promise<Academy | undefined> {
    const academy = this.academies.get(id);
    if (!academy) return undefined;
    
    const updatedAcademy = { ...academy, ...academyData };
    this.academies.set(id, updatedAcademy);
    return updatedAcademy;
  }
  
  // Exam methods
  async createExam(insertExam: InsertExam): Promise<Exam> {
    const id = this.currentIds.exams++;
    const now = new Date();
    const exam: Exam = { ...insertExam, id, createdAt: now };
    this.exams.set(id, exam);
    return exam;
  }
  
  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }
  
  async getExamsByAcademy(academyId: number): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(
      (exam) => exam.academyId === academyId
    );
  }
  
  async updateExam(id: number, examData: Partial<Exam>): Promise<Exam | undefined> {
    const exam = this.exams.get(id);
    if (!exam) return undefined;
    
    const updatedExam = { ...exam, ...examData };
    this.exams.set(id, updatedExam);
    return updatedExam;
  }
  
  // Question methods
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentIds.questions++;
    const now = new Date();
    const question: Question = { ...insertQuestion, id, createdAt: now };
    this.questions.set(id, question);
    return question;
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async getQuestionsByExam(examId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => question.examId === examId
    );
  }
  
  async updateQuestion(id: number, questionData: Partial<Question>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = { ...question, ...questionData };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  // Option methods
  async createOption(insertOption: InsertOption): Promise<Option> {
    const id = this.currentIds.options++;
    const now = new Date();
    const option: Option = { ...insertOption, id, createdAt: now };
    this.options.set(id, option);
    return option;
  }
  
  async getOption(id: number): Promise<Option | undefined> {
    return this.options.get(id);
  }
  
  async getOptionsByQuestion(questionId: number): Promise<Option[]> {
    return Array.from(this.options.values()).filter(
      (option) => option.questionId === questionId
    );
  }
  
  // Enrollment methods
  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.currentIds.enrollments++;
    const now = new Date();
    const enrollment: Enrollment = { 
      ...insertEnrollment, 
      id, 
      createdAt: now,
      startedAt: null,
      completedAt: null,
      score: null,
      certificateId: null
    };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }
  
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }
  
  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.studentId === studentId
    );
  }
  
  async getEnrollmentsByExam(examId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.examId === examId
    );
  }
  
  async updateEnrollment(id: number, enrollmentData: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...enrollmentData };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }
  
  // Attempt methods
  async createAttempt(insertAttempt: InsertAttempt): Promise<Attempt> {
    const id = this.currentIds.attempts++;
    const now = new Date();
    const attempt: Attempt = { ...insertAttempt, id, createdAt: now };
    this.attempts.set(id, attempt);
    return attempt;
  }
  
  async getAttemptsByEnrollment(enrollmentId: number): Promise<Attempt[]> {
    return Array.from(this.attempts.values()).filter(
      (attempt) => attempt.enrollmentId === enrollmentId
    );
  }
  
  // Certificate methods
  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const id = this.currentIds.certificates++;
    const now = new Date();
    const certificate: Certificate = { 
      ...insertCertificate, 
      id, 
      issueDate: now,
      createdAt: now 
    };
    this.certificates.set(id, certificate);
    return certificate;
  }
  
  async getCertificate(id: number): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }
  
  async getCertificatesByStudent(studentId: number): Promise<Certificate[]> {
    return Array.from(this.certificates.values()).filter(
      (certificate) => certificate.studentId === studentId
    );
  }
  
  async getCertificatesByAcademy(academyId: number): Promise<Certificate[]> {
    return Array.from(this.certificates.values()).filter(
      (certificate) => certificate.academyId === academyId
    );
  }
  
  async getCertificateByEnrollment(enrollmentId: number): Promise<Certificate | undefined> {
    return Array.from(this.certificates.values()).find(
      (certificate) => certificate.enrollmentId === enrollmentId
    );
  }
}

export const storage = new MemStorage();
