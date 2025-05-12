import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Certificate } from "@shared/schema";

export const useCertificatesQuery = () => {
  return useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/certificates");
      return await res.json();
    },
  });
};

export const useCertificateQuery = (certificateId: number) => {
  return useQuery<Certificate>({
    queryKey: ["/api/certificates", certificateId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/certificates/${certificateId}`);
      return await res.json();
    },
    enabled: !!certificateId,
  });
};
