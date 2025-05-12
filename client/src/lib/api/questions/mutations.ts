import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { insertQuestionSchema } from "@shared/schema";

// Create question mutation
export const useCreateQuestionMutation = (examId: number) => {
  return useMutation({
    mutationFn: async (questionData: z.infer<typeof insertQuestionSchema>) => {
      const res = await apiRequest("POST", `/api/exams/${examId}/questions`, {
        ...questionData,
        examId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/exams", examId, "questions"],
      });
    },
  });
};

// Update question mutation
export const useUpdateQuestionMutation = (examId: number) => {
  return useMutation({
    mutationFn: async ({
      questionId,
      data,
    }: {
      questionId: number;
      data: z.infer<typeof insertQuestionSchema>;
    }) => {
      const res = await apiRequest(
        "PUT",
        `/api/exams/${examId}/questions/${questionId}`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/exams", examId, "questions"],
      });
    },
  });
};

// Delete question mutation
export const useDeleteQuestionMutation = (examId: number) => {
  return useMutation({
    mutationFn: async (questionId: number) => {
      await apiRequest(
        "DELETE",
        `/api/exams/${examId}/questions/${questionId}`
      );
      return questionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/exams", examId, "questions"],
      });
    },
  });
};
