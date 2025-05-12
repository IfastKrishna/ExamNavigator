import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Academy } from "@shared/schema";

export const useAcademiesQuery = () => {
  return useQuery<Academy[]>({
    queryKey: ["/api/academies"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/academies");
      return await res.json();
    },
  });
};

export const useAcademyQuery = (academyId: number) => {
  return useQuery({
    queryKey: ["/api/academies", academyId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/academies/${academyId}`);
      return await res.json();
    },
    enabled: !!academyId,
  });
};