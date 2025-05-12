import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export const useCreateExamPurchaseMutation = () => {
  return useMutation({
    mutationFn: async (purchaseData: { examId: number; userId?: number }) => {
      const res = await apiRequest("POST", "/api/exam-purchases", purchaseData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-purchases"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/profile/purchases"],
      });

      if (data.userId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/users", data.userId, "purchases"],
        });
      }
      if (data.examId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/exams", data.examId],
        });
      }
    },
  });
};

export const useUpdateExamPurchaseMutation = (purchaseId: number) => {
  return useMutation({
    mutationFn: async (purchaseData: any) => {
      const res = await apiRequest(
        "PUT",
        `/api/exam-purchases/${purchaseId}`,
        purchaseData
      );
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-purchases"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/exam-purchases", purchaseId],
      });

      if (data.userId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/users", data.userId, "purchases"],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/users/profile/purchases"],
        });
      }
      if (data.examId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/exams", data.examId],
        });
      }
    },
  });
};

export const useDeleteExamPurchaseMutation = () => {
  return useMutation({
    mutationFn: async (purchaseId: number) => {
      await apiRequest("DELETE", `/api/exam-purchases/${purchaseId}`);
      return purchaseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-purchases"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/profile/purchases"],
      });
    },
  });
};
