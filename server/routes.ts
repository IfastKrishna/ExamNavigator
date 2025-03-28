import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { UserRole } from "@shared/schema";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // API Routes
  
  // Users
  app.get("/api/users/role/:role", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    const role = req.params.role as UserRole;
    
    // Validate that role is a valid UserRole
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    // For security, only SUPER_ADMIN and ACADEMY roles can list users
    if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.ACADEMY) {
      return res.sendStatus(403);
    }
    
    try {
      const users = await storage.getUsersByRole(role);
      
      // For ACADEMY users, restrict access to only students
      if (req.user.role === UserRole.ACADEMY && role !== UserRole.STUDENT) {
        return res.sendStatus(403);
      }
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  // Academies
  app.get("/api/academies", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Get all academies (super admin only)
    if (req.user.role === UserRole.SUPER_ADMIN) {
      const academies = await storage.getAcademies();
      return res.json(academies);
    }
    
    // Get only the current academy (if user is an academy)
    if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      return res.json(academy ? [academy] : []);
    }
    
    // Students can see all academies too
    if (req.user.role === UserRole.STUDENT) {
      const academies = await storage.getAcademies();
      return res.json(academies);
    }
    
    return res.sendStatus(403);
  });
  
  app.get("/api/academies/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const academyId = parseInt(req.params.id);
    const academy = await storage.getAcademy(academyId);
    
    if (!academy) {
      return res.status(404).json({ message: "Academy not found" });
    }
    
    // Academy users can only view their own academy
    if (req.user.role === UserRole.ACADEMY) {
      const userAcademy = await storage.getAcademyByUserId(req.user.id);
      if (!userAcademy || userAcademy.id !== academyId) {
        return res.sendStatus(403);
      }
    }
    
    res.json(academy);
  });
  
  app.post("/api/academies", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.SUPER_ADMIN) {
      return res.sendStatus(403);
    }
    
    try {
      const academy = await storage.createAcademy(req.body);
      res.status(201).json(academy);
    } catch (error) {
      res.status(400).json({ message: "Invalid academy data" });
    }
  });
  
  app.put("/api/academies/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const academyId = parseInt(req.params.id);
    const academy = await storage.getAcademy(academyId);
    
    if (!academy) {
      return res.status(404).json({ message: "Academy not found" });
    }
    
    // Only super admin or the academy owner can update
    if (req.user.role === UserRole.SUPER_ADMIN || 
        (req.user.role === UserRole.ACADEMY && 
         academy.userId === req.user.id)) {
      const updatedAcademy = await storage.updateAcademy(academyId, req.body);
      return res.json(updatedAcademy);
    }
    
    return res.sendStatus(403);
  });
  
  // Exams
  app.get("/api/exams", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    let exams = [];
    const academyId = req.query.academyId ? parseInt(req.query.academyId as string) : null;
    
    if (req.user.role === UserRole.SUPER_ADMIN) {
      if (academyId) {
        exams = await storage.getExamsByAcademy(academyId);
      } else {
        // Get all exams from all academies
        const allAcademies = await storage.getAcademies();
        for (const academy of allAcademies) {
          const academyExams = await storage.getExamsByAcademy(academy.id);
          exams.push(...academyExams);
        }
      }
    } else if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (academy) {
        exams = await storage.getExamsByAcademy(academy.id);
      }
    } else if (req.user.role === UserRole.STUDENT) {
      if (academyId) {
        // Get published exams for a specific academy
        const academyExams = await storage.getExamsByAcademy(academyId);
        exams = academyExams.filter(exam => exam.status === "PUBLISHED");
      } else {
        // Get all published exams from all academies
        const allAcademies = await storage.getAcademies();
        for (const academy of allAcademies) {
          const academyExams = await storage.getExamsByAcademy(academy.id);
          exams.push(...academyExams.filter(exam => exam.status === "PUBLISHED"));
        }
      }
    }
    
    res.json(exams);
  });
  
  app.get("/api/exams/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const examId = parseInt(req.params.id);
    const exam = await storage.getExam(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    // Academy users can only view their own exams
    if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (!academy || academy.id !== exam.academyId) {
        return res.sendStatus(403);
      }
    }
    
    // Students can only view published exams
    if (req.user.role === UserRole.STUDENT && exam.status !== "PUBLISHED") {
      return res.sendStatus(403);
    }
    
    res.json(exam);
  });
  
  app.post("/api/exams", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.SUPER_ADMIN) {
      return res.sendStatus(403);
    }
    
    try {
      // Super Admin needs to specify an academyId in the request
      const academyId = req.body.academyId;
      if (!academyId) {
        return res.status(400).json({ message: "Academy ID is required" });
      }
      
      // Check if the academy exists
      const academy = await storage.getAcademy(academyId);
      if (!academy) {
        return res.status(404).json({ message: "Academy not found" });
      }
      
      const examData = {
        ...req.body,
        academyId
      };
      
      const exam = await storage.createExam(examData);
      res.status(201).json(exam);
    } catch (error) {
      res.status(400).json({ message: "Invalid exam data" });
    }
  });
  
  app.put("/api/exams/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    const examId = parseInt(req.params.id);
    const exam = await storage.getExam(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    // Super Admin can edit any exam
    if (req.user.role === UserRole.SUPER_ADMIN) {
      const updatedExam = await storage.updateExam(examId, req.body);
      return res.json(updatedExam);
    }
    
    // Academy users can only edit their own exams
    if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (!academy || academy.id !== exam.academyId) {
        return res.sendStatus(403);
      }
      
      const updatedExam = await storage.updateExam(examId, req.body);
      return res.json(updatedExam);
    }
    
    // Students cannot edit exams
    return res.sendStatus(403);
  });
  
  // Questions and Options
  app.get("/api/exams/:examId/questions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const examId = parseInt(req.params.examId);
    const exam = await storage.getExam(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    // Academy users can only view their own exams' questions
    if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (!academy || academy.id !== exam.academyId) {
        return res.sendStatus(403);
      }
    }
    
    // Students can only view questions of exams they've enrolled in
    if (req.user.role === UserRole.STUDENT) {
      const enrollments = await storage.getEnrollmentsByStudent(req.user.id);
      const hasEnrolled = enrollments.some(e => 
        e.examId === examId && 
        (e.status === "STARTED" || e.status === "COMPLETED")
      );
      
      if (!hasEnrolled) {
        return res.sendStatus(403);
      }
    }
    
    const questions = await storage.getQuestionsByExam(examId);
    
    // For each question, get its options
    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await storage.getOptionsByQuestion(question.id);
        return {
          ...question,
          options: options
        };
      })
    );
    
    res.json(questionsWithOptions);
  });
  
  app.post("/api/exams/:examId/questions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    const examId = parseInt(req.params.examId);
    const exam = await storage.getExam(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    // Super Admin can add questions to any exam
    if (req.user.role === UserRole.SUPER_ADMIN) {
      // Continue with question creation
    }
    // Academy users can only add questions to their own exams
    else if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (!academy || academy.id !== exam.academyId) {
        return res.sendStatus(403);
      }
    }
    // Students cannot add questions
    else {
      return res.sendStatus(403);
    }
    
    try {
      const { text, type, points, options } = req.body;
      
      const question = await storage.createQuestion({
        examId,
        text,
        type,
        points
      });
      
      if (options && Array.isArray(options)) {
        await Promise.all(
          options.map(opt => 
            storage.createOption({
              questionId: question.id,
              text: opt.text,
              isCorrect: opt.isCorrect
            })
          )
        );
      }
      
      const createdOptions = await storage.getOptionsByQuestion(question.id);
      
      res.status(201).json({
        ...question,
        options: createdOptions
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid question data" });
    }
  });
  
  // Enrollments
  app.get("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    let enrollments = [];
    
    if (req.user.role === UserRole.STUDENT) {
      // Students can only see their own enrollments
      enrollments = await storage.getEnrollmentsByStudent(req.user.id);
    } else if (req.user.role === UserRole.ACADEMY) {
      // Academies can see enrollments for their exams
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (academy) {
        const exams = await storage.getExamsByAcademy(academy.id);
        for (const exam of exams) {
          const examEnrollments = await storage.getEnrollmentsByExam(exam.id);
          enrollments.push(...examEnrollments);
        }
      }
    } else if (req.user.role === UserRole.SUPER_ADMIN) {
      // Super admin - could get all, but for now we'll filter by exam if provided
      if (req.query.examId) {
        const examId = parseInt(req.query.examId as string);
        enrollments = await storage.getEnrollmentsByExam(examId);
      }
      // Otherwise, would need paginated approach to get all enrollments
    }
    
    res.json(enrollments);
  });
  
  // Get enrollments for a specific exam
  app.get("/api/exams/:examId/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const examId = parseInt(req.params.examId);
    const exam = await storage.getExam(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    // Verify permissions
    if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (!academy || academy.id !== exam.academyId) {
        return res.sendStatus(403);
      }
    } else if (req.user.role !== UserRole.SUPER_ADMIN) {
      return res.sendStatus(403);
    }
    
    // Get enrollments for this exam
    const enrollments = await storage.getEnrollmentsByExam(examId);
    
    // Get student details for each enrollment
    const enrollmentsWithStudents = await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = await storage.getUser(enrollment.studentId);
        return {
          ...enrollment,
          student: student ? {
            id: student.id,
            username: student.username,
            name: student.name,
            email: student.email,
            role: student.role
          } : null
        };
      })
    );
    
    res.json(enrollmentsWithStudents);
  });
  
  app.post("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    try {
      const { examId, studentId, isAssigned } = req.body;
      
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Case 1: Student self-enrolling
      if (req.user.role === UserRole.STUDENT) {
        if (exam.status !== "PUBLISHED") {
          return res.status(400).json({ message: "Cannot enroll in an unpublished exam" });
        }
        
        // Check for existing enrollment
        const existingEnrollments = await storage.getEnrollmentsByStudent(req.user.id);
        const alreadyEnrolled = existingEnrollments.find(e => e.examId === examId);
        
        if (alreadyEnrolled) {
          return res.status(400).json({ message: "Already enrolled in this exam" });
        }
        
        const enrollment = await storage.createEnrollment({
          studentId: req.user.id,
          examId,
          status: "PURCHASED"
        });
        
        res.status(201).json(enrollment);
      } 
      // Case 2: Academy or Super Admin assigning a student to an exam
      else if ((req.user.role === UserRole.ACADEMY || req.user.role === UserRole.SUPER_ADMIN) && studentId) {
        // For academies, check they own the exam
        if (req.user.role === UserRole.ACADEMY) {
          const academy = await storage.getAcademyByUserId(req.user.id);
          if (!academy || academy.id !== exam.academyId) {
            return res.sendStatus(403);
          }
        }
        
        // Check for existing enrollment
        const existingEnrollments = await storage.getEnrollmentsByStudent(studentId);
        const alreadyEnrolled = existingEnrollments.find(e => e.examId === examId);
        
        if (alreadyEnrolled) {
          return res.status(400).json({ message: "Student already enrolled in this exam" });
        }
        
        // Verify student exists
        const student = await storage.getUser(studentId);
        if (!student || student.role !== UserRole.STUDENT) {
          return res.status(404).json({ message: "Student not found" });
        }
        
        const enrollment = await storage.createEnrollment({
          studentId,
          examId,
          status: "PURCHASED",
          isAssigned: true
        });
        
        res.status(201).json(enrollment);
      } else {
        return res.status(403).json({ message: "Not authorized to perform this action" });
      }
      
    } catch (error) {
      res.status(400).json({ message: "Invalid enrollment data" });
    }
  });
  
  app.put("/api/enrollments/:id/start", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.STUDENT) {
      return res.sendStatus(403);
    }
    
    const enrollmentId = parseInt(req.params.id);
    const enrollment = await storage.getEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    if (enrollment.studentId !== req.user.id) {
      return res.sendStatus(403);
    }
    
    if (enrollment.status !== "PURCHASED") {
      return res.status(400).json({ message: "Exam has already been started or completed" });
    }
    
    const updatedEnrollment = await storage.updateEnrollment(enrollmentId, {
      status: "STARTED",
      startedAt: new Date()
    });
    
    res.json(updatedEnrollment);
  });
  
  // Delete enrollment (unenroll student)
  app.delete("/api/enrollments/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    const enrollmentId = parseInt(req.params.id);
    const enrollment = await storage.getEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    // Only allow removing enrollments that haven't been started
    if (enrollment.status !== "PURCHASED") {
      return res.status(400).json({ message: "Cannot remove enrollment once exam has been started or completed" });
    }
    
    // Check permissions
    if (req.user.role === UserRole.STUDENT) {
      // Students can only remove their own enrollments
      if (enrollment.studentId !== req.user.id) {
        return res.sendStatus(403);
      }
    } else if (req.user.role === UserRole.ACADEMY) {
      // Academy users can only remove enrollments for their exams
      const exam = await storage.getExam(enrollment.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (!academy || academy.id !== exam.academyId) {
        return res.sendStatus(403);
      }
    } else if (req.user.role !== UserRole.SUPER_ADMIN) {
      return res.sendStatus(403);
    }
    
    // Delete enrollment
    await storage.deleteEnrollment(enrollmentId);
    
    res.status(200).json({ message: "Enrollment removed successfully" });
  });

  app.post("/api/enrollments/:id/submit", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.STUDENT) {
      return res.sendStatus(403);
    }
    
    const enrollmentId = parseInt(req.params.id);
    const enrollment = await storage.getEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    if (enrollment.studentId !== req.user.id) {
      return res.sendStatus(403);
    }
    
    if (enrollment.status !== "STARTED") {
      return res.status(400).json({ message: "Cannot submit an exam that hasn't been started" });
    }
    
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid answers data" });
    }
    
    try {
      const exam = await storage.getExam(enrollment.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      const questions = await storage.getQuestionsByExam(enrollment.examId);
      let totalPoints = 0;
      let earnedPoints = 0;
      
      // Process each answer
      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId);
        
        if (!question) continue;
        
        totalPoints += question.points;
        
        // For multiple choice questions
        if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
          const options = await storage.getOptionsByQuestion(question.id);
          const correctOption = options.find(o => o.isCorrect);
          
          if (!correctOption) continue;
          
          const isCorrect = correctOption.id === answer.selectedOptionId;
          
          if (isCorrect) {
            earnedPoints += question.points;
          }
          
          await storage.createAttempt({
            enrollmentId,
            questionId: question.id,
            selectedOptionId: answer.selectedOptionId,
            textAnswer: null,
            isCorrect
          });
        }
        // For short answer questions
        else if (question.type === "SHORT_ANSWER") {
          // Here you'd typically have some logic to evaluate short answers
          // For simplicity, we'll mark all as correct
          const isCorrect = true;
          
          if (isCorrect) {
            earnedPoints += question.points;
          }
          
          await storage.createAttempt({
            enrollmentId,
            questionId: question.id,
            selectedOptionId: null,
            textAnswer: answer.textAnswer,
            isCorrect
          });
        }
      }
      
      // Calculate score as a percentage
      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const passed = score >= exam.passingScore;
      
      // Update enrollment with completion status
      const updatedEnrollment = await storage.updateEnrollment(enrollmentId, {
        status: passed ? "PASSED" : "FAILED",
        completedAt: new Date(),
        score
      });
      
      // Generate certificate if passed
      if (passed) {
        const certificateNumber = `EP-${new Date().getFullYear()}-${nanoid(8)}`;
        
        // Get exam's certificate template or the default template
        let templateId = null;
        
        if (exam.certificateTemplateId) {
          // Use the exam's specified template
          templateId = exam.certificateTemplateId;
        } else {
          // Use the default template
          const defaultTemplate = await storage.getDefaultCertificateTemplate();
          if (defaultTemplate) {
            templateId = defaultTemplate.id;
          }
        }
        
        const certificate = await storage.createCertificate({
          enrollmentId,
          studentId: req.user.id,
          examId: enrollment.examId,
          academyId: exam.academyId,
          templateId,
          certificateNumber,
          customizations: null
        });
        
        // Update enrollment with certificate ID
        await storage.updateEnrollment(enrollmentId, {
          certificateId: certificateNumber
        });
        
        return res.json({
          enrollment: updatedEnrollment,
          certificate,
          score,
          passed
        });
      }
      
      res.json({
        enrollment: updatedEnrollment,
        score,
        passed
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process exam submission" });
    }
  });
  
  // Certificates
  app.get("/api/certificates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    let certificates = [];
    
    if (req.user.role === UserRole.STUDENT) {
      // Students can only see their own certificates
      certificates = await storage.getCertificatesByStudent(req.user.id);
    } else if (req.user.role === UserRole.ACADEMY) {
      // Academies can see certificates for their exams
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (academy) {
        certificates = await storage.getCertificatesByAcademy(academy.id);
      }
    } else if (req.user.role === UserRole.SUPER_ADMIN) {
      // Super admin would need pagination, for now filter by academy if provided
      if (req.query.academyId) {
        const academyId = parseInt(req.query.academyId as string);
        certificates = await storage.getCertificatesByAcademy(academyId);
      }
      // Otherwise would need pagination
    }
    
    res.json(certificates);
  });
  
  app.get("/api/certificates/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const certificateId = parseInt(req.params.id);
    const certificate = await storage.getCertificate(certificateId);
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    // Students can only view their own certificates
    if (req.user.role === UserRole.STUDENT && certificate.studentId !== req.user.id) {
      return res.sendStatus(403);
    }
    
    // Academies can only view certificates for their exams
    if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (!academy || academy.id !== certificate.academyId) {
        return res.sendStatus(403);
      }
    }
    
    res.json(certificate);
  });
  
  // Certificate Templates
  app.get("/api/certificate-templates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Only super admins and academies can access certificate templates
    if (req.user.role === UserRole.STUDENT) {
      return res.sendStatus(403);
    }
    
    // Check if default template is requested
    if (req.query.default === 'true') {
      const defaultTemplate = await storage.getDefaultCertificateTemplate();
      
      if (!defaultTemplate) {
        return res.status(404).json({ message: "No default certificate template found" });
      }
      
      return res.json(defaultTemplate);
    }
    
    const templates = await storage.getCertificateTemplates();
    res.json(templates);
  });
  
  app.get("/api/certificate-templates/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Only super admins and academies can access certificate templates
    if (req.user.role === UserRole.STUDENT) {
      return res.sendStatus(403);
    }
    
    const templateId = parseInt(req.params.id);
    const template = await storage.getCertificateTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({ message: "Certificate template not found" });
    }
    
    res.json(template);
  });
  
  app.post("/api/certificate-templates", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.SUPER_ADMIN) {
      return res.sendStatus(403);
    }
    
    try {
      const templateData = {
        ...req.body,
        createdBy: req.user.id
      };
      
      const template = await storage.createCertificateTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: "Invalid template data" });
    }
  });
  
  app.put("/api/certificate-templates/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.SUPER_ADMIN) {
      return res.sendStatus(403);
    }
    
    const templateId = parseInt(req.params.id);
    const template = await storage.getCertificateTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({ message: "Certificate template not found" });
    }
    
    try {
      const updatedTemplate = await storage.updateCertificateTemplate(templateId, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/academy-performance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    let academyId: number | undefined;
    
    // For academy users, get their academy ID
    if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (!academy) {
        return res.status(404).json({ message: "Academy not found for this user" });
      }
      academyId = academy.id;
    } 
    // For super admin, allow filtering by academy ID
    else if (req.user.role === UserRole.SUPER_ADMIN && req.query.academyId) {
      academyId = parseInt(req.query.academyId as string);
    }
    // Students cannot access this endpoint
    else if (req.user.role === UserRole.STUDENT) {
      return res.sendStatus(403);
    }
    
    try {
      // Get all exams for the academy
      const exams = academyId 
        ? await storage.getExamsByAcademy(academyId)
        : (await storage.getAcademies())
            .flatMap(async (academy) => await storage.getExamsByAcademy(academy.id));
      
      // Get all enrollments for the exams
      const enrollmentsPromises = exams.map(async (exam) => {
        return await storage.getEnrollmentsByExam(exam.id);
      });
      
      const examEnrollments = await Promise.all(enrollmentsPromises);
      
      // Process and transform the data for the performance stats
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      
      // Create monthly buckets for the last 6 months
      const months = [];
      for (let i = 0; i < 6; i++) {
        const month = new Date();
        month.setMonth(now.getMonth() - i);
        months.unshift({
          name: month.toLocaleString('default', { month: 'short' }),
          year: month.getFullYear(),
          month: month.getMonth(),
          passRate: 0,
          examsTaken: 0,
          completionRate: 0,
          totalEnrollments: 0,
        });
      }
      
      // Process enrollment data by month
      let totalPassed = 0;
      let totalTaken = 0;
      
      examEnrollments.flat().forEach(enrollment => {
        if (!enrollment.createdAt) return;
        
        const enrollmentDate = new Date(enrollment.createdAt);
        const monthIndex = months.findIndex(m => 
          m.year === enrollmentDate.getFullYear() && 
          m.month === enrollmentDate.getMonth()
        );
        
        if (monthIndex >= 0) {
          months[monthIndex].totalEnrollments++;
          
          if (enrollment.status === 'COMPLETED') {
            months[monthIndex].examsTaken++;
            totalTaken++;
            
            if (enrollment.score >= enrollment.passingScore) {
              months[monthIndex].passRate++;
              totalPassed++;
            }
          }
        }
      });
      
      // Calculate the percentages
      months.forEach(month => {
        if (month.examsTaken > 0) {
          month.passRate = Math.round((month.passRate / month.examsTaken) * 100);
        }
        if (month.totalEnrollments > 0) {
          month.completionRate = Math.round((month.examsTaken / month.totalEnrollments) * 100);
        }
      });
      
      // Calculate overall stats
      const overallPassRate = totalTaken > 0 ? Math.round((totalPassed / totalTaken) * 100) : 0;
      
      // Get total students count
      const students = await storage.getUsersByRole(UserRole.STUDENT);
      
      // Get academy or academies info
      const academyInfo = academyId 
        ? await storage.getAcademy(academyId)
        : { name: "All Academies" };
        
      // Return formatted analytics data
      res.json({
        monthly: months,
        overall: {
          totalExams: exams.length,
          totalEnrollments: examEnrollments.flat().length,
          totalStudents: students.length,
          overallPassRate,
        },
        academy: academyInfo
      });
    } catch (error) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ message: "Failed to generate analytics data" });
    }
  });
  
  app.get("/api/analytics/exam-categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    let academyId: number | undefined;
    
    // For academy users, get their academy ID
    if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (!academy) {
        return res.status(404).json({ message: "Academy not found for this user" });
      }
      academyId = academy.id;
    } 
    // For super admin, allow filtering by academy ID
    else if (req.user.role === UserRole.SUPER_ADMIN && req.query.academyId) {
      academyId = parseInt(req.query.academyId as string);
    }
    
    try {
      // Get all exams
      const exams = academyId 
        ? await storage.getExamsByAcademy(academyId)
        : (await storage.getAcademies())
            .flatMap(async (academy) => await storage.getExamsByAcademy(academy.id));
      
      // Create categories based on exam titles or descriptions
      // This is a simplified approach - in a real system, exams would have categories
      const categories = new Map();
      
      exams.forEach(exam => {
        // Simple categorization based on title keywords
        let category = "Other";
        const title = exam.title.toLowerCase();
        
        if (title.includes("program") || title.includes("code") || title.includes("develop")) {
          category = "Programming";
        } else if (title.includes("design") || title.includes("art") || title.includes("creative")) {
          category = "Design";
        } else if (title.includes("market") || title.includes("business") || title.includes("sales")) {
          category = "Business";
        } else if (title.includes("science") || title.includes("math") || title.includes("physics")) {
          category = "Science";
        }
        
        if (categories.has(category)) {
          categories.set(category, categories.get(category) + 1);
        } else {
          categories.set(category, 1);
        }
      });
      
      // Convert to array format for charts
      const categoryData = Array.from(categories.entries()).map(([name, value]) => ({
        name,
        value
      }));
      
      res.json(categoryData);
    } catch (error) {
      console.error("Error generating category analytics:", error);
      res.status(500).json({ message: "Failed to generate category data" });
    }
  });
  
  app.get("/api/analytics/student-performance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    let academyId: number | undefined;
    
    // For academy users, get their academy ID
    if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (!academy) {
        return res.status(404).json({ message: "Academy not found for this user" });
      }
      academyId = academy.id;
    } 
    // For super admin, allow filtering by academy ID
    else if (req.user.role === UserRole.SUPER_ADMIN && req.query.academyId) {
      academyId = parseInt(req.query.academyId as string);
    }
    // Students can only see their own performance
    else if (req.user.role === UserRole.STUDENT) {
      return res.sendStatus(403);
    }
    
    try {
      // Get exams for this academy
      const exams = academyId 
        ? await storage.getExamsByAcademy(academyId)
        : [];
      
      // Get enrollments for these exams
      const enrollments = await Promise.all(
        exams.map(async exam => await storage.getEnrollmentsByExam(exam.id))
      );
      
      // Flatten the enrollments
      const allEnrollments = enrollments.flat();
      
      // Get unique student IDs
      const studentIds = [...new Set(allEnrollments.map(e => e.studentId))];
      
      // Get student data for each ID
      const studentData = await Promise.all(
        studentIds.map(async id => {
          const user = await storage.getUser(id);
          const studentEnrollments = allEnrollments.filter(e => e.studentId === id);
          
          // Calculate student metrics
          const totalExams = studentEnrollments.length;
          const completedExams = studentEnrollments.filter(e => e.status === 'COMPLETED').length;
          const passedExams = studentEnrollments.filter(
            e => e.status === 'COMPLETED' && e.score >= e.passingScore
          ).length;
          
          // Calculate average score
          const scores = studentEnrollments
            .filter(e => e.status === 'COMPLETED')
            .map(e => e.score);
          
          const avgScore = scores.length > 0
            ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
            : 0;
          
          return {
            id: id,
            name: user ? user.name : `Student ${id}`,
            totalExams,
            completedExams,
            passedExams,
            avgScore,
            passRate: completedExams > 0 ? Math.round((passedExams / completedExams) * 100) : 0
          };
        })
      );
      
      // Sort by pass rate
      studentData.sort((a, b) => b.passRate - a.passRate);
      
      res.json(studentData);
    } catch (error) {
      console.error("Error generating student analytics:", error);
      res.status(500).json({ message: "Failed to generate student performance data" });
    }
  });
  
  app.get("/api/analytics/exam-performance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    let academyId: number | undefined;
    
    // For academy users, get their academy ID
    if (req.user.role === UserRole.ACADEMY) {
      const academy = await storage.getAcademyByUserId(req.user.id);
      if (!academy) {
        return res.status(404).json({ message: "Academy not found for this user" });
      }
      academyId = academy.id;
    } 
    // For super admin, allow filtering by academy ID
    else if (req.user.role === UserRole.SUPER_ADMIN && req.query.academyId) {
      academyId = parseInt(req.query.academyId as string);
    }
    
    try {
      // Get exams for this academy
      const exams = academyId 
        ? await storage.getExamsByAcademy(academyId)
        : [];
      
      // Get performance data for each exam
      const examData = await Promise.all(
        exams.map(async exam => {
          const enrollments = await storage.getEnrollmentsByExam(exam.id);
          
          // Calculate metrics
          const totalEnrollments = enrollments.length;
          const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED').length;
          const passedEnrollments = enrollments.filter(
            e => e.status === 'COMPLETED' && e.score >= e.passingScore
          ).length;
          
          // Calculate average scores
          const scores = enrollments
            .filter(e => e.status === 'COMPLETED')
            .map(e => e.score);
          
          const avgScore = scores.length > 0
            ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
            : 0;
          
          return {
            id: exam.id,
            title: exam.title,
            totalEnrollments,
            completedEnrollments,
            passedEnrollments,
            avgScore,
            passRate: completedEnrollments > 0 
              ? Math.round((passedEnrollments / completedEnrollments) * 100) 
              : 0,
            completionRate: totalEnrollments > 0 
              ? Math.round((completedEnrollments / totalEnrollments) * 100) 
              : 0
          };
        })
      );
      
      // Sort by number of enrollments (most popular)
      examData.sort((a, b) => b.totalEnrollments - a.totalEnrollments);
      
      res.json(examData);
    } catch (error) {
      console.error("Error generating exam analytics:", error);
      res.status(500).json({ message: "Failed to generate exam performance data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
