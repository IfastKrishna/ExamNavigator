import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, type User } from "@shared/schema";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, Search, GraduationCap, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { getInitials } from "@/lib/utils";

export default function StudentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all students
  const { data: students = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users", { role: UserRole.STUDENT }],
    queryFn: async () => {
      // In a real app, this would be an API call that filters by role
      return [
        { id: 1, username: "student1", name: "John Doe", email: "john@example.com", role: UserRole.STUDENT, createdAt: new Date().toISOString() },
        { id: 2, username: "student2", name: "Jane Smith", email: "jane@example.com", role: UserRole.STUDENT, createdAt: new Date().toISOString() },
        { id: 3, username: "student3", name: "Michael Johnson", email: "michael@example.com", role: UserRole.STUDENT, createdAt: new Date().toISOString() },
        { id: 4, username: "student4", name: "Emily Davis", email: "emily@example.com", role: UserRole.STUDENT, createdAt: new Date().toISOString() },
        { id: 5, username: "student5", name: "Robert Wilson", email: "robert@example.com", role: UserRole.STUDENT, createdAt: new Date().toISOString() },
      ];
    },
    enabled: user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ACADEMY
  });

  // Fetch enrollments for the academy
  const { data: enrollments = [] } = useQuery({
    queryKey: ["/api/enrollments"],
    enabled: user?.role === UserRole.ACADEMY
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.username.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (user?.role === UserRole.ACADEMY) {
      if (activeTab === "enrolled") {
        return enrollments.some(e => e.studentId === student.id);
      } else if (activeTab === "active") {
        return enrollments.some(e => e.studentId === student.id && e.status === "STARTED");
      } else if (activeTab === "completed") {
        return enrollments.some(e => e.studentId === student.id && (e.status === "PASSED" || e.status === "FAILED"));
      }
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <MainLayout title="Students" subtitle="Manage and view all students">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading students...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Students" subtitle="Manage and view all students">
      <Card className="transition-colors duration-200">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl font-bold">Students</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search students..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {user?.role === UserRole.ACADEMY && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList>
                <TabsTrigger value="all">All Students</TabsTrigger>
                <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <GraduationCap className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Students Found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                {searchQuery 
                  ? "No students match your search criteria. Try a different search term."
                  : "There are currently no students in this category."}
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
                    {user?.role === UserRole.ACADEMY && (
                      <>
                        <TableHead>Exams Enrolled</TableHead>
                        <TableHead>Exams Completed</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    // These would be calculated from real data in a full implementation
                    const examsEnrolled = 3;
                    const examsCompleted = 2;
                    const status = examsEnrolled > 0 ? "Active" : "Inactive";
                    
                    return (
                      <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-white">
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-2 font-medium">{student.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.username}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        {user?.role === UserRole.ACADEMY && (
                          <>
                            <TableCell>{examsEnrolled}</TableCell>
                            <TableCell>{examsCompleted}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={status === "Active" ? "success" : "secondary"}
                              >
                                {status}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <UserIcon className="h-4 w-4 mr-1" />
                            View Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
