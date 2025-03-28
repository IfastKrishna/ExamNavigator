import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Sample data for demonstration
const ACADEMY_PERFORMANCE_DATA = [
  { name: 'Jan', passRate: 65, examsTaken: 45 },
  { name: 'Feb', passRate: 59, examsTaken: 42 },
  { name: 'Mar', passRate: 80, examsTaken: 55 },
  { name: 'Apr', passRate: 81, examsTaken: 60 },
  { name: 'May', passRate: 56, examsTaken: 38 },
  { name: 'Jun', passRate: 55, examsTaken: 30 },
  { name: 'Jul', passRate: 40, examsTaken: 20 },
];

const EXAMS_BY_CATEGORY = [
  { name: 'Programming', value: 35 },
  { name: 'Design', value: 25 },
  { name: 'Marketing', value: 18 },
  { name: 'Business', value: 15 },
  { name: 'Other', value: 7 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState("overview");
  
  // Sample queries - in a real app, these would fetch actual data
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ["/api/exams"],
  });
  
  const { data: academies = [], isLoading: isLoadingAcademies } = useQuery({
    queryKey: ["/api/academies"],
  });
  
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/users", { role: "STUDENT" }],
    enabled: user?.role === UserRole.SUPER_ADMIN,
  });
  
  const isLoading = isLoadingExams || isLoadingAcademies || (user?.role === UserRole.SUPER_ADMIN && isLoadingStudents);
  
  if (isLoading) {
    return (
      <MainLayout title="Analytics" subtitle="View performance metrics and statistics">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading analytics data...</span>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Analytics" subtitle="View performance metrics and statistics">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          {user?.role === UserRole.SUPER_ADMIN && (
            <TabsTrigger value="academies">Academies</TabsTrigger>
          )}
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Monthly exam passing rates and total exams taken</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ACADEMY_PERFORMANCE_DATA}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#1976D2" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="passRate" name="Pass Rate %" fill="#1976D2" />
                    <Bar yAxisId="right" dataKey="examsTaken" name="Exams Taken" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Exam Categories</CardTitle>
                <CardDescription>Distribution of exams by category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={EXAMS_BY_CATEGORY}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {EXAMS_BY_CATEGORY.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}`, `${name}`]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
              <CardDescription>Summary of important statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Exams</div>
                  <div className="text-2xl font-bold mt-1">{exams.length}</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Academies</div>
                  <div className="text-2xl font-bold mt-1">{academies.length}</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Students</div>
                  <div className="text-2xl font-bold mt-1">{user?.role === UserRole.SUPER_ADMIN ? students.length : 245}</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Avg. Pass Rate</div>
                  <div className="text-2xl font-bold mt-1 text-primary">68%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Performance</CardTitle>
              <CardDescription>Detailed analytics for each exam</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-10 text-center text-gray-500">
                No exam performance data available. Create and publish exams to see analytics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {user?.role === UserRole.SUPER_ADMIN && (
          <TabsContent value="academies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Academy Comparison</CardTitle>
                <CardDescription>Performance metrics across academies</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="py-10 text-center text-gray-500">
                  No academy comparison data available yet. More academies needed for meaningful comparison.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Statistics</CardTitle>
              <CardDescription>Performance metrics for students</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-10 text-center text-gray-500">
                No student performance data available yet. Enroll more students in exams to see statistics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}