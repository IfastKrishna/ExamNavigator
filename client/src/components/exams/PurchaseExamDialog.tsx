import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type PurchaseExamDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: any;
  onPurchased?: () => void;
};

export function PurchaseExamDialog({
  open,
  onOpenChange,
  exam,
  onPurchased,
}: PurchaseExamDialogProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState<number>(1);

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/exams/purchase", {
        examId: exam?.id,
        quantity,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Purchase Successful",
        description: data.message || "You have successfully purchased exam licenses",
      });
      onOpenChange(false);
      if (onPurchased) {
        onPurchased();
      }
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exam-purchases"] });
    },
    onError: (error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    if (!exam) return;
    purchaseMutation.mutate();
  };

  const totalPrice = (exam?.price || 0) * quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Purchase Exam Licenses</DialogTitle>
          <DialogDescription>
            You are purchasing licenses for <strong>{exam?.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Number of Licenses</Label>
            <Select
              value={quantity.toString()}
              onValueChange={(value) => setQuantity(parseInt(value))}
              disabled={purchaseMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select quantity" />
              </SelectTrigger>
              <SelectContent>
                {[1, 5, 10, 25, 50, 100].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "license" : "licenses"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Each license allows you to assign one student to this exam
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between mb-2">
              <span>Price per license:</span>
              <span>{formatCurrency(exam?.price || 0)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total price:</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={purchaseMutation.isPending}
          >
            {purchaseMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Purchase Now"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}