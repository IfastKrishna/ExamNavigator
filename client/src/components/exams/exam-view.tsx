import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, type Exam, type Academy, type Question, type Option } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Edit, Clock, Award, Users, DollarSign, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ExamViewProps {
  examId: number;
}

export default function ExamView({ examId }: ExamViewProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

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

  if (isLoadingExam || isLoadingAcademy || isLoadingQuestions) {
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
                <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <DollarSign className="h-4 w-4 mr-1" /> {formatCurrency(exam.price)}
                </span>
              </div>
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setLocation("/exams")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
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
                      <p className="font-semibold">78</p> {/* This would come from actual data */}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {user?.role === UserRole.ACADEMY && (
                <div>
                  <h3 className="font-medium mb-2">Performance</h3>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                      <div 
                        className="bg-green-500 h-2.5 rounded-full" 
                        style={{ width: '85%' }} /* This would be actual data */
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">85% Pass Rate</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6">
              {user?.role === UserRole.STUDENT && (
                <Button className="ml-auto">
                  <CheckCircle className="mr-2 h-4 w-4" />
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
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>
                Students who have enrolled in this exam.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  Student enrollment data would be displayed here.
                </p>
              </div>
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
              <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  Exam performance analytics would be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
