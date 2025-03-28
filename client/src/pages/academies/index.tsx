import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, EyeIcon, Building2 } from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function AcademiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
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
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Academy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Academy</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Academy Name</Label>
                      <Input
                        id="name"
                        value={academyForm.name}
                        onChange={(e) => setAcademyForm({ ...academyForm, name: e.target.value })}
                        placeholder="Enter academy name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={academyForm.description}
                        onChange={(e) => setAcademyForm({ ...academyForm, description: e.target.value })}
                        placeholder="Enter academy description"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={academyForm.status}
                        onChange={(e) => setAcademyForm({ ...academyForm, status: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setOpenDialog(false)}
                    >
                      Cancel
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
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
                        <Button variant="ghost" size="icon">
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
