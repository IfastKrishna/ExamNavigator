import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const useStudentsQuery = (academyId?: number) => {
  return useQuery({
    queryKey: ["/api/students", { academyId }],
    queryFn: async () => {
      const endpoint = academyId
        ? `/api/academies/${academyId}/students`
        : "/api/students";

      const res = await apiRequest("GET", endpoint);
      return await res.json();
    },
    enabled: academyId ? !!academyId : true,
  });
};

export const useStudentQuery = (studentId: number) => {
  return useQuery({
    queryKey: ["/api/students", studentId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/students/${studentId}`);
      return await res.json();
    },
    enabled: !!studentId,
  });
};

export const useStudentExamsQuery = (studentId: number) => {
  return useQuery({
    queryKey: ["/api/students", studentId, "exams"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/students/${studentId}/exams`);
      return await res.json();
    },
    enabled: !!studentId,
  });
};

export const useStudentEnrollmentsQuery = (studentId: number) => {
  return useQuery({
    queryKey: ["/api/students", studentId, "enrollments"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/students/${studentId}/enrollments`
      );
      return await res.json();
    },
    enabled: !!studentId,
  });
};
