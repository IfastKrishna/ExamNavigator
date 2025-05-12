import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, type Exam } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PurchaseExamDialog } from "@/components/exams/PurchaseExamDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ArrowLeft, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AvailableExamsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  // Check if user is authorized to view this page
  if (user?.role !== UserRole.ACADEMY) {
    setLocation("/");
    return null;
  }

  // Fetch available exams from other academies
  const { data: availableExams = [], isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/available-exams"],
  });

  if (isLoading) {
    return (
      <MainLayout title="Exam Marketplace" subtitle="Browse and purchase exams">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading marketplace exams...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Exam Marketplace" subtitle="Browse and purchase exams from other academies">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/exams")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exams
        </Button>
      </div>

      {availableExams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              No Exams Available
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
              There are currently no exams available for purchase. Check back later as more academies publish their exams.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableExams.map((exam) => (
            <Card key={exam.id} className="flex flex-col h-full">
              <CardHeader>
                <div className="flex items-center mb-2">
                  {exam.academyLogo ? (
                    <img
                      src={exam.academyLogo}
                      alt={exam.academyName}
                      className="h-8 w-8 rounded-full mr-2"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      {exam.academyName?.charAt(0) || "A"}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {exam.academyName}
                  </span>
                </div>
                <CardTitle className="text-xl">{exam.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {exam.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p>{exam.duration} minutes</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <p className="font-medium">{formatCurrency(exam.price)}/license</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => {
                    setSelectedExam(exam);
                    setPurchaseDialogOpen(true);
                  }}
                  className="w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase Exam
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}      {/* Purchase Dialog */}
      {purchaseDialogOpen && selectedExam && (
        <PurchaseExamDialog 
          open={purchaseDialogOpen}
          onOpenChange={setPurchaseDialogOpen}
          exam={selectedExam}
          onPurchased={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
            setLocation("/exams"); // Redirect to exams page after purchase
          }}
        />
      )}
    </MainLayout>
  );
}