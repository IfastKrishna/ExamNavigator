import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export const useUpdateUserMutation = (userId: number) => {
  return useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("PUT", `/api/users/${userId}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
    },
  });
};

export const useUpdateProfileMutation = () => {
  return useMutation({
    mutationFn: async (profileData: any) => {
      const res = await apiRequest("PUT", "/api/users/profile", profileData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
    },
  });
};

export const useDeleteUserMutation = () => {
  return useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
};
