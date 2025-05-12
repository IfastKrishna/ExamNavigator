import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export const useProcessPaymentMutation = () => {
  return useMutation({
    mutationFn: async (paymentData: {
      examId: number;
      quantity: number;
      paymentMethod: string;
      cardDetails?: any;
    }) => {
      const res = await apiRequest(
        "POST",
        "/api/payments/process",
        paymentData
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exam-purchases"] });
    },
  });
};

// Verify payment intent/session
export const useVerifyPaymentMutation = () => {
  return useMutation({
    mutationFn: async (verificationData: {
      paymentId: string;
      examId: number;
    }) => {
      const res = await apiRequest(
        "POST",
        "/api/payments/verify",
        verificationData
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exam-purchases"] });
    },
  });
};
