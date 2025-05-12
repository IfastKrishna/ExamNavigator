import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import { useExamsQuery } from "@/lib/api/exams";
import { useEnrollmentsQuery } from "@/lib/api/enrollments";
import { useUsersByRoleQuery } from "@/lib/api/users";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Download, BarChart3, LineChart, PieChart } from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use our organized API queries
  const { data: exams = [], isLoading: isLoadingExams } = useExamsQuery();
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useEnrollmentsQuery();
  const { data: students = [], isLoading: isLoadingStudents } = useUsersByRoleQuery(UserRole.STUDENT);
  
  // Check if currently loading
  const isLoading = isLoadingExams || isLoadingEnrollments || isLoadingStudents;
  
  // Calculate statistics based on the data
  const totalStudents = students.length;
  const totalExams = exams.length;
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter(e => e.status === "COMPLETED").length;
  const passRate = completedEnrollments ? 
    Math.round((enrollments.filter(e => e.status === "PASSED").length / completedEnrollments) * 100) : 0;
  
  if (isLoading) {
    return (
      <MainLayout title="Reports" subtitle="Analyze exam performance and statistics">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading reports data...</span>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Reports" subtitle="Analyze exam performance and statistics">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="exams">Exam Performance</TabsTrigger>
              <TabsTrigger value="students">Student Performance</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" className="ml-2">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-3xl">{totalStudents}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Exams</CardDescription>
                <CardTitle className="text-3xl">{totalExams}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Enrollments</CardDescription>
                <CardTitle className="text-3xl">{totalEnrollments}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pass Rate</CardDescription>
                <CardTitle className="text-3xl">{passRate}%</CardTitle>
              </CardHeader>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Exam Completion Trends</CardTitle>
              </CardHeader>
              <CardContent className="h-80 flex justify-center items-center">
                <LineChart className="h-16 w-16 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Chart would appear here</span>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Pass/Fail Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80 flex justify-center items-center">
                <PieChart className="h-16 w-16 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Chart would appear here</span>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="exams" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Exam Performance Analysis</CardTitle>
              <CardDescription>Compare performance metrics across different exams</CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex justify-center items-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Detailed exam metrics would appear here</span>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Analysis</CardTitle>
              <CardDescription>Track individual student progress and achievements</CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex justify-center items-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Student performance data would appear here</span>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </MainLayout>
  );
}