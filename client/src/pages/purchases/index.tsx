import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function PurchasesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not an academy or super admin
  if (user?.role !== UserRole.ACADEMY && user?.role !== UserRole.SUPER_ADMIN) {
    setLocation("/");
    return null;
  }

  // Fetch exam purchases
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["/api/exam-purchases"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/exam-purchases");
      return await res.json();
    },
  });

  if (isLoading) {
    return (
      <MainLayout title="Exam Purchases" subtitle="View your exam licenses">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading purchases...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Exam Purchases" subtitle="View and manage your purchased exam licenses">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => setLocation("/exams")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exams
        </Button>

        <Button 
          variant="outline" 
          onClick={() => setLocation("/available-exams")}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Purchase More
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Licenses</CardTitle>
          <CardDescription>
            Manage your purchased exam licenses and track usage.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                No Purchases Found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                You haven't purchased any exam licenses yet. Visit the marketplace to browse available exams.
              </p>
              <Button 
                className="mt-4"
                onClick={() => setLocation("/available-exams")}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Browse Marketplace
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Purchased</TableHead>
                    <TableHead>Total Licenses</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase: any) => {
                    const remaining = purchase.quantity - purchase.usedQuantity;
                    
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchase.examTitle}</TableCell>
                        <TableCell>{new Date(purchase.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell>{purchase.usedQuantity}</TableCell>
                        <TableCell>
                          {remaining === 0 ? (
                            <Badge variant="destructive">None left</Badge>
                          ) : (
                            remaining
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(purchase.totalPrice)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              purchase.status === "ACTIVE" ? "success" :
                              purchase.status === "EXPIRED" ? "destructive" : 
                              "outline"
                            }
                          >
                            {purchase.status}
                          </Badge>
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