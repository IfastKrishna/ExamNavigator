import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, type Academy } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MainLayout from "@/components/layouts/main-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, EyeIcon, Building2 } from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function AcademiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [openDialog, setOpenDialog] = useState(false);
  const [academyForm, setAcademyForm] = useState({
    name: "",
    description: "",
    status: "ACTIVE"
  });

  // Fetch academies
  const { data: academies = [], isLoading } = useQuery<Academy[]>({
    queryKey: ["/api/academies"],
  });

  // Create academy mutation (Super Admin only)
  const createAcademyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/academies", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Academy Created",
        description: "The academy has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/academies"] });
      setOpenDialog(false);
      setAcademyForm({ name: "", description: "", status: "ACTIVE" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create academy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyForm.name) {
      toast({
        title: "Validation error",
        description: "Academy name is required",
        variant: "destructive",
      });
      return;
    }
    
    createAcademyMutation.mutate({
      ...academyForm,
      userId: 0, // This would be assigned on the server
    });
  };

  const canCreateAcademy = user?.role === UserRole.SUPER_ADMIN;

  if (isLoading) {
    return (
      <MainLayout title="Academies" subtitle="Manage and view all academies">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading academies...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Academies" subtitle="Manage and view all academies">
      <Card className="transition-colors duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold">Academies List</CardTitle>
          {canCreateAcademy && (
            <Button onClick={() => setLocation("/academies/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Academy
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {academies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Academies Found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                {user?.role === UserRole.SUPER_ADMIN
                  ? "Get started by adding your first academy using the 'Add Academy' button above."
                  : "There are currently no academies available in the system."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Exams</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academies.map((academy) => (
                    <TableRow key={academy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 bg-gray-200 dark:bg-gray-600">
                            <AvatarFallback className="text-gray-500 dark:text-gray-300">
                              {getInitials(academy.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{academy.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {academy.description || "No description provided"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {academy.studentsCount || "0"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {academy.examsCount || "0"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={academy.status === "ACTIVE" ? "success" : 
                                  academy.status === "PENDING" ? "warning" : "secondary"}
                        >
                          {academy.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/academies/${academy.id}`)}>
                          <EyeIcon className="h-4 w-4 text-primary dark:text-accent" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
