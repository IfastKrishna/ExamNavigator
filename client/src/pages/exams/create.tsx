import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import ExamForm from "@/components/exams/exam-form";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function CreateExamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not an academy user
  useEffect(() => {
    if (user && user.role !== UserRole.ACADEMY) {
      setLocation("/exams");
    }
  }, [user, setLocation]);

  if (!user || user.role !== UserRole.ACADEMY) {
    return null;
  }

  return (
    <MainLayout title="Create Exam" subtitle="Create a new exam for your academy">
      <Card>
        <CardContent className="pt-6">
          <ExamForm />
        </CardContent>
      </Card>
    </MainLayout>
  );
}
