import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Fetch students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/users/role/STUDENT"],
    enabled: open,
  });

  // Assign student mutation
  const assignMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const res = await apiRequest("POST", "/api/enrollments", {
        examId: exam.id,
        studentId,
        isAssigned: true,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Student Assigned",
        description: "Student has been assigned to the exam successfully.",
      });
      setSelectedStudentId("");
      onOpenChange(false);
      if (onAssigned) {
        onAssigned();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Assign Student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    if (!selectedStudentId) {
      toast({
        title: "No Selection",
        description: "Please select a student to assign.",
        variant: "destructive",
      });
      return;
    }

    assignMutation.mutate(parseInt(selectedStudentId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Student to Exam</DialogTitle>
          <DialogDescription>
            Assign a student to {exam?.title}
            {exam?.purchased && (
              <span className="block mt-1">
                {exam.availableQuantity} licenses remaining
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoadingStudents ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p>Loading students...</p>
          </div>
        ) : (
          <div className="py-4">
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
              disabled={assignMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student: any) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name} ({student.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedStudentId || assignMutation.isPending}
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Student"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}