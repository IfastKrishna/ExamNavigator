import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { insertQuestionSchema } from "@shared/schema";

type QuestionWithOptionalId = z.infer<typeof insertQuestionSchema> & {
  id?: number;
};

/**
 * Updates multiple questions for an exam in one batch operation
 * - Creates new questions
 * - Updates existing questions
 * - Deletes removed questions
 */
export const batchUpdateExamQuestions = async (
  examId: number,
  questions: QuestionWithOptionalId[]
) => {
  // First get the current questions
  const existingQuestionsRes = await apiRequest(
    "GET",
    `/api/exams/${examId}/questions`
  );
  const existingQuestions = await existingQuestionsRes.json();

  // Map of existing question IDs
  const existingIds = new Set(existingQuestions.map((q: any) => q.id));

  // Process each question in our current state
  for (const question of questions) {
    if (question.id) {
      // Question exists - update it
      await apiRequest(
        "PUT",
        `/api/exams/${examId}/questions/${question.id}`,
        question
      );
      existingIds.delete(question.id);
    } else {
      // New question - create it
      await apiRequest("POST", `/api/exams/${examId}/questions`, {
        ...question,
        examId: examId,
      });
    }
  }

  // Delete questions that were removed
  for (const idToDelete of existingIds) {
    await apiRequest("DELETE", `/api/exams/${examId}/questions/${idToDelete}`);
  }

  return { success: true };
};
