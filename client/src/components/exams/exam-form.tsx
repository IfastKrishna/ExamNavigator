import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertExamSchema, insertQuestionSchema, UserRole, type Academy } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2, X, Plus, Trash2, Save, ArrowLeft, AlertTriangle, Eye, Clock, GripVertical, FileText, Calendar, LayoutGrid, Settings, Check } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Extend the exam schema for the form
const examFormSchema = insertExamSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  duration: z.coerce.number().min(5, "Duration must be at least 5 minutes"),
  passingScore: z.coerce.number().min(1, "Passing score must be at least 1%").max(100, "Passing score cannot exceed 100%"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  examDate: z.date().optional().nullable(),
  examTime: z.string().optional().nullable(),
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
  const { user } = useAuth();
  const [questions, setQuestions] = useState<z.infer<typeof questionWithOptionsSchema>[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<z.infer<typeof questionWithOptionsSchema> | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [timeHours, setTimeHours] = useState<number>(0);
  const [timeMinutes, setTimeMinutes] = useState<number>(60);
  
  // Check if user is Super Admin
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  
  // Fetch academies data for user context
  const { data: academies = [] } = useQuery<Academy[]>({
    queryKey: ["/api/academies"],
  });

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
      examDate: null,
      examTime: null,
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

  // Initialize time inputs from form duration
  useState(() => {
    const duration = form.getValues("duration") || 60;
    setTimeHours(Math.floor(duration / 60));
    setTimeMinutes(duration % 60);
  });

  // Calculate total exam points
  const totalPoints = questions.reduce((total, q) => total + (q.points || 0), 0);

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
    
    // Prepare data for submission
    let finalData = data;
    
    // Always set status to PUBLISHED for exams going to marketplace
    if (!examId) {
      // For new exams, set status to PUBLISHED automatically
      finalData = { ...data, status: "PUBLISHED" };
    }
    
    // For Academy users, get their academy data
    if (user?.role === UserRole.ACADEMY) {
      const academy = academies.find(a => a.userId === user.id);
      finalData = { ...finalData, academyId: academy?.id || 0 };
    }
    
    if (examId) {
      updateExamMutation.mutate(finalData);
    } else {
      createExamMutation.mutate(finalData);
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

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setQuestions(items);
  };

  // Handle time change (hours and minutes)
  const handleTimeChange = (hours: number, minutes: number) => {
    setTimeHours(hours);
    setTimeMinutes(minutes);
    
    // Update the form duration field (total minutes)
    const totalMinutes = (hours * 60) + minutes;
    form.setValue("duration", totalMinutes);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Exam Details
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" /> Questions
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" /> Preview
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Exam Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>{examId ? "Edit Exam" : "Create New Exam"}</CardTitle>
                  <CardDescription>
                    Enter the details for your exam. You can add questions in the Questions tab.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" /> Timing
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Hours</FormLabel>
                          <Input 
                            type="number" 
                            min="0" 
                            value={timeHours}
                            onChange={(e) => handleTimeChange(parseInt(e.target.value) || 0, timeMinutes)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <FormLabel>Minutes</FormLabel>
                          <Input 
                            type="number" 
                            min="0" 
                            max="59" 
                            value={timeMinutes}
                            onChange={(e) => handleTimeChange(timeHours, parseInt(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="examDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exam Date (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      field.onChange(new Date(e.target.value));
                                    } else {
                                      field.onChange(null);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Set a specific date for the exam
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      
                        <FormField
                          control={form.control}
                          name="examTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="time" 
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormDescription>
                                Set a start time (24hr format)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" /> Scoring & Status
                      </h3>

                      <FormField
                        control={form.control}
                        name="passingScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Passing Score (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" max="100" {...field} />
                            </FormControl>
                            <FormDescription>
                              Minimum percentage required to pass the exam
                            </FormDescription>
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
                            <FormDescription>
                              Set to 0 for free exams
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                              Draft exams are not visible to students
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Academy selection removed as all exams now go directly to the marketplace */}
                  
                  <div className="flex items-center justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setLocation("/exams")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("questions")}
                      className="ml-auto"
                    >
                      Next: Add Questions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Exam Questions</CardTitle>
                      <CardDescription>
                        Add questions to your exam. You can reorder them by dragging.
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
                    <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">
                        No questions added yet. Click "Add Question" to start creating your exam.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Questions: {questions.length}</span>
                          <span className="text-sm font-medium">Total Points: {totalPoints}</span>
                        </div>
                      </div>
                      
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="questions">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-3"
                            >
                              {questions.map((question, index) => (
                                <Draggable key={index} draggableId={`question-${index}`} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="border rounded-lg overflow-hidden"
                                    >
                                      <div className="bg-muted/30 p-3 flex items-center">
                                        <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center">
                                            <span className="font-medium">Question {index + 1}</span>
                                            <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                              {question.type === "MULTIPLE_CHOICE" ? "Multiple Choice" : 
                                              question.type === "TRUE_FALSE" ? "True/False" : "Short Answer"}
                                            </span>
                                            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                                              {question.points} {question.points === 1 ? "point" : "points"}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex space-x-2 ml-2">
                                          <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => handleEditQuestion(question, index)}
                                          >
                                            <Settings className="h-4 w-4" />
                                          </Button>
                                          <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => handleDeleteQuestion(index)}
                                            className="text-destructive hover:text-destructive/90"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="p-4 bg-background">
                                        <p className="font-medium mb-2">{question.text}</p>
                                        
                                        {question.options && question.options.length > 0 && (
                                          <div className="ml-4 mt-3">
                                            <ul className="space-y-2">
                                              {question.options.map((option, optIndex) => (
                                                <li key={optIndex} className="flex items-center gap-2">
                                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                                    option.isCorrect 
                                                      ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:border-green-300 dark:text-green-300' 
                                                      : 'border-gray-300 dark:border-gray-600'
                                                  }`}>
                                                    {option.isCorrect && <Check className="h-3 w-3" />}
                                                  </div>
                                                  <span className={option.isCorrect ? "font-medium" : ""}>
                                                    {option.text}
                                                  </span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("details")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Details
                  </Button>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("preview")}
                      disabled={questions.length === 0}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Exam
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
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Preview Exam</CardTitle>
                  <CardDescription>
                    This is how the exam will appear to students.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {questions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">
                        No questions have been added to this exam yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="border rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-2">{form.getValues("title")}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">{form.getValues("description")}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                          <div className="p-3 bg-muted/30 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Duration</div>
                            <div className="font-medium flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {timeHours > 0 ? `${timeHours}h ` : ""}{timeMinutes > 0 ? `${timeMinutes}m` : ""}
                            </div>
                          </div>
                          
                          <div className="p-3 bg-muted/30 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Questions</div>
                            <div className="font-medium flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {questions.length}
                            </div>
                          </div>
                          
                          <div className="p-3 bg-muted/30 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Passing Score</div>
                            <div className="font-medium">
                              {form.getValues("passingScore")}%
                            </div>
                          </div>
                          
                          <div className="p-3 bg-muted/30 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Points</div>
                            <div className="font-medium">
                              {totalPoints} pts
                            </div>
                          </div>
                        </div>
                        
                        {form.getValues("examDate") && (
                          <div className="mt-4 p-3 border rounded-md flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Scheduled</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(form.getValues("examDate") as Date).toLocaleDateString()} 
                                {form.getValues("examTime") && ` at ${form.getValues("examTime")}`}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-6">
                        {questions.map((question, index) => (
                          <div key={index} className="border rounded-lg p-5">
                            <div className="flex justify-between mb-3">
                              <div className="font-medium">Question {index + 1}</div>
                              <div className="text-sm text-muted-foreground">{question.points} points</div>
                            </div>
                            
                            <p className="mb-4">{question.text}</p>
                            
                            {question.type === "MULTIPLE_CHOICE" && question.options && (
                              <div className="space-y-2 ml-1">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-center space-x-2">
                                    <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600"></div>
                                    <span>{option.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.type === "TRUE_FALSE" && question.options && (
                              <div className="space-y-2 ml-1">
                                <div className="flex items-center space-x-2">
                                  <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600"></div>
                                  <span>True</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600"></div>
                                  <span>False</span>
                                </div>
                              </div>
                            )}
                            
                            {question.type === "SHORT_ANSWER" && (
                              <div className="mt-2">
                                <Textarea 
                                  placeholder="Enter your answer here..." 
                                  className="h-[100px]" 
                                  disabled
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("questions")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Questions
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
            </TabsContent>
          </form>
        </Form>
      </Tabs>

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
