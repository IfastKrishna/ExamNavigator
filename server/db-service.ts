import { db } from "./database";
import {
  users,
  academies,
  exams,
  questions,
  options,
  enrollments,
  attempts,
  certificateTemplates,
  certificates,
  examPurchases,
  insertUserSchema,
  insertAcademySchema,
  insertExamSchema,
  insertQuestionSchema,
  insertOptionSchema,
  insertEnrollmentSchema,
  insertAttemptSchema,
  insertCertificateTemplateSchema,
  insertCertificateSchema,
  insertExamPurchaseSchema,
} from "@shared/schema";
import { IStorage } from "./storage";
import { eq, and } from "drizzle-orm";
import type {
  User,
  InsertUser,
  Academy,
  InsertAcademy,
  Exam,
  InsertExam,
  Question,
  InsertQuestion,
  Option,
  InsertOption,
  Enrollment,
  InsertEnrollment,
  Attempt,
  InsertAttempt,
  CertificateTemplate,
  InsertCertificateTemplate,
  Certificate,
  InsertCertificate,
  ExamPurchase,
  InsertExamPurchase,
  UserRole,
} from "@shared/schema";

export class DBStorage implements IStorage {
  sessionStore: any;

  constructor(sessionStore: any) {
    this.sessionStore = sessionStore;
  }

