import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, insertAcademySchema, insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layouts/main-layout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Building2 } from "lucide-react";
import { useEffect } from "react";

// Define the form schema for creating academy with credentials
const createAcademySchema = z.object({
  name: z.string().min(3, "Academy name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED"]),
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminEmail: z.string().email("Please enter a valid email address"),
  adminUsername: z.string().min(3, "Username must be at least 3 characters"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type CreateAcademyForm = z.infer<typeof createAcademySchema>;

export default function CreateAcademyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(true);

  // Redirect if not Super Admin
  useEffect(() => {
    if (user && user.role !== UserRole.SUPER_ADMIN) {
      setLocation("/academies");
    }
  }, [user, setLocation]);

  // Setup form with validation
  const form = useForm<CreateAcademyForm>({
    resolver: zodResolver(createAcademySchema),
    defaultValues: {
      name: "",
      description: "",
      status: "ACTIVE",
      adminName: "",
      adminEmail: "",
      adminUsername: "",
      adminPassword: "",
    },
  });

  // Create academy and admin user mutation
  const createAcademyMutation = useMutation({
    mutationFn: async (data: CreateAcademyForm) => {
      // First, create the admin user
      const adminData = {
        name: data.adminName,
        email: data.adminEmail,
        username: data.adminUsername,
        password: data.adminPassword,
        role: UserRole.ACADEMY,
      };
      
      const userRes = await apiRequest("POST", "/api/register", adminData);
      const userData = await userRes.json();
      
      // Then create the academy with the new user ID
      const academyData = {
        name: data.name,
        description: data.description,
        status: data.status,
        userId: userData.id, // Link the academy to the admin
      };
      
      const academyRes = await apiRequest("POST", "/api/academies", academyData);
      return await academyRes.json();
    },
    onSuccess: () => {
      toast({
        title: "Academy Created",
        description: "The academy and admin account have been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/academies"] });
      setLocation("/academies");
    },
    onError: (error) => {
      toast({
        title: "Failed to create academy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateAcademyForm) => {
    createAcademyMutation.mutate(data);
  };

  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return null;
  }

  return (
    <MainLayout title="Create Academy" subtitle="Create a new academy with admin credentials">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/academies")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Academies
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Academy</CardTitle>
          <CardDescription>
            Fill out the form below to create a new academy and its administrator account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="academy" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger 
                value="academy" 
                onClick={() => setIsCreatingAdmin(true)}
              >
                Academy Information
              </TabsTrigger>
              <TabsTrigger 
                value="admin" 
                onClick={() => setIsCreatingAdmin(false)}
              >
                Admin Credentials
              </TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <TabsContent value="academy">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Academy Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter academy name" {...field} />
                          </FormControl>
                          <FormDescription>
                            The official name of the academy.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter academy description" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            A brief description of the academy, its courses and specialties.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select academy status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="SUSPENDED">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Active academies can purchase and manage exams immediately.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end mt-6">
                      <Button 
                        type="button" 
                        onClick={() => {
                          // Validate academy fields before proceeding
                          form.trigger(["name", "description", "status"]).then((isValid) => {
                            if (isValid) document.getElementById("admin-tab-trigger")?.click();
                          });
                        }}
                      >
                        Next: Admin Credentials
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="admin">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="adminName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter admin name" {...field} />
                          </FormControl>
                          <FormDescription>
                            Full name of the academy administrator.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Enter admin email" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Valid email for account notifications.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="adminUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormDescription>
                              Username for the admin account.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="adminPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder="Enter password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum 6 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => document.getElementById("academy-tab-trigger")?.click()}
                      >
                        Back to Academy Info
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createAcademyMutation.isPending}
                      >
                        {createAcademyMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Academy"
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </MainLayout>
  );
}