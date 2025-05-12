import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const useExamQuery = (examId: number) => {
  return useQuery({
    queryKey: ["/api/exams", examId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/exams/${examId}`);
      return await res.json();
    },
    enabled: !!examId,
  });
};

export const useExamsQuery = () => {
  return useQuery({
    queryKey: ["/api/exams"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/exams");
      return await res.json();
    },
  });
};

export const useExamQuestionsQuery = (examId: number) => {
  return useQuery({
    queryKey: ["/api/exams", examId, "questions"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/exams/${examId}/questions`);
      return await res.json();
    },
    enabled: !!examId,
  });
};

export const useExamPurchasesQuery = (examId: number) => {
  return useQuery({
    queryKey: ["/api/exam-purchases", { examId }],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/exam-purchases?examId=${examId}`
      );
      return await res.json();
    },
    enabled: !!examId,
  });
};

// For academies to view available exams in marketplace
export const useAvailableExamsQuery = () => {
  return useQuery<any[]>({
    queryKey: ["/api/exams/available"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/exams/available");
      return await res.json();
    },
  });
};
