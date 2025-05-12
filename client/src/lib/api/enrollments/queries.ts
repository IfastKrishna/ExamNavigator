import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const useEnrollmentsQuery = () => {
  return useQuery<any[]>({
    queryKey: ["/api/enrollments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/enrollments");
      return await res.json();
    },
  });
};
