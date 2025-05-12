import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Get dashboard stats for user
export const useDashboardStatsQuery = () => {
  return useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/stats");
      return await res.json();
    },
  });
};

// Get recent activity for user
export const useRecentActivityQuery = () => {
  return useQuery({
    queryKey: ["/api/dashboard/activity"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/activity");
      return await res.json();
    },
  });
};

// Get upcoming exams for user
export const useUpcomingExamsQuery = () => {
  return useQuery({
    queryKey: ["/api/dashboard/upcoming-exams"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/upcoming-exams");
      return await res.json();
    },
  });
};
