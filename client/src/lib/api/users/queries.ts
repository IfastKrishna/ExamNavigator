import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const useUsersQuery = () => {
  return useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
  });
};

export const useUserQuery = (userId: number) => {
  return useQuery({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}`);
      return await res.json();
    },
    enabled: !!userId,
  });
};

export const useUserProfileQuery = () => {
  return useQuery({
    queryKey: ["/api/users/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user");
      return await res.json();
    },
  });
};

// Get users filtered by role
export const useUsersByRoleQuery = (role: string) => {
  return useQuery({
    queryKey: ["/api/users", { role }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users?role=${role}`);
      return await res.json();
    },
  });
};
