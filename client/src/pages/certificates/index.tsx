import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, type Certificate, type User, type Exam, type Academy } from "@shared/schema";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Award, Download, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CertificatesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch certificates
  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  // Fetch users (students)
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users", { role: UserRole.STUDENT }],
    queryFn: async () => {
      // In a real app, this would be an API call that filters by role
      return [
        { id: 1, username: "student1", name: "John Doe", email: "john@example.com", role: UserRole.STUDENT, createdAt: new Date().toISOString() },
        { id: 2, username: "student2", name: "Jane Smith", email: "jane@example.com", role: UserRole.STUDENT, createdAt: new Date().toISOString() },
        { id: 3, username: "student3", name: "Michael Johnson", email: "michael@example.com", role: UserRole.STUDENT, createdAt: new Date().toISOString() },
      ];
    },
  });

  // Fetch exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Fetch academies
  const { data: academies = [], isLoading: isLoadingAcademies } = useQuery<Academy[]>({
    queryKey: ["/api/academies"],
  });

  // Process certificates with related data
  const processedCertificates = certificates.map(certificate => {
    const student = users.find(u => u.id === certificate.studentId);
    const exam = exams.find(e => e.id === certificate.examId);
    const academy = academies.find(a => a.id === certificate.academyId);
    
    return {
      ...certificate,
      studentName: student?.name || "Unknown Student",
      examName: exam?.title || "Unknown Exam",
      academyName: academy?.name || "Unknown Academy",
    };
  });

  // Filter certificates based on search and user role
  const filteredCertificates = processedCertificates.filter(certificate => {
    const matchesSearch = 
      certificate.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      certificate.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      certificate.academyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      certificate.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    // Students should only see their own certificates
    if (user?.role === UserRole.STUDENT) {
      return certificate.studentId === user.id;
    }
    
    // Academies should only see certificates for their exams
    if (user?.role === UserRole.ACADEMY) {
      const academy = academies.find(a => a.userId === user.id);
      return academy ? certificate.academyId === academy.id : false;
    }
    
    // Super admin sees all
    return true;
  });

  const isLoading = isLoadingCertificates || isLoadingUsers || isLoadingExams || isLoadingAcademies;

  if (isLoading) {
    return (
      <MainLayout title="Certificates" subtitle="View and manage all certificates">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading certificates...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Certificates" subtitle="View and manage all certificates">
      <Card className="transition-colors duration-200">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl font-bold">Certificates</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search certificates..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCertificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Award className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Certificates Found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                {searchQuery 
                  ? "No certificates match your search criteria. Try a different search term."
                  : user?.role === UserRole.STUDENT
                  ? "You haven't earned any certificates yet. Complete exams to earn certificates."
                  : user?.role === UserRole.ACADEMY
                  ? "No certificates have been issued for your exams yet."
                  : "There are no certificates in the system yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate Number</TableHead>
                    {user?.role !== UserRole.STUDENT && <TableHead>Student</TableHead>}
                    <TableHead>Exam</TableHead>
                    {user?.role !== UserRole.ACADEMY && <TableHead>Academy</TableHead>}
                    <TableHead>Issue Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((certificate) => (
                    <TableRow key={certificate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell>
                        <div className="font-medium">{certificate.certificateNumber}</div>
                      </TableCell>
                      {user?.role !== UserRole.STUDENT && (
                        <TableCell>{certificate.studentName}</TableCell>
                      )}
                      <TableCell>{certificate.examName}</TableCell>
                      {user?.role !== UserRole.ACADEMY && (
                        <TableCell>{certificate.academyName}</TableCell>
                      )}
                      <TableCell>{formatDate(certificate.issueDate)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setLocation(`/certificates/${certificate.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
