import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, Exam, Academy } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import ExamForm from "@/components/exams/exam-form";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function EditExamPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const examId = parseInt(id);

  // Validate ID
  if (isNaN(examId)) {
    setLocation("/exams");
    return null;
  }

  // Fetch the exam details
  const { data: exam, isLoading: isLoadingExam } = useQuery<Exam>({
    queryKey: ["/api/exams", examId],
  });

  // Fetch academy details
  const { data: academy, isLoading: isLoadingAcademy } = useQuery<Academy>({
    queryKey: ["/api/academies", exam?.academyId],
    enabled: !!exam,
  });

  // Redirect if not authorized
  useEffect(() => {
    if (exam && academy && user) {
      const isAcademyOwner = user.role === UserRole.ACADEMY && academy.userId === user.id;
      if (!isAcademyOwner) {
        setLocation(`/exams/${examId}`);
      }
    }
  }, [exam, academy, user, examId, setLocation]);

  if (isLoadingExam || isLoadingAcademy) {
    return (
      <MainLayout title="Edit Exam" subtitle="Loading exam information...">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading exam details...</span>
        </div>
      </MainLayout>
    );
  }

  // Check permissions
  if (!exam || !academy || user?.role !== UserRole.ACADEMY || academy.userId !== user.id) {
    return (
      <MainLayout title="Access Denied" subtitle="You don't have permission to edit this exam">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You don't have permission to edit this exam.
          </p>
          <button 
            onClick={() => setLocation(`/exams/${examId}`)} 
            className="text-primary dark:text-accent hover:underline"
          >
            ← Back to Exam Details
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={`Edit: ${exam.title}`} 
      subtitle="Update exam details and questions"
    >
      <Card>
        <CardContent className="pt-6">
          <ExamForm 
            examId={examId} 
            defaultValues={{
              title: exam.title,
              description: exam.description ?? "",
              duration: exam.duration,
              passingScore: exam.passingScore,
              price: exam.price,
              status: exam.status as "DRAFT" | "PUBLISHED",
              academyId: exam.academyId
            }} 
          />
        </CardContent>
      </Card>
    </MainLayout>
  );
}
