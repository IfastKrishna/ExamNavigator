import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserRole } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Clock, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, FileText, List } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TakeExamPage() {
  const { examId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number | null>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [activeView, setActiveView] = useState<"questions" | "overview">("questions");
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch the exam
  const { data: exam, isLoading: isLoadingExam } = useQuery({
    queryKey: ["/api/exams", parseInt(examId as string)],
    enabled: !!examId,
  });

  // Fetch questions
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["/api/exams", parseInt(examId as string), "questions"],
    enabled: !!examId,
  });

  // Fetch student enrollment for this exam
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/enrollments"],
    enabled: !!user && user.role === UserRole.STUDENT,
    onSuccess: (enrollments) => {
      const enrollment = enrollments.find((e: any) => 
        e.examId === parseInt(examId as string) && 
        e.studentId === user?.id
      );
      
      if (enrollment) {
        setEnrollmentData(enrollment);
        
        if (enrollment.status !== "STARTED") {
          // Redirect if the enrollment status is not STARTED
          toast({
            title: "Cannot access exam",
            description: "This exam is not currently active for you.",
            variant: "destructive",
          });
          setLocation("/exams");
        }
      } else {
        // No enrollment found, redirect
        toast({
          title: "Not enrolled",
          description: "You are not enrolled in this exam.",
          variant: "destructive",
        });
        setLocation("/exams");
      }
    },
  });

  // Mutation to save an answer
  const saveAnswerMutation = useMutation({
    mutationFn: async (data: { 
      enrollmentId: number;
      questionId: number;
      selectedOptionId?: number | null;
      textAnswer?: string;
    }) => {
      const res = await apiRequest("POST", "/api/attempts", data);
      return await res.json();
    },
    onError: (error) => {
      toast({
        title: "Failed to save answer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to submit the exam
  const submitExamMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      const res = await apiRequest("PUT", `/api/enrollments/${enrollmentId}/complete`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Exam Submitted",
        description: "Your exam has been submitted successfully.",
      });
      
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      // Redirect to the exam results page
      setLocation(`/exams/${examId}/results`);
    },
    onError: (error) => {
      toast({
        title: "Failed to submit exam",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize timer
  useEffect(() => {
    if (exam && enrollmentData && enrollmentData.status === "STARTED") {
      // Calculate remaining time based on start time and duration
      const startedAt = new Date(enrollmentData.startedAt).getTime();
      const durationMs = exam.duration * 60 * 1000; // convert minutes to ms
      const endTime = startedAt + durationMs;
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setRemainingTime(remaining);
      
      // Start countdown timer
      const interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            // Auto-submit when time runs out
            if (enrollmentData) {
              submitExamMutation.mutate(enrollmentData.id);
            }
            return 0;
          }
          
          // Show warning when 5 minutes remaining
          if (prev === 300) {
            setShowTimeWarning(true);
          }
          
          return prev - 1;
        });
      }, 1000);
      
      setTimerInterval(interval);
      
      return () => clearInterval(interval);
    }
  }, [exam, enrollmentData]);

  // Save answer when user changes an option or text answer
  const saveAnswer = useCallback((questionId: number, optionId?: number | null, text?: string) => {
    if (!enrollmentData) return;
    
    saveAnswerMutation.mutate({
      enrollmentId: enrollmentData.id,
      questionId,
      selectedOptionId: optionId,
      textAnswer: text,
    });
  }, [enrollmentData, saveAnswerMutation]);

  // Handle option selection
  const handleOptionSelect = (questionId: number, optionId: number) => {
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionId,
    });
    
    // Save to backend
    saveAnswer(questionId, optionId);
  };

  // Handle text answer change
  const handleTextAnswerChange = (questionId: number, text: string) => {
    setTextAnswers({
      ...textAnswers,
      [questionId]: text,
    });
    
    // Debounce save to backend (simplified)
    saveAnswer(questionId, null, text);
  };

  // Format remaining time
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs > 0 ? `${hrs}:` : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle submitting the exam
  const handleSubmitExam = () => {
    if (enrollmentData) {
      submitExamMutation.mutate(enrollmentData.id);
    }
  };

  // Calculate progress
  const answeredQuestions = Object.keys(selectedOptions).length + Object.keys(textAnswers).length;
  const progressPercentage = questions.length > 0 
    ? Math.round((answeredQuestions / questions.length) * 100) 
    : 0;

  // Navigate to next question
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Navigate to previous question
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (isLoadingExam || isLoadingQuestions || isLoadingEnrollments) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading exam...</span>
        </div>
      </div>
    );
  }

  if (!exam || !enrollmentData) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Exam Not Found</CardTitle>
            <CardDescription>The exam you're looking for does not exist or you don't have access.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/exams")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Exams
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container py-5 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{exam.title}</h1>
        <div className="flex items-center">
          <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
          <span className={`text-lg font-mono ${remainingTime && remainingTime < 300 ? "text-red-500 font-bold" : ""}`}>
            {formatTime(remainingTime)}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Progress</span>
          <span>{answeredQuestions} of {questions.length} questions answered</span>
        </div>
        <Progress value={progressPercentage} />
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "questions" | "overview")}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="questions" className="flex items-center gap-2 w-full">
            <FileText className="h-4 w-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2 w-full">
            <List className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          {currentQuestion && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </CardTitle>
                  <CardDescription>
                    {currentQuestion.points} {currentQuestion.points === 1 ? "point" : "points"}
                  </CardDescription>
                </div>
                <Separator />
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-lg mb-4">{currentQuestion.text}</p>

                  {currentQuestion.type === "MULTIPLE_CHOICE" && currentQuestion.options && (
                    <RadioGroup
                      value={selectedOptions[currentQuestion.id]?.toString() || ""}
                      onValueChange={(value) => 
                        handleOptionSelect(currentQuestion.id, parseInt(value))
                      }
                      className="space-y-3"
                    >
                      {currentQuestion.options.map((option) => (
                        <div key={option.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50">
                          <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                          <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion.type === "TRUE_FALSE" && currentQuestion.options && (
                    <RadioGroup
                      value={selectedOptions[currentQuestion.id]?.toString() || ""}
                      onValueChange={(value) => 
                        handleOptionSelect(currentQuestion.id, parseInt(value))
                      }
                      className="space-y-3"
                    >
                      {currentQuestion.options.map((option) => (
                        <div key={option.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50">
                          <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                          <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion.type === "SHORT_ANSWER" && (
                    <Textarea
                      value={textAnswers[currentQuestion.id] || ""}
                      onChange={(e) => handleTextAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Enter your answer here..."
                      className="min-h-[150px]"
                    />
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={goToPrevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <Button onClick={goToNextQuestion}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={() => setActiveView("overview")}>
                    Review All Questions
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Exam Overview</CardTitle>
              <CardDescription>
                Review all your answers before submitting. You can still go back and change your answers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
                {questions.map((question, index) => {
                  const isAnswered = selectedOptions[question.id] !== undefined || 
                                    textAnswers[question.id] !== undefined;
                  
                  return (
                    <Button
                      key={question.id}
                      variant={isAnswered ? "default" : "outline"}
                      className={`h-10 w-10 p-0 font-medium ${
                        currentQuestionIndex === index ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => {
                        setCurrentQuestionIndex(index);
                        setActiveView("questions");
                      }}
                    >
                      {index + 1}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-primary mr-2"></div>
                    <span className="text-sm">Answered</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full border border-input mr-2"></div>
                    <span className="text-sm">Unanswered</span>
                  </div>
                </div>
                <div className="text-sm">
                  {answeredQuestions} of {questions.length} questions answered
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveView("questions")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Questions
              </Button>
              <Button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={submitExamMutation.isPending}
              >
                {submitExamMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Submit Exam
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Time Warning Dialog */}
      <AlertDialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-amber-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Time Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have less than 5 minutes remaining to complete the exam. The exam will be automatically submitted when the time runs out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue Exam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredQuestions < questions.length ? (
                <>
                  You have only answered {answeredQuestions} out of {questions.length} questions. 
                  Unanswered questions will be marked as incorrect. Are you sure you want to submit?
                </>
              ) : (
                <>
                  You have answered all {questions.length} questions. 
                  Are you sure you want to submit your exam? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitExam}>
              Submit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}