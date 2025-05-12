import React from "react";
import { Calendar, Clock, FileText, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { Exam, Question, Option } from "@shared/schema";

interface ExamPreviewProps {
  exam: Exam;
  questions: (Question & { options: Option[] })[];
  showAnswers?: boolean;
}

export default function ExamPreview({ exam, questions, showAnswers = true }: ExamPreviewProps) {
  // Calculate total points
  const totalPoints = questions.reduce((total, q) => total + (q.points || 0), 0);
  
  // Calculate hours and minutes from duration
  const timeHours = Math.floor(exam.duration / 60);
  const timeMinutes = exam.duration % 60;

  return (
    <div className="space-y-8">
      {/* Exam Header */}
      <div className="border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">{exam.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{exam.description}</p>
        
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
              {exam.passingScore}%
            </div>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-md">
            <div className="text-xs text-muted-foreground mb-1">
              {exam.price > 0 ? "Price" : "Free"}
            </div>
            <div className="font-medium">
              {formatCurrency(exam.price)}
            </div>
          </div>
        </div>
        
        {exam.examDate && (
          <div className="mt-4 p-3 border rounded-md flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Scheduled</div>
              <div className="text-sm text-muted-foreground">
                {new Date(exam.examDate).toLocaleDateString()} 
                {exam.examTime && ` at ${exam.examTime}`}
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <Badge variant={exam.status === "PUBLISHED" ? "success" : "secondary"}>
            {exam.status}
          </Badge>
        </div>
      </div>
      
      {/* Questions Preview */}
      {questions.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            No questions have been added to this exam yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={index} className="border rounded-lg">
              <CardContent className="p-5">
                <div className="flex justify-between mb-3">
                  <div className="font-medium">Question {index + 1}</div>
                  <div className="text-sm text-muted-foreground">{question.points} points</div>
                </div>
                
                <p className="mb-4">{question.text}</p>
                
                {question.type === "MULTIPLE_CHOICE" && question.options && (
                  <div className="space-y-3 ml-1">
                    {question.options.map((option, optIndex) => (
                      <div 
                        key={optIndex} 
                        className={`flex items-center space-x-2 p-2 rounded-md ${
                          showAnswers && option.isCorrect 
                            ? 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500' 
                            : ''
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center
                          ${showAnswers && option.isCorrect 
                            ? 'border-green-500 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                            : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {showAnswers && option.isCorrect && <Check className="h-3 w-3" />}
                        </div>
                        <span className={showAnswers && option.isCorrect ? "font-medium" : ""}>
                          {option.text}
                        </span>
                        {showAnswers && option.isCorrect && (
                          <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                            (Correct)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {question.type === "TRUE_FALSE" && question.options && (
                  <div className="space-y-3 ml-1">
                    {question.options.map((option, optIndex) => (
                      <div 
                        key={optIndex} 
                        className={`flex items-center space-x-2 p-2 rounded-md ${
                          showAnswers && option.isCorrect 
                            ? 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500' 
                            : ''
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center
                          ${showAnswers && option.isCorrect 
                            ? 'border-green-500 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                            : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {showAnswers && option.isCorrect && <Check className="h-3 w-3" />}
                        </div>
                        <span className={showAnswers && option.isCorrect ? "font-medium" : ""}>
                          {option.text}
                        </span>
                        {showAnswers && option.isCorrect && (
                          <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                            (Correct)
                          </span>
                        )}
                      </div>
                    ))}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}