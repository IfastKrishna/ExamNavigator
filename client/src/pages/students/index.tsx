import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";
import { useStudentsQuery } from "@/lib/api/students";
import { useAcademiesQuery } from "@/lib/api/academies";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Plus, Eye, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

export default function StudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get academy ID if current user is an academy
  const academyId = user?.role === UserRole.ACADEMY ? user.academyId : undefined;
  
  // Fetch students using our organized API query
  const { data: students = [], isLoading: isLoadingStudents } = useStudentsQuery(academyId);
  
  // Fetch academies for super admin view
  const { data: academies = [], isLoading: isLoadingAcademies } = useAcademiesQuery();
  
  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate loading state
  const isLoading = isLoadingStudents || (user?.role === UserRole.SUPER_ADMIN && isLoadingAcademies);

  // Add academy names to students for super admin view
  const studentsWithAcademyNames = filteredStudents.map(student => {
    if (user?.role === UserRole.SUPER_ADMIN && student.academyId) {
      const academy = academies.find(a => a.id === student.academyId);
      return {
        ...student,
        academyName: academy?.name || "Unknown Academy"
      };
    }
    return student;
  });

  if (isLoading) {
    return (
      <MainLayout title="Students" subtitle="View and manage students">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading students...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Students" subtitle="View and manage students">
      <Card className="transition-colors duration-200">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl font-bold">Students</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search students..."
                  className="pl-8 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ACADEMY) && (
                <Button onClick={() => setLocation("/students/create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-3">
                <Search className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Students Found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                {searchQuery 
                  ? "No students match your search criteria. Try a different search term."
                  : user?.role === UserRole.ACADEMY
                  ? "You haven't added any students yet."
                  : "There are no students in the system yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    {user?.role === UserRole.SUPER_ADMIN && <TableHead>Academy</TableHead>}
                    <TableHead>Registration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithAcademyNames.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell>
                        <div className="font-medium">{student.name}</div>
                      </TableCell>
                      <TableCell>{student.username}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      {user?.role === UserRole.SUPER_ADMIN && (
                        <TableCell>{student.academyName || "Not assigned"}</TableCell>
                      )}
                      <TableCell>{formatDate(student.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLocation(`/students/${student.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/students/${student.id}/edit`)}>
                              Edit
                            </DropdownMenuItem>
                            {user?.role === UserRole.SUPER_ADMIN && !student.academyId && (
                              <DropdownMenuItem onClick={() => setLocation(`/students/${student.id}/assign`)}>
                                Assign to Academy
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
