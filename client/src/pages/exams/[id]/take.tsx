import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, type Exam, type Question, type Option, type Enrollment } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TakeExamPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const examId = parseInt(id);
  
  // State for exam taking
  const [answers, setAnswers] = useState<{
    questionId: number;
    selectedOptionId?: number;
    textAnswer?: string;
  }[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<{
    score: number;
    passed: boolean;
    certificate?: any;
  } | null>(null);

  // Validate ID
  if (isNaN(examId)) {
    setLocation("/exams");
    return null;
  }

  // Fetch the exam details
  const { data: exam, isLoading: isLoadingExam } = useQuery<Exam>({
    queryKey: ["/api/exams", examId],
  });

  // Fetch enrollment
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
    enabled: !!user,
  });

  const enrollment = enrollments.find(e => 
    e.examId === examId && 
    e.status === "STARTED"
  );

  // Fetch questions
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<(Question & { options: Option[] })[]>({
    queryKey: ["/api/exams", examId, "questions"],
    enabled: !!enrollment && enrollment.status === "STARTED",
  });

  // Submit exam mutation
  const submitExamMutation = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);
      const res = await apiRequest("POST", `/api/enrollments/${enrollment?.id}/submit`, { answers });
      return await res.json();
    },
    onSuccess: (data) => {
      setExamSubmitted(true);
      setExamResult({
        score: data.score,
        passed: data.passed,
        certificate: data.certificate
      });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: data.passed ? "Exam Passed!" : "Exam Completed",
        description: data.passed 
          ? `Congratulations! You scored ${data.score}% and passed the exam.` 
          : `You scored ${data.score}% but did not meet the passing requirement.`,
        variant: data.passed ? "default" : "destructive",
      });
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Failed to submit exam",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize answers when questions load
  useEffect(() => {
    if (questions && questions.length > 0) {
      const initialAnswers = questions.map(q => ({
        questionId: q.id,
        selectedOptionId: undefined,
        textAnswer: undefined
      }));
      setAnswers(initialAnswers);
    }
  }, [questions]);

  // Initialize timer when exam loads
  useEffect(() => {
    if (exam && enrollment && enrollment.status === "STARTED") {
      // Calculate time left based on start time and duration
      const startedAt = new Date(enrollment.startedAt!);
      const durationMs = exam.duration * 60 * 1000;
      const endTime = new Date(startedAt.getTime() + durationMs);
      const now = new Date();
      const timeLeftMs = endTime.getTime() - now.getTime();
      
      // Convert to seconds
      const seconds = Math.max(0, Math.floor(timeLeftMs / 1000));
      setTimeLeft(seconds);
      
      // Set timer
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            // Auto submit when timer ends
            if (!examSubmitted && !isSubmitting) {
              submitExamMutation.mutate();
            }
            return 0;
          }
          
          // Show warning when 5 minutes left
          if (prev === 300) { // 5 minutes in seconds
            setShowTimeWarning(true);
          }
          
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [exam, enrollment, examSubmitted, isSubmitting, submitExamMutation]);

  // Handle answer changes
  const handleAnswerChange = (
    questionId: number, 
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER", 
    value: string | number
  ) => {
    setAnswers(prev => 
      prev.map(answer => {
        if (answer.questionId === questionId) {
          if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
            return { ...answer, selectedOptionId: value as number };
          } else {
            return { ...answer, textAnswer: value as string };
          }
        }
        return answer;
      })
    );
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? hours : null,
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  // Redirect if not a student
  if (user && user.role !== UserRole.STUDENT) {
    setLocation("/exams");
    return null;
  }

  // Check if enrollment exists and is started
  if (!isLoadingEnrollments && (!enrollment || enrollment.status !== "STARTED")) {
    return (
      <MainLayout title="Access Denied" subtitle="You don't have permission to take this exam">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You haven't started this exam or don't have permission to take it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>To take an exam, you need to be enrolled and start the exam from the exams page.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation("/exams")}>
              Back to Exams
            </Button>
          </CardFooter>
        </Card>
      </MainLayout>
    );
  }

  if (isLoadingExam || isLoadingEnrollments || isLoadingQuestions) {
    return (
      <MainLayout title="Loading Exam" subtitle="Preparing your exam...">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading exam...</span>
        </div>
      </MainLayout>
    );
  }

  // Show results if exam is submitted
  if (examSubmitted && examResult) {
    return (
      <MainLayout title="Exam Completed" subtitle="Your exam has been submitted">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 mb-4">
              {examResult.passed ? (
                <CheckCircle className="h-6 w-6 text-primary" />
              ) : (
                <AlertCircle className="h-6 w-6 text-destructive" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {examResult.passed ? "Congratulations!" : "Exam Completed"}
            </CardTitle>
            <CardDescription className="text-lg">
              {examResult.passed 
                ? `You have passed the exam with a score of ${examResult.score}%.` 
                : `You scored ${examResult.score}%, but did not meet the passing requirement of ${exam?.passingScore}%.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded-full h-4 mb-4">
              <div 
                className={`h-4 rounded-full ${examResult.passed ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${examResult.score}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your Score</p>
                  <p className="text-2xl font-bold">{examResult.score}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Passing Score</p>
                  <p className="text-2xl font-bold">{exam?.passingScore}%</p>
                </CardContent>
              </Card>
            </div>
            
            {examResult.passed && examResult.certificate && (
              <div className="mt-8 w-full max-w-md text-center">
                <h3 className="text-lg font-medium mb-2">Your Certificate</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your certificate has been generated. You can view and download it from the certificates page.
                </p>
                <Button onClick={() => setLocation(`/certificates/${examResult.certificate.id}`)}>
                  View Certificate
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => setLocation("/exams")}>
              Back to Exams
            </Button>
          </CardFooter>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={exam?.title || "Take Exam"} 
      subtitle="Answer all questions to complete the exam"
    >
      {/* Timer and Progress Bar */}
      <div className="sticky top-16 bg-background z-10 mb-6 pb-2 border-b">
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center">
            <Badge variant="outline" className="mr-2">
              Question {answers.filter(a => 
                a.selectedOptionId !== undefined || (a.textAnswer && a.textAnswer.trim() !== "")
              ).length} of {questions.length}
            </Badge>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {answers.filter(a => 
                a.selectedOptionId !== undefined || (a.textAnswer && a.textAnswer.trim() !== "")
              ).length} answered
            </div>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            <div className={`font-mono font-medium ${timeLeft && timeLeft < 300 ? 'text-red-500' : ''}`}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-primary dark:bg-accent h-2 rounded-full transition-all"
            style={{ 
              width: `${Math.round((answers.filter(a => 
                a.selectedOptionId !== undefined || (a.textAnswer && a.textAnswer.trim() !== "")
              ).length / questions.length) * 100)}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-8 mb-8">
        {questions.map((question, index) => (
          <Card key={question.id} id={`question-${question.id}`}>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                <Badge>
                  {question.type === "MULTIPLE_CHOICE" ? "Multiple Choice" : 
                   question.type === "TRUE_FALSE" ? "True/False" : "Short Answer"}
                </Badge>
              </div>
              <CardDescription className="text-base text-gray-800 dark:text-gray-200 mt-2">
                {question.text}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Multiple Choice or True/False */}
              {(question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") && (
                <RadioGroup
                  value={answers.find(a => a.questionId === question.id)?.selectedOptionId?.toString()}
                  onValueChange={(value) => handleAnswerChange(question.id, question.type, parseInt(value))}
                >
                  <div className="space-y-3">
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                        <Label htmlFor={`option-${option.id}`} className="text-gray-700 dark:text-gray-300">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
              {/* Short Answer */}
              {question.type === "SHORT_ANSWER" && (
                <Textarea 
                  placeholder="Enter your answer here..." 
                  className="min-h-[100px]"
                  value={answers.find(a => a.questionId === question.id)?.textAnswer || ""}
                  onChange={(e) => handleAnswerChange(question.id, question.type, e.target.value)}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-background p-4 border-t flex justify-between items-center">
        <div>
          <Badge variant={
            answers.filter(a => a.selectedOptionId !== undefined || (a.textAnswer && a.textAnswer.trim() !== "")).length === questions.length
              ? "success"
              : "warning"
          }>
            {answers.filter(a => a.selectedOptionId !== undefined || (a.textAnswer && a.textAnswer.trim() !== "")).length} of {questions.length} Answered
          </Badge>
        </div>
        <Button 
          size="lg" 
          onClick={() => setShowSubmitConfirm(true)}
          disabled={isSubmitting || answers.filter(a => a.selectedOptionId !== undefined || (a.textAnswer && a.textAnswer.trim() !== "")).length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Exam"
          )}
        </Button>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              You are about to submit your exam. 
              {answers.filter(a => a.selectedOptionId !== undefined || (a.textAnswer && a.textAnswer.trim() !== "")).length < questions.length && (
                <div className="mt-2 text-amber-600 dark:text-amber-400 font-medium">
                  Warning: You have only answered {answers.filter(a => a.selectedOptionId !== undefined || (a.textAnswer && a.textAnswer.trim() !== "")).length} out of {questions.length} questions.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Once submitted, you cannot return to the exam.</p>
            {answers.filter(a => a.selectedOptionId !== undefined || (a.textAnswer && a.textAnswer.trim() !== "")).length < questions.length && (
              <div className="mt-4 flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  You have unanswered questions. It's recommended to review your answers before submitting.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>
              Continue Exam
            </Button>
            <Button 
              onClick={() => {
                setShowSubmitConfirm(false);
                submitExamMutation.mutate();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Warning Dialog */}
      <Dialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Clock className="h-5 w-5 text-amber-500 mr-2" />
              Time Warning
            </DialogTitle>
            <DialogDescription>
              You have 5 minutes remaining to complete the exam.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Please review your answers and submit before the time expires.</p>
            <p className="mt-2">The exam will be automatically submitted when the timer reaches zero.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTimeWarning(false)}>
              Continue Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
