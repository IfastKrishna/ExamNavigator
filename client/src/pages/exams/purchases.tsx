import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardSubheader } from "@/components/dashboard/dashboard-subheader";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BadgeAlert, PackageCheck, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ExamPurchasesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch exam purchases
  const { data: purchases = [], isLoading: loadingPurchases } = useQuery({
    queryKey: ["/api/exam-purchases"],
    queryFn: async () => {
      const response = await fetch("/api/exam-purchases");
      
      if (!response.ok) {
        throw new Error("Failed to fetch exam purchases");
      }
      
      return response.json();
    },
  });
  
  // Group purchases by exam
  const purchasesByExam = purchases.reduce((acc: any, purchase: any) => {
    const key = purchase.examId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(purchase);
    return acc;
  }, {});
  
  // Calculate total purchases and usage stats
  const totalPurchased = purchases.reduce((sum: number, p: any) => sum + p.quantity, 0);
  const totalUsed = purchases.reduce((sum: number, p: any) => sum + p.usedQuantity, 0);
  const totalRemaining = totalPurchased - totalUsed;
  
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Exam Purchases"
        text="View and manage your exam purchases"
      />
      
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Exams Purchased
            </CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchased}</div>
            <p className="text-xs text-muted-foreground">
              Total exam licenses purchased
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Used Licenses
            </CardTitle>
            <BadgeAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsed}</div>
            <p className="text-xs text-muted-foreground">
              Licenses assigned to students
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Licenses
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRemaining}</div>
            <p className="text-xs text-muted-foreground">
              Remaining unused licenses
            </p>
          </CardContent>
        </Card>
      </div>
      
      <DashboardSubheader
        heading="Purchase History"
        text="All your exam purchases"
      />
      
      {loadingPurchases ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : purchases.length === 0 ? (
        <Alert>
          <AlertTitle>No purchases found</AlertTitle>
          <AlertDescription>
            You haven't purchased any exams yet. Visit the Available Exams section to purchase exams.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase: any) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">{purchase.examTitle}</TableCell>
                  <TableCell>{purchase.quantity}</TableCell>
                  <TableCell>{purchase.usedQuantity}</TableCell>
                  <TableCell>{purchase.quantity - purchase.usedQuantity}</TableCell>
                  <TableCell>${purchase.totalPrice.toFixed(2)}</TableCell>
                  <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                  <TableCell>
                    <Badge variant={purchase.status === "COMPLETED" ? "success" : "secondary"}>
                      {purchase.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardShell>
  );
}