  /* User Methods */
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.role, role));
    return result;
  }

  async createUser(user: InsertUser): Promise<User> {
    const validatedUser = insertUserSchema.parse(user);
    const result = await db.insert(users).values(validatedUser).returning();
    return result[0];
  }

  async updateUser(
    id: number,
    userData: Partial<User>
  ): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  /* Academy Methods */
  async createAcademy(academy: InsertAcademy): Promise<Academy> {
    const validatedAcademy = insertAcademySchema.parse(academy);
    const result = await db
      .insert(academies)
      .values(validatedAcademy)
      .returning();
    return result[0];
  }

  async getAcademy(id: number): Promise<Academy | undefined> {
    const result = await db
      .select()
      .from(academies)
      .where(eq(academies.id, id));
    return result[0];
  }

  async getAcademies(): Promise<Academy[]> {
    return await db.select().from(academies);
  }

  async getAcademyByUserId(userId: number): Promise<Academy | undefined> {
    const result = await db
      .select()
      .from(academies)
      .where(eq(academies.userId, userId));
    return result[0];
  }

  async updateAcademy(
    id: number,
    academyData: Partial<Academy>
  ): Promise<Academy | undefined> {
    const result = await db
      .update(academies)
      .set(academyData)
      .where(eq(academies.id, id))
      .returning();
    return result[0];
  }

  /* Exam Methods */
  async createExam(exam: InsertExam): Promise<Exam> {
    const validatedExam = insertExamSchema.parse(exam);
    const result = await db.insert(exams).values(validatedExam).returning();
    return result[0];
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const result = await db.select().from(exams).where(eq(exams.id, id));
    const question = await db
      .select()
      .from(questions)
      .where(eq(questions.examId, id));

    const questionAndOption = question.map(async (q) => {
      const option = await db
        .select()
        .from(options)
        .where(eq(options.questionId, q.id));
      return { ...q, options: option };
    });
    const questionwithAns = await Promise.all(questionAndOption);
    const data = { ...result[0], questions: questionwithAns };
    return data;
  }

  async getExamsByAcademy(academyId: number): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.academyId, academyId));
  }

  async getAllExams(): Promise<Exam[]> {
    return await db.select().from(exams);
  }

  async updateExam(
    id: number,
    examData: Partial<Exam>
  ): Promise<Exam | undefined> {
    const result = await db
      .update(exams)
      .set(examData)
      .where(eq(exams.id, id))
      .returning();
    return result[0];
  }

  /* Question Methods */
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const validatedQuestion = insertQuestionSchema.parse(question);
    const result = await db
      .insert(questions)
      .values(validatedQuestion)
      .returning();
    return result[0];
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const result = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id));
    return result[0];
  }

  async getQuestionsByExam(examId: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.examId, examId));
  }

  async updateQuestion(
    id: number,
    questionData: Partial<Question>
  ): Promise<Question | undefined> {
    const result = await db
      .update(questions)
      .set(questionData)
      .where(eq(questions.id, id))
      .returning();
    return result[0];
  }

  /* Option Methods */
  async createOption(option: InsertOption): Promise<Option> {
    const validatedOption = insertOptionSchema.parse(option);
    const result = await db.insert(options).values(validatedOption).returning();
    return result[0];
  }

  async getOption(id: number): Promise<Option | undefined> {
    const result = await db.select().from(options).where(eq(options.id, id));
    return result[0];
  }

  async getOptionsByQuestion(questionId: number): Promise<Option[]> {
    return await db
      .select()
      .from(options)
      .where(eq(options.questionId, questionId));
  }

  /* Enrollment Methods */
  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const validatedEnrollment = insertEnrollmentSchema.parse(enrollment);
    const result = await db
      .insert(enrollments)
      .values(validatedEnrollment)
      .returning();
    return result[0];
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const result = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id));
    return result[0];
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));
  }

  async getEnrollmentsByExam(examId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.examId, examId));
  }

  async updateEnrollment(
    id: number,
    enrollmentData: Partial<Enrollment>
  ): Promise<Enrollment | undefined> {
    const result = await db
      .update(enrollments)
      .set(enrollmentData)
      .where(eq(enrollments.id, id))
      .returning();
    return result[0];
  }

  async deleteEnrollment(id: number): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.id, id));
  }

  /* Attempt Methods */
  async createAttempt(attempt: InsertAttempt): Promise<Attempt> {
    const validatedAttempt = insertAttemptSchema.parse(attempt);
    const result = await db
      .insert(attempts)
      .values(validatedAttempt)
      .returning();
    return result[0];
  }

  async getAttemptsByEnrollment(enrollmentId: number): Promise<Attempt[]> {
    return await db
      .select()
      .from(attempts)
      .where(eq(attempts.enrollmentId, enrollmentId));
  }

  /* Certificate Template Methods */
  async createCertificateTemplate(
    template: InsertCertificateTemplate
  ): Promise<CertificateTemplate> {
    const validatedTemplate = insertCertificateTemplateSchema.parse(template);
    const result = await db
      .insert(certificateTemplates)
      .values(validatedTemplate)
      .returning();
    return result[0];
  }

  async getCertificateTemplate(
    id: number
  ): Promise<CertificateTemplate | undefined> {
    const result = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.id, id));
    return result[0];
  }

  async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    return await db.select().from(certificateTemplates);
  }

  async getDefaultCertificateTemplate(): Promise<
    CertificateTemplate | undefined
  > {
    const result = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.isDefault, true));
    return result[0];
  }

  async updateCertificateTemplate(
    id: number,
    templateData: Partial<CertificateTemplate>
  ): Promise<CertificateTemplate | undefined> {
    const result = await db
      .update(certificateTemplates)
      .set(templateData)
      .where(eq(certificateTemplates.id, id))
      .returning();
    return result[0];
  }

  /* Certificate Methods */
  async createCertificate(
    certificate: InsertCertificate
  ): Promise<Certificate> {
    const validatedCertificate = insertCertificateSchema.parse(certificate);
    const result = await db
      .insert(certificates)
      .values(validatedCertificate)
      .returning();
    return result[0];
  }

  async getCertificate(id: number): Promise<Certificate | undefined> {
    const result = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, id as unknown as number));
    return result[0];
  }

  async getCertificatesByStudent(studentId: number): Promise<Certificate[]> {
    return await db
      .select()
      .from(certificates)
      .where(eq(certificates.studentId, studentId));
  }

  async getCertificatesByAcademy(academyId: number): Promise<Certificate[]> {
    return await db
      .select()
      .from(certificates)
      .where(eq(certificates.academyId, academyId));
  }

  async getCertificateByEnrollment(
    enrollmentId: number
  ): Promise<Certificate | undefined> {
    const result = await db
      .select()
      .from(certificates)
      .where(eq(certificates.enrollmentId, enrollmentId));
    return result[0];
  }

  /* Exam Purchase Methods */
  async createExamPurchase(
    purchase: InsertExamPurchase
  ): Promise<ExamPurchase> {
    const result = await db
      .insert(examPurchases)
      .values({
        academyId: purchase.academyId,
        examId: purchase.examId,
        quantity: purchase.quantity || 1,
        usedQuantity: purchase.usedQuantity || 0,
        totalPrice: purchase.totalPrice,
        status: purchase.status || "ACTIVE",
        paymentId: purchase.paymentId,
        expiryDate: purchase.expiryDate,
      })
      .returning();
    return result[0];
  }

  async getExamPurchase(id: number): Promise<ExamPurchase | undefined> {
    const result = await db
      .select()
      .from(examPurchases)
      .where(eq(examPurchases.id, id));
    return result[0];
  }

  async getExamPurchasesByAcademy(academyId: number): Promise<ExamPurchase[]> {
    return await db
      .select()
      .from(examPurchases)
      .where(eq(examPurchases.academyId, academyId));
  }

  async getExamPurchasesByExam(examId: number): Promise<ExamPurchase[]> {
    return await db
      .select()
      .from(examPurchases)
      .where(eq(examPurchases.examId, examId));
  }

  async getExamPurchaseByAcademyAndExam(
    academyId: number,
    examId: number
  ): Promise<ExamPurchase | undefined> {
    const result = await db
      .select()
      .from(examPurchases)
      .where(
        and(
          eq(examPurchases.academyId, academyId),
          eq(examPurchases.examId, examId)
        )
      );
    return result[0];
  }

  async incrementUsedQuantity(
    purchaseId: number
  ): Promise<ExamPurchase | undefined> {
    // First get the current purchase to check the quantity
    const [purchase] = await db
      .select()
      .from(examPurchases)
      .where(eq(examPurchases.id, purchaseId));

    if (!purchase || purchase.usedQuantity >= purchase.quantity) {
      throw new Error("No remaining quantity to use");
    }

    // Increment the used quantity
    const result = await db
      .update(examPurchases)
      .set({ usedQuantity: purchase.usedQuantity + 1 })
      .where(eq(examPurchases.id, purchaseId))
      .returning();

    return result[0];
  }

  async updateExamPurchase(
    id: number,
    purchaseData: Partial<ExamPurchase>
  ): Promise<ExamPurchase | undefined> {
    const result = await db
      .update(examPurchases)
      .set(purchaseData)
      .where(eq(examPurchases.id, id))
      .returning();
    return result[0];
  }
}
