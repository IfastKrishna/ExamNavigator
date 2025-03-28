import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, ArrowUpRight, ArrowDownRight, Award, Users, BookOpen, 
  PieChart as PieChartIcon, BarChart2, TrendingUp, CheckCircle2, AlertCircle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Array of colors for charts
const COLORS = ['#1976D2', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#0088FE', '#0D47A1', '#2196F3'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState("overview");
  const [selectedAcademyId, setSelectedAcademyId] = React.useState<string | undefined>(undefined);
  
  // Fetch basic data
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
  
  // Fetch analytics data
  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ["/api/analytics/academy-performance", { academyId: selectedAcademyId }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const url = `/api/analytics/academy-performance${params.academyId ? `?academyId=${params.academyId}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch performance data');
      return res.json();
    }
  });
  
  const { data: categoriesData = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/analytics/exam-categories", { academyId: selectedAcademyId }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const url = `/api/analytics/exam-categories${params.academyId ? `?academyId=${params.academyId}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch category data');
      return res.json();
    }
  });
  
  const { data: studentPerformance = [], isLoading: isLoadingStudentPerformance } = useQuery({
    queryKey: ["/api/analytics/student-performance", { academyId: selectedAcademyId }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const url = `/api/analytics/student-performance${params.academyId ? `?academyId=${params.academyId}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch student performance data');
      return res.json();
    },
    enabled: user?.role !== UserRole.STUDENT
  });
  
  const { data: examPerformance = [], isLoading: isLoadingExamPerformance } = useQuery({
    queryKey: ["/api/analytics/exam-performance", { academyId: selectedAcademyId }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const url = `/api/analytics/exam-performance${params.academyId ? `?academyId=${params.academyId}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch exam performance data');
      return res.json();
    }
  });
  
  const isLoading = 
    isLoadingExams || 
    isLoadingAcademies || 
    isLoadingPerformance || 
    isLoadingCategories || 
    isLoadingExamPerformance || 
    (user?.role !== UserRole.STUDENT && isLoadingStudentPerformance) || 
    (user?.role === UserRole.SUPER_ADMIN && isLoadingStudents);
  
  // Handle academy selection change
  const handleAcademyChange = (academyId: string) => {
    setSelectedAcademyId(academyId === "all" ? undefined : academyId);
  };
  
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
  
  // Extract data from API responses
  const monthlyData = performanceData?.monthly || [];
  const overallStats = performanceData?.overall || { 
    totalExams: 0, 
    totalEnrollments: 0,
    totalStudents: 0,
    overallPassRate: 0
  };
  
  // Calculate trends (last month vs current month)
  const currentMonth = monthlyData[monthlyData.length - 1] || { passRate: 0, examsTaken: 0 };
  const previousMonth = monthlyData[monthlyData.length - 2] || { passRate: 0, examsTaken: 0 };
  
  const passRateTrend = currentMonth.passRate - previousMonth.passRate;
  const examsTakenTrend = currentMonth.examsTaken - previousMonth.examsTaken;
  
  return (
    <MainLayout title="Analytics" subtitle="View performance metrics and statistics">
      {/* Academy selector (for Super Admin) */}
      {user?.role === UserRole.SUPER_ADMIN && (
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div className="text-lg font-medium">
              Academy Filter:
            </div>
            <div className="w-64">
              <Select 
                value={selectedAcademyId || "all"} 
                onValueChange={handleAcademyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Academy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academies</SelectItem>
                  {academies.map((academy) => (
                    <SelectItem key={academy.id} value={academy.id.toString()}>
                      {academy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          {user?.role !== UserRole.STUDENT && (
            <TabsTrigger value="students">Students</TabsTrigger>
          )}
          {user?.role === UserRole.SUPER_ADMIN && (
            <TabsTrigger value="academies">Academies</TabsTrigger>
          )}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="absolute right-4 top-4 p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Exams
                </CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {overallStats.totalExams}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mt-1">
                  {examsTakenTrend >= 0 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-500 font-medium">
                        {examsTakenTrend} more this month
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-xs text-red-500 font-medium">
                        {Math.abs(examsTakenTrend)} fewer this month
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="absolute right-4 top-4 p-2 bg-green-100 dark:bg-green-900 rounded-full">
                  <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Students
                </CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {overallStats.totalStudents}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {overallStats.totalEnrollments} enrollments
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="absolute right-4 top-4 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                  <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Overall Pass Rate
                </CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {overallStats.overallPassRate}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mt-1">
                  {passRateTrend >= 0 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-500 font-medium">
                        Up {passRateTrend}% from last month
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-xs text-red-500 font-medium">
                        Down {Math.abs(passRateTrend)}% from last month
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="absolute right-4 top-4 p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Completion Rate
                </CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {currentMonth.completionRate || 0}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500 font-medium">
                    Based on current month enrollments
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Performance Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Monthly exam passing rates and total exams taken</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#1976D2" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="passRate" name="Pass Rate %" fill="#1976D2" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="examsTaken" name="Exams Taken" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Exam Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Categories</CardTitle>
                <CardDescription>Distribution of exams by category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {categoriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoriesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}`, `${name}`]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No category data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Completion Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Completion Rate Trends</CardTitle>
              <CardDescription>Percentage of enrolled students who complete exams</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#1976D2" 
                    fill="#1976D2" 
                    fillOpacity={0.2}
                    name="Completion Rate %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Performance</CardTitle>
              <CardDescription>Detailed analytics for each exam</CardDescription>
            </CardHeader>
            <CardContent>
              {examPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Title</TableHead>
                        <TableHead className="text-right">Enrollments</TableHead>
                        <TableHead className="text-right">Completion %</TableHead>
                        <TableHead className="text-right">Pass Rate</TableHead>
                        <TableHead className="text-right">Avg. Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examPerformance.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.title}</TableCell>
                          <TableCell className="text-right">{exam.totalEnrollments}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span>{exam.completionRate}%</span>
                              <Progress 
                                value={exam.completionRate} 
                                className="w-12 h-2" 
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              className={exam.passRate >= 70 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                                : exam.passRate >= 50 
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              }
                            >
                              {exam.passRate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{exam.avgScore}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-10 text-center text-gray-500">
                  No exam performance data available. Create and publish exams to see analytics.
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Exam Performance Charts */}
          {examPerformance.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Completion Rates</CardTitle>
                  <CardDescription>Percentage of students who completed each exam</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={examPerformance}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis 
                        type="category" 
                        dataKey="title" 
                        width={150}
                        tick={{fontSize: 12}}
                        tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, "Completion Rate"]}
                        labelFormatter={(value) => `Exam: ${value}`}
                      />
                      <Bar 
                        dataKey="completionRate" 
                        fill="#1976D2" 
                        name="Completion Rate" 
                        radius={[0, 4, 4, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Exam Pass Rates</CardTitle>
                  <CardDescription>Percentage of students who passed each exam</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={examPerformance}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis 
                        type="category" 
                        dataKey="title" 
                        width={150}
                        tick={{fontSize: 12}}
                        tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, "Pass Rate"]}
                        labelFormatter={(value) => `Exam: ${value}`}
                      />
                      <Bar 
                        dataKey="passRate" 
                        fill="#00C49F"
                        name="Pass Rate" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Students Tab */}
        {user?.role !== UserRole.STUDENT && (
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Performance</CardTitle>
                <CardDescription>Performance metrics for students</CardDescription>
              </CardHeader>
              <CardContent>
                {studentPerformance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">Total Exams</TableHead>
                          <TableHead className="text-right">Completed</TableHead>
                          <TableHead className="text-right">Passed</TableHead>
                          <TableHead className="text-right">Pass Rate</TableHead>
                          <TableHead className="text-right">Avg. Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentPerformance.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell className="text-right">{student.totalExams}</TableCell>
                            <TableCell className="text-right">{student.completedExams}</TableCell>
                            <TableCell className="text-right">{student.passedExams}</TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                className={student.passRate >= 70 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                                  : student.passRate >= 50 
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                }
                              >
                                {student.passRate}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{student.avgScore}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="py-10 text-center text-gray-500">
                    No student performance data available yet. Enroll more students in exams to see statistics.
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Student Performance Charts */}
            {studentPerformance.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Students</CardTitle>
                    <CardDescription>Students with highest pass rates</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={studentPerformance.slice(0, 10)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={120}
                          tick={{fontSize: 12}}
                          tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, "Pass Rate"]}
                          labelFormatter={(value) => `Student: ${value}`}
                        />
                        <Bar 
                          dataKey="passRate" 
                          fill="#FFBB28" 
                          name="Pass Rate" 
                          radius={[0, 4, 4, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Average Student Scores</CardTitle>
                    <CardDescription>Average exam scores by student</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={studentPerformance.slice(0, 10)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={120}
                          tick={{fontSize: 12}}
                          tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, "Average Score"]}
                          labelFormatter={(value) => `Student: ${value}`}
                        />
                        <Bar 
                          dataKey="avgScore" 
                          fill="#8884D8" 
                          name="Average Score" 
                          radius={[0, 4, 4, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        )}
        
        {/* Academies Tab (Super Admin Only) */}
        {user?.role === UserRole.SUPER_ADMIN && (
          <TabsContent value="academies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Academy Comparison</CardTitle>
                <CardDescription>Performance metrics across academies</CardDescription>
              </CardHeader>
              <CardContent>
                {academies.length > 1 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Academy</TableHead>
                          <TableHead className="text-right">Total Exams</TableHead>
                          <TableHead className="text-right">Students</TableHead>
                          <TableHead className="text-right">Pass Rate</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {academies.map((academy) => {
                          // Find academy's exams
                          const academyExams = exams.filter(e => e.academyId === academy.id);
                          const examCount = academyExams.length;
                          const passRate = Math.round(Math.random() * 100); // Would use real data in production
                          
                          return (
                            <TableRow key={academy.id}>
                              <TableCell className="font-medium">{academy.name}</TableCell>
                              <TableCell className="text-right">{examCount}</TableCell>
                              <TableCell className="text-right">{Math.round(Math.random() * 100)}</TableCell>
                              <TableCell className="text-right">
                                <Badge 
                                  className={passRate >= 70 
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                                    : passRate >= 50 
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  }
                                >
                                  {passRate}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {examCount > 0 ? (
                                  <div className="flex items-center justify-end">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                                    <span className="text-sm">Active</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end">
                                    <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                                    <span className="text-sm">No Exams</span>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="py-10 text-center text-gray-500">
                    No academy comparison data available yet. More academies needed for meaningful comparison.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </MainLayout>
  );
}