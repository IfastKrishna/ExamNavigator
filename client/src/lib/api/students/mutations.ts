import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserRole } from "@shared/schema";

interface CreateStudentData {
  name: string;
  email: string;
  username: string;
  password: string;
}

interface AssignStudentToAcademyData {
  studentId: number;
  academyId: number;
}

export const useCreateStudentMutation = () => {
  return useMutation({
    mutationFn: async (data: CreateStudentData) => {
      // Add the student role automatically
      const studentData = {
        ...data,
        role: UserRole.STUDENT,
      };

      const res = await apiRequest("POST", "/api/register", studentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
  });
};

export const useUpdateStudentMutation = (studentId: number) => {
  return useMutation({
    mutationFn: async (data: Partial<CreateStudentData>) => {
      const res = await apiRequest("PUT", `/api/students/${studentId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
    },
  });
};

export const useAssignStudentToAcademyMutation = () => {
  return useMutation({
    mutationFn: async ({
      studentId,
      academyId,
    }: AssignStudentToAcademyData) => {
      const res = await apiRequest(
        "POST",
        `/api/academies/${academyId}/students`,
        {
          studentId,
        }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.academyId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/academies", data.academyId, "students"],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
  });
};
