import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const useExamPurchasesQuery = (filters?: {
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
    queryKey: ["/api/exam-purchases", filters],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/exam-purchases${queryString}`);
      return await res.json();
    },
  });
};

export const useExamPurchaseQuery = (purchaseId: number) => {
  return useQuery({
    queryKey: ["/api/exam-purchases", purchaseId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/exam-purchases/${purchaseId}`);
      return await res.json();
    },
    enabled: !!purchaseId,
  });
};

export const useUserExamPurchasesQuery = (userId: number) => {
  return useQuery({
    queryKey: ["/api/users", userId, "purchases"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}/purchases`);
      return await res.json();
    },
    enabled: !!userId,
  });
};

export const useCurrentUserPurchasesQuery = () => {
  return useQuery({
    queryKey: ["/api/users/profile/purchases"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/profile/purchases");
      return await res.json();
    },
  });
};
