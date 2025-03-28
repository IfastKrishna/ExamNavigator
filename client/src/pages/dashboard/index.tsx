import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, type Academy, type Exam, type Certificate } from "@shared/schema";
import MainLayout from "@/components/layouts/main-layout";
import StatCard from "@/components/dashboard/stat-card";
import ActivityFeed from "@/components/dashboard/activity-feed";
import AcademiesTable from "@/components/dashboard/academies-table";
import ExamsTable from "@/components/dashboard/exams-table";
import CertificatePreview from "@/components/ui/certificate-preview";
import { StatCardData, Activity } from "@/types/dashboard";
import { Loader2, Building2, BookOpen, GraduationCap, Award, UserPlus, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatCardData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Fetch academies for super admin and students
  const { data: academies = [], isLoading: isLoadingAcademies } = useQuery<Academy[]>({
    queryKey: ["/api/academies"],
    enabled: user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.STUDENT,
  });

  // Fetch exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Fetch certificates
  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  // Fetch enrollments for students
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/enrollments"],
    enabled: user?.role === UserRole.STUDENT,
  });

  useEffect(() => {
    if (user) {
      // Set stats based on user role
      if (user.role === UserRole.SUPER_ADMIN) {
        setStats([
          {
            title: "Total Academies",
            value: academies.length,
            icon: Building2,
            color: "blue",
            change: { value: 12, label: "from last month" }
          },
          {
            title: "Active Exams",
            value: exams.filter(e => e.status === "PUBLISHED").length,
            icon: BookOpen,
            color: "green",
            change: { value: 8, label: "from last month" }
          },
          {
            title: "Total Students",
            value: "2,384", // This would come from a real API
            icon: GraduationCap,
            color: "purple",
            change: { value: 15, label: "from last month" }
          },
          {
            title: "Certificates Issued",
            value: certificates.length,
            icon: Award,
            color: "yellow",
            change: { value: 6, label: "from last month" }
          }
        ]);
      } else if (user.role === UserRole.ACADEMY) {
        setStats([
          {
            title: "Your Exams",
            value: exams.length,
            icon: BookOpen,
            color: "green",
            change: { value: 8, label: "from last month" }
          },
          {
            title: "Enrolled Students",
            value: "245", // This would be calculated from enrollments
            icon: GraduationCap,
            color: "purple",
            change: { value: 15, label: "from last month" }
          },
          {
            title: "Certificates Issued",
            value: certificates.length,
            icon: Award,
            color: "yellow",
            change: { value: 6, label: "from last month" }
          },
          {
            title: "Pass Rate",
            value: "78%", // This would be calculated from results
            icon: Award,
            color: "blue",
            change: { value: 3, label: "from last month" }
          }
        ]);
      } else if (user.role === UserRole.STUDENT) {
        setStats([
          {
            title: "Available Exams",
            value: exams.filter(e => e.status === "PUBLISHED").length,
            icon: BookOpen,
            color: "green"
          },
          {
            title: "Enrolled Exams",
            value: enrollments.length,
            icon: BookOpen,
            color: "blue"
          },
          {
            title: "Completed Exams",
            value: enrollments.filter(e => e.status === "PASSED" || e.status === "FAILED").length,
            icon: BookOpen,
            color: "purple"
          },
          {
            title: "Your Certificates",
            value: certificates.length,
            icon: Award,
            color: "yellow"
          }
        ]);
      }

      // Set activities (these would come from an API in a real app)
      setActivities([
        {
          id: 1,
          type: "user",
          content: "New academy <span class='font-medium'>Tech Academy</span> registered",
          timeAgo: "2 hours ago",
          icon: UserPlus
        },
        {
          id: 2,
          type: "exam",
          content: "<span class='font-medium'>Business School</span> created a new exam",
          timeAgo: "5 hours ago",
          icon: BookOpen
        },
        {
          id: 3,
          type: "certificate",
          content: "<span class='font-medium'>15 certificates</span> issued by Language Institute",
          timeAgo: "Yesterday",
          icon: Award
        },
        {
          id: 4,
          type: "system",
          content: "System maintenance scheduled for <span class='font-medium'>next Monday</span>",
          timeAgo: "2 days ago",
          icon: AlertTriangle
        }
      ]);
    }
  }, [user, academies, exams, certificates, enrollments]);

  // Sample certificate data for preview
  const certificatePreview = {
    id: 1,
    studentName: "Jane Smith",
    examName: "Advanced Web Development",
    score: 92,
    academyName: "Tech Academy",
    issueDate: new Date(),
    certificateNumber: "EP-2023-0057642"
  };

  if (isLoadingAcademies || isLoadingExams || isLoadingCertificates || isLoadingEnrollments) {
    return (
      <MainLayout title="Dashboard" subtitle={`Welcome back${user ? ', ' + user.name : ''}!`}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading dashboard data...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard" subtitle={`Welcome back${user ? ', ' + user.name : ''}!`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            change={stat.change}
          />
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Academies Table (for Super Admin) */}
        {user?.role === UserRole.SUPER_ADMIN && (
          <div className="col-span-1 lg:col-span-2">
            <AcademiesTable
              academies={academies.map(a => ({
                ...a,
                studentsCount: 245, // This would come from a real API
                examsCount: exams.filter(e => e.academyId === a.id).length
              }))}
            />
          </div>
        )}

        {/* Exams Table (for Academies) */}
        {user?.role === UserRole.ACADEMY && (
          <div className="col-span-1 lg:col-span-2">
            <ExamsTable 
              exams={exams.map(e => ({
                ...e,
                studentsCount: 78, // This would come from a real API
                passRate: 85 // This would come from a real API
              }))}
              showAcademy={false}
            />
          </div>
        )}

        {/* Available Exams (for Students) */}
        {user?.role === UserRole.STUDENT && (
          <div className="col-span-1 lg:col-span-2">
            <ExamsTable 
              exams={exams
                .filter(e => e.status === "PUBLISHED")
                .map(e => {
                  const academy = academies.find(a => a.id === e.academyId);
                  return {
                    ...e,
                    academyName: academy?.name || "Unknown Academy",
                    studentsCount: 78, // This would come from a real API
                    passRate: 85 // This would come from a real API
                  };
                })
              }
            />
          </div>
        )}

        {/* Activity Feed */}
        <ActivityFeed activities={activities} />
      </div>

      {/* Certificate Preview */}
      <div className="grid grid-cols-1 gap-6">
        <CertificatePreview 
          certificate={certificatePreview}
          onEdit={() => console.log("Edit certificate template")}
        />
      </div>
    </MainLayout>
  );
}
