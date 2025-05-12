import { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLoginMutation, useLogoutMutation, useRegisterMutation } from "@/lib/api/auth";
import { useUserProfileQuery } from "@/lib/api/users";
import { UserRole } from "@shared/schema";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  academyId?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginMutation: ReturnType<typeof useLoginMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // API mutations
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  // User profile query
  const { data: profileData, isLoading } = useUserProfileQuery();

  // Set user when profile data loads
  useEffect(() => {
    if (profileData) {
      setUser(profileData);
    }
  }, [profileData]);

  // Add handlers to login mutation
  const originalLoginMutate = loginMutation.mutate;
  loginMutation.mutate = (credentials: any, options?: any) => {
    return originalLoginMutate(credentials, {
      onSuccess: (data) => {
        setUser(data.user);
        toast({
          title: "Login Success",
          description: "Welcome back!",
        });
        if (options?.onSuccess) options.onSuccess(data);
      },
      onError: (error: any) => {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
        if (options?.onError) options.onError(error);
      },
      ...options
    });
  };

  // Add handlers to register mutation
  const originalRegisterMutate = registerMutation.mutate;
  registerMutation.mutate = (data: any, options?: any) => {
    return originalRegisterMutate(data, {
      onSuccess: (response) => {
        toast({
          title: "Registration Successful",
          description: "Your account has been created!",
        });
        
        // Auto login after registration
        loginMutation.mutate({
          username: data.username,
          password: data.password,
        });
        
        if (options?.onSuccess) options.onSuccess(response);
      },
      onError: (error: any) => {
        toast({
          title: "Registration Failed",
          description: error.message || "Could not create your account",
          variant: "destructive",
        });
        if (options?.onError) options.onError(error);
      },
      ...options
    });
  };

  // Add handlers to logout mutation
  const originalLogoutMutate = logoutMutation.mutate;
  logoutMutation.mutate = (options?: any) => {
    return originalLogoutMutate(undefined, {
      onSuccess: (data) => {
        setUser(null);
        toast({
          title: "Logged Out",
          description: "You have been logged out successfully",
        });
        if (options?.onSuccess) options.onSuccess(data);
      },
      ...options
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginMutation,
        registerMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
