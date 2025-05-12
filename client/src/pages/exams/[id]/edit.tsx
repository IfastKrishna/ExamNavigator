import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, Exam, Academy, Question, Option } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import ExamForm from "@/components/exams/exam-form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

export default function EditExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const parseExamId = parseInt(examId);

  // Validate ID
  if (isNaN(parseExamId)) {
    setLocation("/exams");
    return null;
  }

  // Fetch the exam details
  const { data: exam, isLoading: isLoadingExam } = useQuery<Exam & { questions?: (Question & { options: Option[] })[] }>({
    queryKey: ["/api/exams", parseExamId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/exams/${parseExamId}`);
      if (!response.ok) {
        throw new Error("Exam not found");
      }
      return response.json();
    },
  });

  // Fetch exam questions
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<(Question & { options: Option[] })[]>({
    queryKey: ["/api/exams", parseExamId, "questions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/exams/${parseExamId}/questions`);
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      return response.json();
    },
    enabled: !!exam
  });

  if (isLoadingExam || isLoadingQuestions) {
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
  if (!exam) {
    return (
      <MainLayout title="Access Denied" subtitle="You don't have permission to edit this exam">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You don't have permission to edit this exam.
          </p>
          <button 
            onClick={() => setLocation(`/exams/${parseExamId}`)} 
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
      <div className="mb-6">
        <Button
          variant="outline" 
          onClick={() => setLocation("/exams")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Exams
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <ExamForm 
            examId={parseExamId} 
            defaultValues={{
              title: exam.title,
              description: exam.description ?? "",
              duration: exam.duration,
              passingScore: exam.passingScore,
              price: exam.price,
              status: exam.status as "DRAFT" | "PUBLISHED",
              examDate: exam.examDate,
              examTime: exam.examTime,
            }}
            initialQuestions={questions} 
          />
        </CardContent>
      </Card>
    </MainLayout>
  );
}
