import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export const useStartExamAttemptMutation = () => {
  return useMutation({
    mutationFn: async ({ examId }: { examId: number }) => {
      const res = await apiRequest("POST", "/api/exam-attempts", { examId });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-attempts"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/profile/attempts"],
      });
      if (data.examId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/exams", data.examId],
        });
      }
    },
  });
};

export const useSubmitExamAttemptMutation = (attemptId: number) => {
  return useMutation({
    mutationFn: async (
      answers: Array<{ questionId: number; answer: string | string[] }>
    ) => {
      const res = await apiRequest(
        "PUT",
        `/api/exam-attempts/${attemptId}/submit`,
        { answers }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-attempts"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/exam-attempts", attemptId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/exam-attempts", attemptId, "results"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/profile/attempts"],
      });

      if (data.examId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/exams", data.examId],
        });
      }
    },
  });
};

export const useSaveExamProgressMutation = (attemptId: number) => {
  return useMutation({
    mutationFn: async (
      answers: Array<{ questionId: number; answer: string | string[] }>
    ) => {
      const res = await apiRequest(
        "PUT",
        `/api/exam-attempts/${attemptId}/save-progress`,
        { answers }
      );
      return await res.json();
    },
  });
};
