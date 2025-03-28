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

  // Redirect if not a Super Admin or Academy user
  useEffect(() => {
    if (user && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ACADEMY) {
      setLocation("/exams");
    }
  }, [user, setLocation]);

  if (!user || (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ACADEMY)) {
    return null;
  }

  const subtitle = user.role === UserRole.SUPER_ADMIN 
    ? "Create a new exam and assign it to an academy" 
    : "Create a new exam for your academy";

  return (
    <MainLayout title="Create Exam" subtitle={subtitle}>
      <Card>
        <CardContent className="pt-6">
          <ExamForm />
        </CardContent>
      </Card>
    </MainLayout>
  );
}
