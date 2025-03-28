import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, UserPlus, XCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User, UserRole } from "@shared/schema";

interface AssignStudentsDialogProps {
  examId: number;
  examTitle: string;
}

export default function AssignStudentsDialog({
  examId,
  examTitle,
}: AssignStudentsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Get students
  const { data: students = [], isLoading: loadingStudents } = useQuery<User[]>({
    queryKey: ["/api/users/role/STUDENT"],
    enabled: open,
  });

  // Get existing enrollments for this exam
  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery<any[]>({
    queryKey: ["/api/exams", examId, "enrollments"],
    enabled: open,
  });

  // Filter out already enrolled students
  const availableStudents = students.filter(student => {
    return !enrollments.some(enrollment => 
      enrollment.studentId === student.id
    );
  });

  // Filtered students based on search query
  const filteredStudents = availableStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to toggle student selection
  const toggleStudentSelection = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Clear selections when dialog is closed
  useEffect(() => {
    if (!open) {
      setSelectedStudents([]);
      setSearchQuery("");
    }
  }, [open]);

  // Mutation to assign students
  const assignStudentsMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const response = await apiRequest("POST", "/api/enrollments", {
        examId,
        studentId,
        isAssigned: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams", examId, "enrollments"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to assign student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle assignment of selected students
  const handleAssignStudents = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No students selected",
        description: "Please select at least one student to assign",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use Promise.all to assign all students in parallel
      await Promise.all(
        selectedStudents.map(studentId => assignStudentsMutation.mutateAsync(studentId))
      );

      toast({
        title: "Students assigned",
        description: `Successfully assigned ${selectedStudents.length} student(s) to the exam`,
      });

      setOpen(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Students
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Assign Students to Exam</DialogTitle>
          <DialogDescription>
            Select students to assign to the exam: <strong>{examTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="assign" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assign">Assign New Students</TabsTrigger>
            <TabsTrigger value="enrolled">Currently Enrolled</TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="mt-4">
            <div className="flex items-center mb-4">
              <Search className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name, username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {loadingStudents ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>All students are already enrolled in this exam.</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No students found matching your search.</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Select</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                          />
                        </TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.username}</TableCell>
                        <TableCell>{student.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {selectedStudents.length} student(s) selected
              </div>
              <Button 
                onClick={handleAssignStudents} 
                disabled={selectedStudents.length === 0 || assignStudentsMutation.isPending}
              >
                {assignStudentsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Assign Selected Students
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="enrolled" className="mt-4">
            {loadingEnrollments ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No students are currently enrolled in this exam.</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>{enrollment.student?.name}</TableCell>
                        <TableCell>{enrollment.student?.username}</TableCell>
                        <TableCell>{enrollment.student?.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            enrollment.status === "PASSED" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                              : enrollment.status === "FAILED"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                              : enrollment.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                              : enrollment.status === "STARTED"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                          }`}>
                            {enrollment.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {enrollment.isAssigned ? (
                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full">
                              Assigned
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 px-2 py-1 rounded-full">
                              Self-enrolled
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            <XCircle className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}