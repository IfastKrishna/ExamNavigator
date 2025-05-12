import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft,  } from "lucide-react";
import ExamPreview from "./exam-preview";
import MainLayout from "../layouts/main-layout";

export default function ExamView() {
  const [, setLocation] = useLocation();
  const { examId } = useParams<{ examId: string }>();
  const parsedExamId = parseInt(examId);
  // Fetch the exam details
  const { data: examdata, isLoading: isLoadingExam } = useQuery({
    queryKey: ["/api/exams", parsedExamId],
    queryFn: async () => {
      const response = await fetch(`/api/exams/${parsedExamId}`);
      if (!response.ok) {
        throw new Error("Exam not found");
      }
      return response.json();
    },
  });

  const {questions, ...exam} = examdata || {questions:[], title: "", description: "", duration: 0, passingScore: 0, price: 0, };

  if (isLoadingExam ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading exam details...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Exam Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          The exam you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => setLocation("/exams")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Exams
        </Button>
      </div>
    );
  }


  return (
    <MainLayout title={exam.title} subtitle="Exam Details">
       <ExamPreview 
            exam={exam} 
            questions={questions}
            showAnswers={true}
          />
      </MainLayout>
  );
}
