import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export const useCreateAcademyMutation = () => {
  return useMutation({
    mutationFn: async (academyData: any) => {
      const res = await apiRequest("POST", "/api/academies", academyData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academies"] });
    },
  });
};

export const useUpdateAcademyMutation = (academyId: number) => {
  return useMutation({
    mutationFn: async (academyData: any) => {
      const res = await apiRequest(
        "PUT",
        `/api/academies/${academyId}`,
        academyData
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academies"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/academies", academyId],
      });
    },
  });
};

export const useDeleteAcademyMutation = () => {
  return useMutation({
    mutationFn: async (academyId: number) => {
      await apiRequest("DELETE", `/api/academies/${academyId}`);
      return academyId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academies"] });
    },
  });
};

export interface CreateAcademyWithCredentialsData {
  name: string;
  description: string;
  status: string;
  academyUsername: string;
  academyPassword: string;
  academyEmail: string;
}

export const useCreateAcademyWithCredentialsMutation = () => {
  return useMutation({
    mutationFn: async (data: CreateAcademyWithCredentialsData) => {
      try {
        // First, create the admin user for the academy
        const adminData = {
          name: data.name, // Use academy name as the admin name
          email: data.academyEmail,
          username: data.academyUsername,
          password: data.academyPassword,
          role: UserRole.ACADEMY,
        };

        const userRes = await apiRequest("POST", "/api/register", adminData);
        if (!userRes.ok) {
          const errorData = await userRes.json();
          throw new Error(errorData.message || "Failed to create academy user");
        }

        const userData = await userRes.json();

        // Then create the academy with the new user ID
        const academyData = {
          name: data.name,
          description: data.description,
          contactEmail: data.academyEmail,
          status: data.status,
          userId: userData.id, // Link the academy to the admin
        };

        const academyRes = await apiRequest(
          "POST",
          "/api/academies",
          academyData
        );

        if (!academyRes.ok) {
          const errorData = await academyRes.json();
          throw new Error(errorData.message || "Failed to create academy");
        }

        return await academyRes.json();
      } catch (error: any) {
        console.error("Academy creation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academies"] });
    },
  });
};
