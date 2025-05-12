import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const useExamAttemptsQuery = (filters?: {
  examId?: number;
  userId?: number;
}) => {
  const queryParams = new URLSearchParams();

  if (filters?.examId) {
    queryParams.append("examId", filters.examId.toString());
  }

  if (filters?.userId) {
    queryParams.append("userId", filters.userId.toString());
  }

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : "";

  return useQuery({
    queryKey: ["/api/exam-attempts", filters],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/exam-attempts${queryString}`);
      return await res.json();
    },
  });
};

export const useExamAttemptQuery = (attemptId: number) => {
  return useQuery({
    queryKey: ["/api/exam-attempts", attemptId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/exam-attempts/${attemptId}`);
      return await res.json();
    },
    enabled: !!attemptId,
  });
};

export const useCurrentUserAttemptsQuery = () => {
  return useQuery({
    queryKey: ["/api/users/profile/attempts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/profile/attempts");
      return await res.json();
    },
  });
};

export const useExamAttemptResultsQuery = (attemptId: number) => {
  return useQuery({
    queryKey: ["/api/exam-attempts", attemptId, "results"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/exam-attempts/${attemptId}/results`
      );
      return await res.json();
    },
    enabled: !!attemptId,
  });
};
