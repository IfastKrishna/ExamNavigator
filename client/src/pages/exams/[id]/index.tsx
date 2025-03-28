import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Exam } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import ExamView from "@/components/exams/exam-view";
import { Loader2 } from "lucide-react";

export default function ExamDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const examId = parseInt(id);

  // Quick validation
  if (isNaN(examId)) {
    setLocation("/exams");
    return null;
  }

  // Fetch the exam details
  const { data: exam, isLoading } = useQuery<Exam>({
    queryKey: ["/api/exams", examId],
  });

  if (isLoading) {
    return (
      <MainLayout title="Exam Details" subtitle="Loading exam information...">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading exam details...</span>
        </div>
      </MainLayout>
    );
  }

  if (!exam) {
    return (
      <MainLayout title="Exam Not Found" subtitle="The requested exam could not be found">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Exam Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The exam you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button 
            onClick={() => setLocation("/exams")} 
            className="text-primary dark:text-accent hover:underline"
          >
            ← Back to Exams
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={exam.title} 
      subtitle={`Exam details and information`}
    >
      <ExamView examId={examId} />
    </MainLayout>
  );
}
