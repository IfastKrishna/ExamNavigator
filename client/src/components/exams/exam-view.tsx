import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, type Exam, type Academy, type Question, type Option } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Edit, Clock, Award, Users, DollarSign, CheckCircle, Eye, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ExamViewProps {
  examId: number;
}

export default function ExamView({ examId }: ExamViewProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch the exam details
  const { data: exam, isLoading: isLoadingExam } = useQuery<Exam>({
    queryKey: ["/api/exams", examId],
  });

  // Fetch academy details
  const { data: academy, isLoading: isLoadingAcademy } = useQuery<Academy>({
    queryKey: ["/api/academies", exam?.academyId],
    enabled: !!exam,
  });

  // Fetch questions (only if academy or super admin)
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<(Question & { options: Option[] })[]>({
    queryKey: ["/api/exams", examId, "questions"],
    enabled: !!exam && (user?.role === UserRole.ACADEMY || user?.role === UserRole.SUPER_ADMIN),
  });

  // Fetch enrollments (for academy)
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<any[]>({
    queryKey: ["/api/exams", examId, "enrollments"],
    enabled: !!exam && (user?.role === UserRole.ACADEMY || user?.role === UserRole.SUPER_ADMIN),
  });

  // Enroll in exam mutation (for students)
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/enrollments", {
        examId,
        studentId: user?.id,
        isAssigned: false,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({
        title: "Success",
        description: "You have successfully enrolled in this exam",
      });
      // Navigate to exams page
      setLocation("/exams");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll in exam",
        variant: "destructive",
      });
    },
  });

  if (isLoadingExam || isLoadingAcademy || isLoadingQuestions || isLoadingEnrollments) {
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

  // Determine if user can edit the exam
  const canEdit = user?.role === UserRole.ACADEMY && academy?.userId === user.id;
  
  // Calculate student enrollment and pass rate metrics
  const studentCount = enrollments.length || 0;
  const passedCount = enrollments.filter(e => e.status === "PASSED").length || 0;
  const passRate = studentCount > 0 ? Math.round((passedCount / studentCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Exam Header */}
      <Card className="border-b">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{exam.title}</CardTitle>
            <CardDescription className="mt-2">
              {academy?.name && <div>By {academy.name}</div>}
              <div className="flex items-center mt-1 space-x-2">
                <Badge variant={exam.status === "PUBLISHED" ? "success" : "secondary"}>
                  {exam.status}
                </Badge>
                <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-1" /> {exam.duration} minutes
                </span>
                {exam.price > 0 && (
                  <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <DollarSign className="h-4 w-4 mr-1" /> {formatCurrency(exam.price)}
                  </span>
                )}
              </div>
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setLocation("/exams")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {(user?.role === UserRole.ACADEMY || user?.role === UserRole.SUPER_ADMIN) && (
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Exam
              </Button>
            )}
            {canEdit && (
              <Button onClick={() => setLocation(`/exams/${examId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Exam
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Exam Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {(user?.role === UserRole.ACADEMY || user?.role === UserRole.SUPER_ADMIN) && (
            <TabsTrigger value="questions">Questions</TabsTrigger>
          )}
          {(user?.role === UserRole.ACADEMY || user?.role === UserRole.SUPER_ADMIN) && (
            <TabsTrigger value="students">Students</TabsTrigger>
          )}
          {(user?.role === UserRole.ACADEMY || user?.role === UserRole.SUPER_ADMIN) && (
            <TabsTrigger value="results">Results</TabsTrigger>
          )}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300">{exam.description || "No description provided."}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center">
                    <Clock className="h-10 w-10 p-2 rounded-full bg-blue-100 dark:bg-blue-900 text-primary dark:text-accent mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                      <p className="font-semibold">{exam.duration} minutes</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 flex items-center">
                    <Award className="h-10 w-10 p-2 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Passing Score</p>
                      <p className="font-semibold">{exam.passingScore}%</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 flex items-center">
                    <Users className="h-10 w-10 p-2 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Students Enrolled</p>
                      <p className="font-semibold">{studentCount}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {(user?.role === UserRole.ACADEMY || user?.role === UserRole.SUPER_ADMIN) && studentCount > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Performance</h3>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                      <div 
                        className="bg-green-500 h-2.5 rounded-full" 
                        style={{ width: `${passRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{passRate}% Pass Rate</span>
                  </div>
                </div>
              )}

              {exam.examDate && (
                <div>
                  <h3 className="font-medium mb-2">Scheduled Date</h3>
                  <div className="flex items-center">
                    <Badge variant="outline" className="text-sm">
                      {formatDate(exam.examDate)} {exam.examTime ? exam.examTime : ""}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6">
              {user?.role === UserRole.STUDENT && (
                <Button 
                  className="ml-auto"
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                >
                  {enrollMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Enroll in Exam
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Questions Tab - Only visible to academy and super admin */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Questions ({questions.length})</CardTitle>
              <CardDescription>
                View all questions in this exam. Students must answer these to pass.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No questions added to this exam yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <Card key={index} className="border border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium">Question {index + 1}</h3>
                            <p className="text-gray-700 dark:text-gray-300 mt-1">{question.text}</p>
                          </div>
                          <div className="flex items-center">
                            <Badge className="mr-2">
                              {question.type === "MULTIPLE_CHOICE" ? "Multiple Choice" : 
                               question.type === "TRUE_FALSE" ? "True/False" : "Short Answer"}
                            </Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {question.points} {question.points === 1 ? "point" : "points"}
                            </span>
                          </div>
                        </div>
                        
                        {/* Question options if applicable */}
                        {question.options && question.options.length > 0 && (
                          <div className="ml-4 space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div 
                                key={optIndex} 
                                className={`flex items-center p-2 rounded ${option.isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500' : ''}`}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mr-2">
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <span className={option.isCorrect ? 'font-medium' : ''}>
                                  {option.text}
                                </span>
                                {option.isCorrect && (
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    (Correct Answer)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Students Tab - Only visible to academy and super admin */}
        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Enrolled Students ({enrollments.length})</CardTitle>
                <CardDescription>
                  Students who have enrolled in this exam.
                </CardDescription>
              </div>
              {user?.role === UserRole.ACADEMY && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation(`/exams/${examId}/assign`)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Assign Students
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No students are currently enrolled in this exam.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Student</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-left p-2 font-medium">Score</th>
                        <th className="text-left p-2 font-medium">Assigned</th>
                        <th className="text-left p-2 font-medium">Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{enrollment.student?.name || "Unknown"}</div>
                              <div className="text-sm text-gray-500">{enrollment.student?.email}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant={
                              enrollment.status === "PASSED" ? "success" : 
                              enrollment.status === "FAILED" ? "destructive" :
                              enrollment.status === "STARTED" ? "warning" : 
                              "secondary"
                            }>
                              {enrollment.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {enrollment.score !== null ? `${enrollment.score}%` : "—"}
                          </td>
                          <td className="p-2">
                            {enrollment.isAssigned ? "Yes" : "No"}
                          </td>
                          <td className="p-2">
                            {enrollment.certificateId ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setLocation(`/certificates/${enrollment.certificateId}`)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Results Tab - Only visible to academy and super admin */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Exam Results</CardTitle>
              <CardDescription>
                View pass rates and student performance data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No results available yet. Students need to take the exam first.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium mb-2">Pass Rate</h3>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                            <div 
                              className="bg-green-500 h-2.5 rounded-full" 
                              style={{ width: `${passRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{passRate}%</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {passedCount} out of {studentCount} students passed
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium mb-2">Average Score</h3>
                        <div className="text-2xl font-bold">
                          {enrollments.filter(e => e.score !== null).length > 0 
                            ? Math.round(enrollments.filter(e => e.score !== null).reduce((sum, e) => sum + e.score, 0) / 
                                enrollments.filter(e => e.score !== null).length)
                            : 0}%
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Based on {enrollments.filter(e => e.score !== null).length} completed exams
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium mb-2">Completion Rate</h3>
                        <div className="text-2xl font-bold">
                          {Math.round((enrollments.filter(e => e.status === "COMPLETED" || e.status === "PASSED" || e.status === "FAILED").length / 
                            enrollments.length) * 100)}%
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {enrollments.filter(e => e.status === "COMPLETED" || e.status === "PASSED" || e.status === "FAILED").length} 
                          {" "}out of {enrollments.length} students completed
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Exam Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Exam Preview: {exam.title}</DialogTitle>
            <DialogDescription>
              This is how students will see the exam. Questions are shown in order with all options.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-8">
              <div className="flex justify-between items-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div>
                  <p className="font-medium">Time Limit: {exam.duration} minutes</p>
                  <p className="text-sm text-gray-500">Passing Score: {exam.passingScore}%</p>
                </div>
                <Badge>{questions.length} Questions</Badge>
              </div>
              
              {questions.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-gray-500">No questions have been added to this exam yet.</p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <Badge>
                        {question.points} {question.points === 1 ? "point" : "points"}
                      </Badge>
                    </div>
                    
                    <p>{question.text}</p>
                    
                    {question.type === "MULTIPLE_CHOICE" && question.options && (
                      <div className="space-y-2 ml-4">
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                            <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center">
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            <span>{option.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.type === "TRUE_FALSE" && (
                      <div className="space-y-2 ml-4">
                        <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                          <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center">
                            A
                          </div>
                          <span>True</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                          <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center">
                            B
                          </div>
                          <span>False</span>
                        </div>
                      </div>
                    )}
                    
                    {question.type === "SHORT_ANSWER" && (
                      <div className="mt-2">
                        <div className="border rounded p-3 bg-gray-50 dark:bg-gray-800 min-h-[80px] text-gray-400">
                          Text answer area
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              
              <div className="flex justify-end space-x-4 border-t pt-4">
                <Button variant="outline" disabled>Previous</Button>
                <Button variant="outline">Next</Button>
                <Button variant="default" disabled>Submit Exam</Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
