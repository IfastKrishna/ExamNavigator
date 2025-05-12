import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AssignStudentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: any;
  onAssigned?: () => void;
};

export function AssignStudentsDialog({
  open,
  onOpenChange,
  exam,
  onAssigned,
}: AssignStudentsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [isAssigningMultiple, setIsAssigningMultiple] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch students data
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/users/role/STUDENT"],
    enabled: open && user?.role !== UserRole.STUDENT,
  });

  // Check if academy can assign students to this exam (has available licenses)
  const { data: assignability, isLoading: isCheckingAssignability } = useQuery({
    queryKey: ["/api/exam-purchases/can-assign", exam?.id],
    queryFn: async () => {
      if (!exam?.id) return { canAssign: false };
      const res = await apiRequest("GET", `/api/exam-purchases/can-assign?examId=${exam.id}`);
      return res.json();
    },
    enabled: open && exam?.purchased && user?.role === UserRole.ACADEMY,
  });

  // Enroll student mutation
  const enrollMutation = useMutation({
    mutationFn: async (studentId: string) => {
      // If exam is purchased, increment used quantity
      if (exam?.purchased && assignability?.purchase?.id) {
        await apiRequest("POST", "/api/exam-purchases/increment-used", { 
          purchaseId: assignability.purchase.id 
        });
      }

      // Create enrollment
      const res = await apiRequest("POST", "/api/enrollments", {
        examId: exam.id,
        studentId: parseInt(studentId),
        isAssigned: true,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Student Assigned",
        description: "The student has been assigned to this exam.",
      });

      // Reset selections
      setSelectedStudent("");
      setSelectedStudents([]);
      
      // Call the callback if provided
      if (onAssigned) {
        onAssigned();
      }
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk enrollment mutation
  const bulkEnrollMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const results = [];
      for (const studentId of studentIds) {
        try {
          // If exam is purchased, increment used quantity
          if (exam?.purchased && assignability?.purchase?.id) {
            await apiRequest("POST", "/api/exam-purchases/increment-used", { 
              purchaseId: assignability.purchase.id 
            });
          }

          // Create enrollment
          const res = await apiRequest("POST", "/api/enrollments", {
            examId: exam.id,
            studentId: parseInt(studentId),
            isAssigned: true,
          });
          
          const result = await res.json();
          results.push(result);
        } catch (error) {
          console.error(`Failed to enroll student ${studentId}:`, error);
        }
      }
      return results;
    },
    onSuccess: (results) => {
      toast({
        title: "Students Assigned",
        description: `Successfully assigned ${results.length} students to this exam.`,
      });

      // Reset selections
      setSelectedStudents([]);
      
      // Call the callback if provided
      if (onAssigned) {
        onAssigned();
      }
    },
    onError: (error) => {
      toast({
        title: "Bulk Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle student assignment
  const handleAssign = () => {
    if (isAssigningMultiple) {
      if (selectedStudents.length === 0) {
        toast({
          title: "No Students Selected",
          description: "Please select at least one student to assign.",
          variant: "destructive",
        });
        return;
      }
      
      bulkEnrollMutation.mutate(selectedStudents);
    } else {
      if (!selectedStudent) {
        toast({
          title: "No Student Selected",
          description: "Please select a student to assign.",
          variant: "destructive",
        });
        return;
      }
      
      enrollMutation.mutate(selectedStudent);
    }
  };

  // Toggle a student in the selected students array
  const toggleStudentSelection = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Determine if we can assign more students (based on available licenses)
  const canAssignMore = !exam?.purchased || 
    !assignability?.canAssign || 
    (assignability?.remainingQuantity && assignability.remainingQuantity > 0);

  // Calculate how many more students can be assigned
  const remainingAssignments = exam?.purchased ? 
    (assignability?.remainingQuantity || 0) : 
    Infinity;

  // Reset selections when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedStudent("");
      setSelectedStudents([]);
      setIsAssigningMultiple(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Students to Exam</DialogTitle>
          <DialogDescription>
            Assign students to <strong>{exam?.title}</strong>
            {exam?.purchased && assignability?.remainingQuantity !== undefined && (
              <span className="block mt-1 text-sm">
                {assignability.remainingQuantity} license(s) remaining
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoadingStudents || isCheckingAssignability ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <>
            {exam?.purchased && assignability?.remainingQuantity === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No licenses remaining</AlertTitle>
                <AlertDescription>
                  You have used all available licenses for this exam. Purchase more licenses to continue assigning students.
                </AlertDescription>
              </Alert>
            )}

            {students?.length === 0 ? (
              <div className="text-center py-6">
                <p>No students available to assign.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {isAssigningMultiple ? (
                  <div className="space-y-4">
                    <Label>Select Students</Label>
                    <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
                      {students.map((student: any) => (
                        <div key={student.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id.toString())}
                            onChange={() => toggleStudentSelection(student.id.toString())}
                            disabled={enrollMutation.isPending || bulkEnrollMutation.isPending || !canAssignMore}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label htmlFor={`student-${student.id}`}>
                            {student.name} ({student.email})
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Selected {selectedStudents.length} student(s) 
                      {exam?.purchased && ` of ${assignability?.remainingQuantity} remaining licenses`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Select Student</Label>
                    <Select
                      value={selectedStudent}
                      onValueChange={setSelectedStudent}
                      disabled={enrollMutation.isPending || !canAssignMore}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Students</SelectLabel>
                          {students.map((student: any) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.name} ({student.email})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex-1 flex justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssigningMultiple(!isAssigningMultiple)}
              disabled={enrollMutation.isPending || bulkEnrollMutation.isPending}
            >
              {isAssigningMultiple ? "Single Assignment" : "Bulk Assignment"}
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={
                enrollMutation.isPending || 
                bulkEnrollMutation.isPending || 
                (isAssigningMultiple ? selectedStudents.length === 0 : !selectedStudent) || 
                !canAssignMore
              }
            >
              {enrollMutation.isPending || bulkEnrollMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}