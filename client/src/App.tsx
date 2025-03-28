import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import ThemeProvider from "@/components/theme-provider";

// Dashboard
import Dashboard from "@/pages/dashboard";
import Academies from "@/pages/academies";
import CreateAcademy from "@/pages/academies/create";
import Exams from "@/pages/exams";
import AvailableExams from "@/pages/exams/available-exams";
import CreateExam from "@/pages/exams/create";
import ExamDetail from "@/pages/exams/[id]";
import EditExam from "@/pages/exams/[id]/edit";
import TakeExam from "@/pages/exams/[id]/take";
import Students from "@/pages/students";
import Certificates from "@/pages/certificates";
import CertificateView from "@/pages/certificates/view";
import Profile from "@/pages/profile";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/academies" component={Academies} />
      <ProtectedRoute path="/academies/create" component={CreateAcademy} />
      <ProtectedRoute path="/exams" component={Exams} />
      <ProtectedRoute path="/exams/create" component={CreateExam} />
      <ProtectedRoute path="/exams/:id/edit" component={EditExam} />
      <ProtectedRoute path="/exams/:id/take" component={TakeExam} />
      <ProtectedRoute path="/exams/:id" component={ExamDetail} />
      <ProtectedRoute path="/available-exams" component={AvailableExams} />
      <ProtectedRoute path="/students" component={Students} />
      <ProtectedRoute path="/certificates" component={Certificates} />
      <ProtectedRoute path="/certificates/:id" component={CertificateView} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
