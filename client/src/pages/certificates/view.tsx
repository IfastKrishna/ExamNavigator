import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, type Certificate, type User, type Exam, type Academy } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import CertificatePreview from "@/components/ui/certificate-preview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateCertificatePDF } from "@/lib/utils/certificate-generator";
import { Loader2, Download, ArrowLeft, Share } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CertificateViewPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Fetch certificate details
  const { data: certificate, isLoading: isLoadingCertificate } = useQuery<Certificate>({
    queryKey: ["/api/certificates", id],
    queryFn: async () => {
      // In a real app, this would fetch the certificate with the given ID
      return {
        id: parseInt(id),
        enrollmentId: 1,
        studentId: 2,
        examId: 1,
        academyId: 1,
        certificateNumber: `EP-2023-${id.padStart(7, '0')}`,
        issueDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
    },
  });

  // Fetch student details
  const { data: student, isLoading: isLoadingStudent } = useQuery<User>({
    queryKey: ["/api/users", certificate?.studentId],
    queryFn: async () => {
      // In a real app, this would fetch the user with the given ID
      return {
        id: certificate?.studentId || 0,
        username: "janedoe",
        name: "Jane Smith",
        email: "jane@example.com",
        role: UserRole.STUDENT,
        createdAt: new Date().toISOString()
      };
    },
    enabled: !!certificate,
  });

  // Fetch exam details
  const { data: exam, isLoading: isLoadingExam } = useQuery<Exam>({
    queryKey: ["/api/exams", certificate?.examId],
    queryFn: async () => {
      // In a real app, this would fetch the exam with the given ID
      return {
        id: certificate?.examId || 0,
        academyId: certificate?.academyId || 0,
        title: "Advanced Web Development",
        description: "Comprehensive exam covering advanced web development topics",
        duration: 120,
        passingScore: 70,
        price: 99.99,
        status: "PUBLISHED",
        createdAt: new Date().toISOString()
      };
    },
    enabled: !!certificate,
  });

  // Fetch academy details
  const { data: academy, isLoading: isLoadingAcademy } = useQuery<Academy>({
    queryKey: ["/api/academies", certificate?.academyId],
    queryFn: async () => {
      // In a real app, this would fetch the academy with the given ID
      return {
        id: certificate?.academyId || 0,
        userId: 3,
        name: "Tech Academy",
        description: "Leading tech education provider",
        logo: "",
        status: "ACTIVE",
        createdAt: new Date().toISOString()
      };
    },
    enabled: !!certificate,
  });

  // Generate PDF when component mounts or data changes
  useEffect(() => {
    if (certificate && student && exam && academy) {
      const generatePDF = async () => {
        setIsGeneratingPDF(true);
        try {
          const url = await generateCertificatePDF({
            id: certificate.id,
            certificateNumber: certificate.certificateNumber,
            studentName: student.name,
            examName: exam.title,
            score: 92, // This would come from the enrollment record
            academyName: academy.name,
            issueDate: new Date(certificate.issueDate)
          });
          setPdfUrl(url);
        } catch (error) {
          console.error("Failed to generate PDF:", error);
        } finally {
          setIsGeneratingPDF(false);
        }
      };

      generatePDF();
    }
  }, [certificate, student, exam, academy]);

  const isLoading = isLoadingCertificate || isLoadingStudent || isLoadingExam || isLoadingAcademy;

  if (isLoading) {
    return (
      <MainLayout title="Certificate View" subtitle="View and download your certificate">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading certificate...</span>
        </div>
      </MainLayout>
    );
  }

  if (!certificate || !student || !exam || !academy) {
    return (
      <MainLayout title="Certificate Not Found" subtitle="The requested certificate could not be found">
        <Card>
          <CardHeader>
            <CardTitle>Certificate Not Found</CardTitle>
            <CardDescription>
              The certificate you are looking for might have been removed or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/certificates")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Certificates
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  // Check if user has permission to view this certificate
  const canView = 
    user?.role === UserRole.SUPER_ADMIN || 
    (user?.role === UserRole.STUDENT && user.id === student.id) ||
    (user?.role === UserRole.ACADEMY && academy.userId === user.id);

  if (!canView) {
    return (
      <MainLayout title="Access Denied" subtitle="You don't have permission to view this certificate">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this certificate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/certificates")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Certificates
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Certificate" 
      subtitle={`Certificate for ${exam.title} issued by ${academy.name}`}
    >
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Certificate Details</CardTitle>
              <CardDescription>
                Certificate #{certificate.certificateNumber} • Issued on {formatDate(certificate.issueDate)}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={() => setLocation("/certificates")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // In a real app, this would copy a verification URL to the clipboard
                  navigator.clipboard.writeText(`https://examportal.com/verify/${certificate.certificateNumber}`);
                }}
              >
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button
                onClick={() => {
                  if (pdfUrl) {
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = `Certificate-${certificate.certificateNumber}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                disabled={isGeneratingPDF || !pdfUrl}
              >
                {isGeneratingPDF ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Student</h3>
                <p className="mt-1 text-lg font-semibold">{student.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Exam</h3>
                <p className="mt-1 text-lg font-semibold">{exam.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Academy</h3>
                <p className="mt-1 text-lg font-semibold">{academy.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Score</h3>
                <p className="mt-1 text-lg font-semibold">92%</p>
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Certificate Preview</h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                <iframe 
                  src={pdfUrl || ""} 
                  className="w-full h-96 rounded"
                  title="Certificate Preview"
                >
                  Your browser does not support iframes. Please download the certificate to view it.
                </iframe>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CertificatePreview 
        certificate={{
          id: certificate.id,
          studentName: student.name,
          examName: exam.title,
          score: 92,
          academyName: academy.name,
          issueDate: new Date(certificate.issueDate),
          certificateNumber: certificate.certificateNumber
        }}
      />
    </MainLayout>
  );
}
