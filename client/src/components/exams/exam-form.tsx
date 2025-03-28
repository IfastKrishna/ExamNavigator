import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertExamSchema, insertQuestionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, Plus, Trash2, Save, ArrowLeft, AlertTriangle } from "lucide-react";

// Extend the exam schema for the form
const examFormSchema = insertExamSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  duration: z.coerce.number().min(5, "Duration must be at least 5 minutes"),
  passingScore: z.coerce.number().min(1, "Passing score must be at least 1%").max(100, "Passing score cannot exceed 100%"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

// Schema for question with options
const questionWithOptionsSchema = insertQuestionSchema.extend({
  text: z.string().min(5, "Question text must be at least 5 characters"),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
  points: z.coerce.number().min(1, "Points must be at least 1"),
  options: z.array(
    z.object({
      text: z.string().min(1, "Option text is required"),
      isCorrect: z.boolean().default(false),
    })
  ).optional(),
});

type ExamFormProps = {
  examId?: number;
  defaultValues?: z.infer<typeof examFormSchema>;
};

export default function ExamForm({ examId, defaultValues }: ExamFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<z.infer<typeof questionWithOptionsSchema>[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<z.infer<typeof questionWithOptionsSchema> | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Form for the exam details
  const form = useForm<z.infer<typeof examFormSchema>>({
    resolver: zodResolver(examFormSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      duration: 60,
      passingScore: 70,
      price: 0,
      status: "DRAFT",
      academyId: 0, // This will be set by the server based on the logged-in user
    },
  });

  // Form for adding/editing questions
  const questionForm = useForm<z.infer<typeof questionWithOptionsSchema>>({
    resolver: zodResolver(questionWithOptionsSchema),
    defaultValues: {
      text: "",
      type: "MULTIPLE_CHOICE",
      points: 1,
      examId: 0, // This will be set later
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  });

  // Field array for options
  const { fields, append, remove } = useFieldArray({
    control: questionForm.control,
    name: "options",
  });

  // Create exam mutation
  const createExamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof examFormSchema>) => {
      const res = await apiRequest("POST", "/api/exams", data);
      return await res.json();
    },
    onSuccess: (createdExam) => {
      // Add questions if any
      if (questions.length > 0) {
        questions.forEach(async (question) => {
          const questionData = {
            ...question,
            examId: createdExam.id,
          };
          
          try {
            await apiRequest("POST", `/api/exams/${createdExam.id}/questions`, questionData);
          } catch (error) {
            console.error("Failed to add question:", error);
          }
        });
      }
      
      toast({
        title: "Exam Created",
        description: "Your exam has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      setLocation("/exams");
    },
    onError: (error) => {
      toast({
        title: "Failed to create exam",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update exam mutation
  const updateExamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof examFormSchema>) => {
      const res = await apiRequest("PUT", `/api/exams/${examId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Exam Updated",
        description: "Your exam has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      setLocation("/exams");
    },
    onError: (error) => {
      toast({
        title: "Failed to update exam",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: z.infer<typeof examFormSchema>) => {
    if (questions.length === 0) {
      setShowUnsavedWarning(true);
      return;
    }
    
    if (examId) {
      updateExamMutation.mutate(data);
    } else {
      createExamMutation.mutate(data);
    }
  };

  const handleAddQuestion = () => {
    setIsAddingQuestion(true);
    questionForm.reset({
      text: "",
      type: "MULTIPLE_CHOICE",
      points: 1,
      examId: 0,
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    });
  };

  const handleEditQuestion = (question: z.infer<typeof questionWithOptionsSchema>, index: number) => {
    setIsEditingQuestion(true);
    setEditingQuestionIndex(index);
    
    // If the question doesn't have options (e.g., for SHORT_ANSWER type), initialize with empty array
    const options = question.options || [];
    
    questionForm.reset({
      ...question,
      options: options.length > 0 ? options : [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    });
  };

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleSaveQuestion = (data: z.infer<typeof questionWithOptionsSchema>) => {
    // Validate that true/false questions have exactly 2 options
    if (data.type === "TRUE_FALSE" && data.options && data.options.length !== 2) {
      toast({
        title: "Invalid Options",
        description: "True/False questions must have exactly 2 options.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that at least one option is marked as correct for multiple choice
    if (data.type === "MULTIPLE_CHOICE" && data.options && !data.options.some(opt => opt.isCorrect)) {
      toast({
        title: "No Correct Answer",
        description: "Please mark at least one option as correct.",
        variant: "destructive",
      });
      return;
    }
    
    // If editing, update the question
    if (isEditingQuestion && editingQuestionIndex !== null) {
      const newQuestions = [...questions];
      newQuestions[editingQuestionIndex] = data;
      setQuestions(newQuestions);
      setIsEditingQuestion(false);
      setEditingQuestionIndex(null);
    } 
    // Otherwise add a new question
    else {
      setQuestions([...questions, data]);
      setIsAddingQuestion(false);
    }
    
    // Reset form
    questionForm.reset();
  };

  return (
    <div className="space-y-6">
      {/* Exam Details Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{examId ? "Edit Exam" : "Create New Exam"}</CardTitle>
              <CardDescription>
                Enter the details for your exam. Add questions after saving the basic details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter exam title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter exam description" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a brief description of the exam content and objectives.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passingScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passing Score (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Draft exams are not visible to students. Published exams are available for enrollment.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Questions Section */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    Add questions to your exam. You can add multiple choice, true/false, or short answer questions.
                  </CardDescription>
                </div>
                <Button 
                  type="button" 
                  onClick={handleAddQuestion}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No questions added yet. Click "Add Question" to start creating your exam.
                  </p>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {questions.map((question, index) => (
                    <AccordionItem key={index} value={`question-${index}`}>
                      <AccordionTrigger className="hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-2 rounded-md">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="text-left">
                            <span className="font-medium">
                              Question {index + 1}: {question.text}
                            </span>
                            <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {question.type === "MULTIPLE_CHOICE" ? "Multiple Choice" : 
                               question.type === "TRUE_FALSE" ? "True/False" : "Short Answer"}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {question.points} {question.points === 1 ? "point" : "points"}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-2">
                        {question.options && question.options.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <p className="font-medium">Options:</p>
                            <ul className="ml-6 list-disc">
                              {question.options.map((option, optIndex) => (
                                <li key={optIndex} className={option.isCorrect ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                                  {option.text} {option.isCorrect && "(Correct)"}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditQuestion(question, index)}
                          >
                            Edit
                          </Button>
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteQuestion(index)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation("/exams")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createExamMutation.isPending || updateExamMutation.isPending}
              >
                {createExamMutation.isPending || updateExamMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {examId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {examId ? "Update Exam" : "Create Exam"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Add/Edit Question Dialog */}
      <Dialog 
        open={isAddingQuestion || isEditingQuestion} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingQuestion(false);
            setIsEditingQuestion(false);
            setEditingQuestionIndex(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
          </DialogHeader>
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(handleSaveQuestion)} className="space-y-4">
              <FormField
                control={questionForm.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your question" 
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={questionForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Type</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          
                          // Reset options based on type
                          if (value === "TRUE_FALSE") {
                            questionForm.setValue("options", [
                              { text: "True", isCorrect: false },
                              { text: "False", isCorrect: false }
                            ]);
                          } else if (value === "SHORT_ANSWER") {
                            questionForm.setValue("options", []);
                          } else if (value === "MULTIPLE_CHOICE") {
                            if (!questionForm.getValues("options") || questionForm.getValues("options").length === 0) {
                              questionForm.setValue("options", [
                                { text: "", isCorrect: false },
                                { text: "", isCorrect: false },
                                { text: "", isCorrect: false },
                                { text: "", isCorrect: false }
                              ]);
                            }
                          }
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                          <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                          <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={questionForm.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Options section for multiple choice and true/false */}
              {(questionForm.watch("type") === "MULTIPLE_CHOICE" || questionForm.watch("type") === "TRUE_FALSE") && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-base">Options</FormLabel>
                    {questionForm.watch("type") === "MULTIPLE_CHOICE" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ text: "", isCorrect: false })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    )}
                  </div>
                  
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start space-x-2">
                      <FormField
                        control={questionForm.control}
                        name={`options.${index}.isCorrect`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 mt-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionForm.control}
                        name={`options.${index}.text`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder={`Option ${index + 1}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {questionForm.watch("type") === "MULTIPLE_CHOICE" && fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="mt-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsAddingQuestion(false);
                    setIsEditingQuestion(false);
                    setEditingQuestionIndex(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditingQuestion ? "Update Question" : "Add Question"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog for No Questions */}
      <Dialog 
        open={showUnsavedWarning} 
        onOpenChange={setShowUnsavedWarning}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              No Questions Added
            </DialogTitle>
          </DialogHeader>
          <p>
            You haven't added any questions to your exam. Students won't be able to take an exam without questions.
          </p>
          <p>
            Do you want to continue saving this exam as a draft?
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUnsavedWarning(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowUnsavedWarning(false);
                if (examId) {
                  updateExamMutation.mutate(form.getValues());
                } else {
                  createExamMutation.mutate(form.getValues());
                }
              }}
            >
              Save as Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
