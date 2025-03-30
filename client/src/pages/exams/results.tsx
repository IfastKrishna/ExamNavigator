import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Award, CheckCircle, XCircle, Download, Printer } from "lucide-react";
import MainLayout from "@/components/layouts/main-layout";

export default function ExamResultsPage() {
  const { examId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string[]>([]);

  // Fetch the exam
  const { data: exam, isLoading: isLoadingExam } = useQuery({
    queryKey: ["/api/exams", parseInt(examId as string)],
    enabled: !!examId,
  });

  // Fetch questions with correct answers
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["/api/exams", parseInt(examId as string), "questions"],
    enabled: !!examId,
  });

  // Fetch student enrollment and attempts for this exam
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/enrollments"],
    enabled: !!user && user.role === UserRole.STUDENT,
  });

  // Fetch attempts (answers) for the enrollment
  const { data: attempts = [], isLoading: isLoadingAttempts } = useQuery({
    queryKey: ["/api/attempts"],
    enabled: !!user && user.role === UserRole.STUDENT && enrollments.length > 0,
  });

  // Get the current enrollment for this exam
  const enrollment = enrollments.find((e: any) => 
    e.examId === parseInt(examId as string) && e.studentId === user?.id
  );

  // Check if enrollment is completed
  const isCompleted = enrollment?.status === "COMPLETED" || 
                     enrollment?.status === "PASSED" || 
                     enrollment?.status === "FAILED";

  // Organize attempts by question ID
  const attemptsByQuestion = attempts.reduce((acc: any, attempt: any) => {
    acc[attempt.questionId] = attempt;
    return acc;
  }, {});

  // Calculate scores
  const calculateResults = () => {
    if (!questions.length || !enrollment) return null;
    
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    
    questions.forEach((question: any) => {
      totalPoints += question.points;
      const attempt = attemptsByQuestion[question.id];
      
      if (attempt) {
        if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
          // Check if selected option is correct
          const selectedOption = question.options.find((opt: any) => opt.id === attempt.selectedOptionId);
          if (selectedOption && selectedOption.isCorrect) {
            correctAnswers++;
            earnedPoints += question.points;
          }
        }
        // For short answers, assume they were manually graded and scores are in the attempt
        else if (question.type === "SHORT_ANSWER" && attempt.isCorrect) {
          correctAnswers++;
          earnedPoints += question.points;
        }
      }
    });
    
    const scorePercentage = Math.round((earnedPoints / totalPoints) * 100);
    const isPassed = scorePercentage >= (exam?.passingScore || 0);
    
    return {
      correctAnswers,
      totalQuestions: questions.length,
      earnedPoints,
      totalPoints,
      scorePercentage,
      isPassed,
    };
  };

  const results = calculateResults();

  // Check if student has a certificate
  const certificate = enrollment?.certificateId;

  // Toggle accordion item
  const toggleItem = (value: string) => {
    if (expanded.includes(value)) {
      setExpanded(expanded.filter(item => item !== value));
    } else {
      setExpanded([...expanded, value]);
    }
  };

  if (isLoadingExam || isLoadingQuestions || isLoadingEnrollments || isLoadingAttempts) {
    return (
      <MainLayout title="Exam Results" subtitle="View your exam results">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading results...</span>
        </div>
      </MainLayout>
    );
  }

  if (!exam || !enrollment || !isCompleted) {
    return (
      <MainLayout title="Results Not Available" subtitle="The exam results are not available">
        <Card>
          <CardHeader>
            <CardTitle>Results Not Available</CardTitle>
            <CardDescription>
              This exam has not been completed yet or you don't have access to view these results.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/exams")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Exams
            </Button>
          </CardFooter>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Exam Results" 
      subtitle={`Your results for ${exam.title}`}
    >
      <div className="space-y-6">
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Results</span>
              {results?.isPassed ? (
                <Badge variant="success" className="text-base py-1 px-3">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Passed
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-base py-1 px-3">
                  <XCircle className="h-4 w-4 mr-2" />
                  Failed
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Completed on {new Date(enrollment.completedAt).toLocaleDateString()} at {new Date(enrollment.completedAt).toLocaleTimeString()}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold mb-1">{results?.scorePercentage}%</div>
                <div className="text-sm text-muted-foreground">Your Score</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold mb-1">
                  {results?.earnedPoints}/{results?.totalPoints}
                </div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold mb-1">
                  {results?.correctAnswers}/{results?.totalQuestions}
                </div>
                <div className="text-sm text-muted-foreground">Correct Answers</div>
              </div>
            </div>

            {certificate && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Award className="h-8 w-8 text-blue-500 dark:text-blue-300 mr-3" />
                    <div>
                      <h3 className="font-medium">Congratulations!</h3>
                      <p className="text-sm text-muted-foreground">
                        You've earned a certificate for passing this exam.
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Answers and Explanations</CardTitle>
            <CardDescription>
              Review your answers and see the correct solutions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" value={expanded} className="w-full">
              {questions.map((question: any, index: number) => {
                const attempt = attemptsByQuestion[question.id];
                let isCorrect = false;
                
                if (attempt) {
                  if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
                    const selectedOption = question.options.find((opt: any) => opt.id === attempt.selectedOptionId);
                    isCorrect = selectedOption?.isCorrect || false;
                  } else if (question.type === "SHORT_ANSWER") {
                    isCorrect = attempt.isCorrect || false;
                  }
                }
                
                const accordionValue = `question-${question.id}`;
                
                return (
                  <AccordionItem key={question.id} value={accordionValue}>
                    <AccordionTrigger 
                      onClick={() => toggleItem(accordionValue)}
                      className="hover:bg-muted/50 px-4 py-3 rounded-lg"
                    >
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                          )}
                          <span className="font-medium text-left">
                            Question {index + 1}: {question.text}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground ml-2">
                          {question.points} {question.points === 1 ? "point" : "points"}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Your Answer:</h4>
                          {question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE" ? (
                            attempt?.selectedOptionId ? (
                              <div className="pl-4 border-l-2 border-muted">
                                {question.options.find((opt: any) => opt.id === attempt.selectedOptionId)?.text || "No answer selected"}
                              </div>
                            ) : (
                              <div className="pl-4 border-l-2 border-muted text-muted-foreground">
                                No answer provided
                              </div>
                            )
                          ) : (
                            <div className="pl-4 border-l-2 border-muted">
                              {attempt?.textAnswer || "No answer provided"}
                            </div>
                          )}
                        </div>
                        
                        <Separator />
                        
                        {(question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") && (
                          <div>
                            <h4 className="font-medium mb-2">Correct Answer:</h4>
                            <div className="pl-4 border-l-2 border-green-500 dark:border-green-700">
                              {question.options.find((opt: any) => opt.isCorrect)?.text || "Not specified"}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline"
              onClick={() => setLocation("/exams")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Exams
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}