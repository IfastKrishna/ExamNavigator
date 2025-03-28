import { 
  users, academies, exams, questions, options, 
  enrollments, attempts, certificates, certificateTemplates,
  type User, type InsertUser,
  type Academy, type InsertAcademy,
  type Exam, type InsertExam,
  type Question, type InsertQuestion,
  type Option, type InsertOption,
  type Enrollment, type InsertEnrollment,
  type Attempt, type InsertAttempt,
  type Certificate, type InsertCertificate,
  type CertificateTemplate, type InsertCertificateTemplate,
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
  
  // Certificate Template methods
  createCertificateTemplate(template: InsertCertificateTemplate): Promise<CertificateTemplate>;
  getCertificateTemplate(id: number): Promise<CertificateTemplate | undefined>;
  getCertificateTemplates(): Promise<CertificateTemplate[]>;
  getDefaultCertificateTemplate(): Promise<CertificateTemplate | undefined>;
  updateCertificateTemplate(id: number, template: Partial<CertificateTemplate>): Promise<CertificateTemplate | undefined>;
  
  // Certificate methods
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificatesByStudent(studentId: number): Promise<Certificate[]>;
  getCertificatesByAcademy(academyId: number): Promise<Certificate[]>;
  getCertificateByEnrollment(enrollmentId: number): Promise<Certificate | undefined>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private academies: Map<number, Academy>;
  private exams: Map<number, Exam>;
  private questions: Map<number, Question>;
  private options: Map<number, Option>;
  private enrollments: Map<number, Enrollment>;
  private attempts: Map<number, Attempt>;
  private certificateTemplates: Map<number, CertificateTemplate>;
  private certificates: Map<number, Certificate>;
  sessionStore: any;
  
  private currentIds: {
    users: number;
    academies: number;
    exams: number;
    questions: number;
    options: number;
    enrollments: number;
    attempts: number;
    certificateTemplates: number;
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
    this.certificateTemplates = new Map();
    this.certificates = new Map();
    
    this.currentIds = {
      users: 1,
      academies: 1,
      exams: 1,
      questions: 1,
      options: 1,
      enrollments: 1,
      attempts: 1,
      certificateTemplates: 1,
      certificates: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Create super admin user with a properly hashed password using our hashing function
    // The password is set to "admin123" for easy access
    this.createUser({
      username: "admin",
      password: "70c9d83b95543315edd30b5157e75e5b2afe3c72c85e0d0a3341cd14ce2a60ce8d05225afa34b2d4f43c21bd64f03deade4d97b4daa8b168a367faa0af9d667e.41f93f2d87f62d60d5b70e91a7511f61", // "admin123"
      email: "admin@examportal.com",
      name: "Super Admin",
      role: UserRole.SUPER_ADMIN
    }).then(adminUser => {
      // Create a default certificate template
      this.createCertificateTemplate({
        name: "Classic Certificate",
        description: "Elegant certificate template with formal styling",
        template: `
          <div class="certificate" style="font-family: 'Times New Roman', serif; width: 800px; height: 600px; padding: 50px; text-align: center; border: 10px solid #1976D2; position: relative;">
            <div style="width: 750px; height: 550px; padding: 20px; text-align: center; border: 5px solid #2196F3; background-color: white;">
              <div style="text-align: center; margin-top: 20px;">
                <span style="font-size: 50px; font-weight: bold; color: #0D47A1;">Certificate of Completion</span>
              </div>
              <div style="margin: 30px 0;">
                <span style="font-size: 25px;"><i>This is to certify that</i></span>
                <br><br>
                <span style="font-size: 30px; font-weight: bold; color: #0D47A1;">{{studentName}}</span><br/><br/>
                <span style="font-size: 25px;"><i>has successfully completed the</i></span> <br/><br/>
                <span style="font-size: 30px; font-weight: bold; color: #0D47A1;">{{examTitle}}</span> <br/><br/>
                <span style="font-size: 20px;">with a score of <b>{{score}}%</b></span> <br/><br/>
                <span style="font-size: 20px;">Date: {{issueDate}}</span>
              </div>
              <div style="margin: 40px 0 0 0;">
                <div style="width: 200px; float: left; margin-left: 50px; text-align: center;">
                  <img src="{{academyLogo}}" alt="Academy Logo" style="width: 100px; height: auto;"><br>
                  <span style="font-size: 16px;">{{academyName}}</span>
                </div>
                <div style="width: 200px; float: right; margin-right: 50px; text-align: center;">
                  <img src="data:image/png;base64,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" alt="Signature" style="width: 150px; height: auto;"><br>
                  <span style="font-size: 16px;">Authorized Signature</span>
                </div>
              </div>
              <div style="clear: both; margin-top: 30px; text-align: center;">
                <span style="font-size: 14px;">Certificate ID: {{certificateNumber}}</span>
              </div>
            </div>
          </div>
        `,
        createdBy: adminUser.id,
        isDefault: true,
        status: "ACTIVE"
      });
      
      // Create a modern template
      this.createCertificateTemplate({
        name: "Modern Certificate",
        description: "Clean, modern design with minimalist styling",
        template: `
          <div class="certificate" style="width: 800px; height: 600px; border: 10px solid #1976D2; padding: 20px; text-align: center; font-family: Arial, sans-serif;">
            <div style="font-size: 24px; font-weight: bold; color: #1976D2; margin-top: 50px;">CERTIFICATE OF COMPLETION</div>
            <div style="font-size: 16px; margin: 20px 0;">This is to certify that</div>
            <div style="font-size: 30px; font-weight: bold; margin: 20px 0; color: #333;">{{studentName}}</div>
            <div style="font-size: 16px; margin: 20px 0;">has successfully completed the</div>
            <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #333;">{{examTitle}}</div>
            <div style="font-size: 16px; margin: 20px 0;">with a score of</div>
            <div style="font-size: 22px; font-weight: bold; margin: 20px 0; color: #333;">{{score}}%</div>
            <div style="font-size: 16px; margin: 20px 0;">Date: {{issueDate}}</div>
            <div style="font-size: 16px; margin: 20px 0;">Certificate ID: {{certificateNumber}}</div>
            <div style="font-size: 16px; margin: 30px 0;">
              <div style="display: inline-block; border-top: 1px solid #000; padding-top: 5px; margin: 0 20px;">
                <div>{{academyName}}</div>
              </div>
            </div>
          </div>
        `,
        createdBy: adminUser.id,
        isDefault: false,
        status: "ACTIVE"
      });
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
    // Ensure role is set
    const role = insertUser.role || UserRole.STUDENT;
    const user: User = { 
      ...insertUser, 
      role,
      id, 
      createdAt: now 
    };
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
    const status = insertAcademy.status || "ACTIVE";
    const description = insertAcademy.description || null;
    const logo = insertAcademy.logo || null;
    
    const academy: Academy = { 
      ...insertAcademy, 
      id, 
      createdAt: now,
      status,
      description,
      logo
    };
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

  // Certificate Template methods
  async createCertificateTemplate(insertTemplate: InsertCertificateTemplate): Promise<CertificateTemplate> {
    const id = this.currentIds.certificateTemplates++;
    const now = new Date();
    
    // Ensure required fields have values
    const status = insertTemplate.status || "ACTIVE";
    const description = insertTemplate.description || null;
    const isDefault = insertTemplate.isDefault !== undefined ? insertTemplate.isDefault : false;
    
    const template: CertificateTemplate = { 
      ...insertTemplate, 
      id, 
      createdAt: now,
      status,
      description,
      isDefault
    };
    this.certificateTemplates.set(id, template);
    
    // If marked as default, update all other templates to non-default
    if (template.isDefault) {
      // Convert entries to array before iteration to avoid downlevelIteration issues
      const entries = Array.from(this.certificateTemplates.entries());
      for (const [tid, t] of entries) {
        if (tid !== id && t.isDefault) {
          this.certificateTemplates.set(tid, { ...t, isDefault: false });
        }
      }
    }
    
    return template;
  }
  
  async getCertificateTemplate(id: number): Promise<CertificateTemplate | undefined> {
    return this.certificateTemplates.get(id);
  }
  
  async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    return Array.from(this.certificateTemplates.values());
  }
  
  async getDefaultCertificateTemplate(): Promise<CertificateTemplate | undefined> {
    return Array.from(this.certificateTemplates.values()).find(
      (template) => template.isDefault
    );
  }
  
  async updateCertificateTemplate(id: number, templateData: Partial<CertificateTemplate>): Promise<CertificateTemplate | undefined> {
    const template = this.certificateTemplates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...templateData };
    this.certificateTemplates.set(id, updatedTemplate);
    
    // If marked as default, update all other templates to non-default
    if (updatedTemplate.isDefault) {
      // Convert entries to array before iteration to avoid downlevelIteration issues
      const entries = Array.from(this.certificateTemplates.entries());
      for (const [tid, t] of entries) {
        if (tid !== id && t.isDefault) {
          this.certificateTemplates.set(tid, { ...t, isDefault: false });
        }
      }
    }
    
    return updatedTemplate;
  }
}

export const storage = new MemStorage();
