import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export const useStartExamMutation = () => {
  return useMutation({
    mutationFn: async (enrollmentId: number) => {
      const res = await apiRequest(
        "PUT",
        `/api/enrollments/${enrollmentId}/start`,
        {}
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
    },
  });
};

export const useEnrollExamMutation = () => {
  return useMutation({
    mutationFn: async (examId: number) => {
      const res = await apiRequest("POST", "/api/enrollments", {
        examId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
    },
  });
};
