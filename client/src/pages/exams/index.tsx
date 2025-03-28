import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, type Exam, type Academy } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Eye, Edit, MoreHorizontal, Play, BookOpen, ShoppingCart } from "lucide-react";
import AssignStudentsDialog from "@/components/exams/assign-students-dialog";
import { formatCurrency } from "@/lib/utils";

export default function ExamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(user?.role === UserRole.STUDENT ? "available" : "all");

  // Fetch exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Fetch academies
  const { data: academies = [], isLoading: isLoadingAcademies } = useQuery<Academy[]>({
    queryKey: ["/api/academies"],
  });

  // Fetch enrollments for students
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
    enabled: user?.role === UserRole.STUDENT,
  });

  // Start exam mutation for students
  const startExamMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      const res = await apiRequest("PUT", `/api/enrollments/${enrollmentId}/start`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Exam Started",
        description: "You can now begin your exam.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to start exam",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enroll in exam mutation for students
  const enrollExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      const res = await apiRequest("POST", "/api/enrollments", { examId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Enrollment Successful",
        description: "You have successfully enrolled in the exam.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
    },
    onError: (error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and process exams based on user role and active tab
  const getProcessedExams = () => {
    // Add academy name to exams
    const examsWithAcademyNames = exams.map(exam => {
      const academy = academies.find(a => a.id === exam.academyId);
      return {
        ...exam,
        academyName: academy?.name || "Unknown Academy",
        studentsCount: 78, // This would come from a real API
        passRate: 85, // This would come from a real API
      };
    });

    if (user?.role === UserRole.STUDENT) {
      const enrolledExamIds = enrollments.map(e => e.examId);
      
      if (activeTab === "available") {
        return examsWithAcademyNames.filter(exam => 
          exam.status === "PUBLISHED" && 
          !enrolledExamIds.includes(exam.id)
        );
      } else if (activeTab === "enrolled") {
        return examsWithAcademyNames.filter(exam => 
          enrolledExamIds.includes(exam.id)
        );
      }
    } else if (user?.role === UserRole.ACADEMY) {
      if (activeTab === "published") {
        return examsWithAcademyNames.filter(exam => exam.status === "PUBLISHED");
      } else if (activeTab === "draft") {
        return examsWithAcademyNames.filter(exam => exam.status === "DRAFT");
      }
    }
    
    return examsWithAcademyNames;
  };

  // Determine if user can create exams (only super admin can create exams)
  const canCreateExam = user?.role === UserRole.SUPER_ADMIN;
  
  // Determine if user can enroll in exams (student users only)
  const canEnrollInExam = user?.role === UserRole.STUDENT;

  // Get enrollment for a given exam
  const getEnrollmentForExam = (examId: number) => {
    return enrollments.find(e => e.examId === examId);
  };

  if (isLoadingExams || isLoadingAcademies || isLoadingEnrollments) {
    return (
      <MainLayout title="Exams" subtitle="Manage and view all exams">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading exams...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Exams" subtitle="Manage and view all exams">
      <Card className="transition-colors duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold">Exams</CardTitle>
            {user?.role === UserRole.STUDENT && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="available">Available Exams</TabsTrigger>
                  <TabsTrigger value="enrolled">My Enrolled Exams</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            {user?.role === UserRole.ACADEMY && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All Exams</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="draft">Drafts</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
          <div className="flex gap-2">
            {user?.role === UserRole.ACADEMY && (
              <Button variant="outline" onClick={() => setLocation("/available-exams")}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Marketplace
              </Button>
            )}
            {canCreateExam && (
              <Button onClick={() => setLocation("/exams/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Exam
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {getProcessedExams().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Exams Found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                {user?.role === UserRole.ACADEMY
                  ? "No exams have been assigned to your academy yet. Contact the Super Admin to assign exams."
                  : user?.role === UserRole.SUPER_ADMIN 
                  ? "Get started by creating your first exam using the 'Create Exam' button above."
                  : user?.role === UserRole.STUDENT && activeTab === "available"
                  ? "There are currently no available exams to enroll in."
                  : user?.role === UserRole.STUDENT && activeTab === "enrolled"
                  ? "You haven't enrolled in any exams yet."
                  : "There are currently no exams in the system."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.STUDENT) && (
                      <TableHead>Academy</TableHead>
                    )}
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    {user?.role !== UserRole.STUDENT && (
                      <>
                        <TableHead>Pass Rate</TableHead>
                        <TableHead>Students</TableHead>
                      </>
                    )}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getProcessedExams().map((exam) => {
                    const enrollment = canEnrollInExam ? getEnrollmentForExam(exam.id) : null;
                    
                    return (
                      <TableRow key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <TableCell>
                          <div className="font-medium">{exam.title}</div>
                          {exam.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate">
                              {exam.description}
                            </div>
                          )}
                        </TableCell>
                        {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.STUDENT) && (
                          <TableCell>{exam.academyName}</TableCell>
                        )}
                        <TableCell>{exam.duration} minutes</TableCell>
                        <TableCell>{formatCurrency(exam.price)}</TableCell>
                        {user?.role !== UserRole.STUDENT && (
                          <>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                  <div 
                                    className="bg-green-500 h-2.5 rounded-full" 
                                    style={{ width: `${exam.passRate}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">{exam.passRate}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{exam.studentsCount}</TableCell>
                          </>
                        )}
                        <TableCell>
                          <Badge 
                            variant={exam.status === "PUBLISHED" ? "success" : 
                                    exam.status === "DRAFT" ? "secondary" : "outline"}
                          >
                            {exam.status}
                          </Badge>
                          {enrollment && (
                            <Badge 
                              variant={
                                enrollment.status === "PASSED" ? "success" :
                                enrollment.status === "FAILED" ? "destructive" :
                                enrollment.status === "STARTED" ? "warning" : "outline"
                              }
                              className="ml-2"
                            >
                              {enrollment.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {canEnrollInExam && !enrollment && (
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => enrollExamMutation.mutate(exam.id)}
                              disabled={enrollExamMutation.isPending}
                            >
                              {enrollExamMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Enroll"
                              )}
                            </Button>
                          )}
                          
                          {enrollment && (enrollment.status === "ENROLLED" || enrollment.status === "ASSIGNED") && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => startExamMutation.mutate(enrollment.id)}
                              disabled={startExamMutation.isPending}
                            >
                              {startExamMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Play className="h-4 w-4 mr-1" />
                              )}
                              Start Exam
                            </Button>
                          )}
                          
                          {enrollment && enrollment.status === "STARTED" && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => setLocation(`/exams/${exam.id}/take`)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Continue
                            </Button>
                          )}
                          
                          {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ACADEMY) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setLocation(`/exams/${exam.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                {/* Super Admin can edit any exam */}
                                {user?.role === UserRole.SUPER_ADMIN && (
                                  <DropdownMenuItem onClick={() => setLocation(`/exams/${exam.id}/edit`)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                
                                {/* Academy users can only edit their exams */}
                                {user?.role === UserRole.ACADEMY && (
                                  <>
                                    <DropdownMenuItem onClick={() => setLocation(`/exams/${exam.id}/edit`)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <div>
                                        <AssignStudentsDialog examId={exam.id} examTitle={exam.title} />
                                      </div>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
