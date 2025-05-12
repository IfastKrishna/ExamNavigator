import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { insertExamSchema, insertQuestionSchema } from "@shared/schema";

// Create exam mutation
export const useCreateExamMutation = () => {
  return useMutation({
    mutationFn: async (data: z.infer<typeof insertExamSchema>) => {
      const res = await apiRequest("POST", "/api/exams", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
    },
  });
};

// Update exam mutation
export const useUpdateExamMutation = (examId: number) => {
  return useMutation({
    mutationFn: async (data: z.infer<typeof insertExamSchema>) => {
      const res = await apiRequest("PUT", `/api/exams/${examId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams", examId] });
    },
  });
};

// Delete exam mutation
export const useDeleteExamMutation = () => {
  return useMutation({
    mutationFn: async (examId: number) => {
      await apiRequest("DELETE", `/api/exams/${examId}`);
      return examId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
    },
  });
};

// Purchase exam mutation for academies
export const usePurchaseExamMutation = () => {
  return useMutation({
    mutationFn: async ({
      examId,
      quantity,
    }: {
      examId: number;
      quantity: number;
    }) => {
      const res = await apiRequest("POST", "/api/exams/purchase", {
        examId,
        quantity,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
    },
  });
};
