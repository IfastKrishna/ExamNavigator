import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum([UserRole.STUDENT, UserRole.ACADEMY]), // SUPER_ADMIN not allowed for registration
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form setup
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form setup
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      role: UserRole.STUDENT,
    },
  });

  // Handle login submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  // Handle registration submission
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      {/* Form Column */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center lg:text-left">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              ExamPortal
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your centralized platform for online examinations
            </p>
          </div>

          <div className="mt-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                          </>
                        ) : (
                          "Sign in"
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>

              {/* Registration Form */}
              <TabsContent value="register">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Choose a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Register as</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value={UserRole.STUDENT}>Student</option>
                                <option value={UserRole.ACADEMY}>Academy</option>
                                <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Hero Column */}
      <div className="hidden lg:block relative flex-1 bg-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-90"></div>
        <div className="relative flex flex-col justify-center h-full px-8 text-white">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to ExamPortal
          </h1>
          <p className="text-xl mb-8">
            The comprehensive online examination platform for academies and students.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-white text-primary">✓</div>
              <p className="ml-3 text-lg">Create and manage online exams easily</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-white text-primary">✓</div>
              <p className="ml-3 text-lg">Take exams from anywhere, anytime</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-white text-primary">✓</div>
              <p className="ml-3 text-lg">Get instant results and certificates</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-white text-primary">✓</div>
              <p className="ml-3 text-lg">Track progress with detailed analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
