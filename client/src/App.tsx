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
import CreateExam from "@/pages/exams/create";
import AvailableExams from "@/pages/exams/available-exams";
import TakeExam from "@/pages/exams/take";
import ExamResults from "@/pages/exams/results";
import Students from "@/pages/students";
import Certificates from "@/pages/certificates";
import CertificateView from "@/pages/certificates/view";
import Profile from "@/pages/profile";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";

// Payment Pages
import PaymentSuccessPage from "@/pages/payment/success";
import PaymentCancelPage from "@/pages/payment/cancel";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/academies" component={Academies} />
      <ProtectedRoute path="/academies/create" component={CreateAcademy} />
      <ProtectedRoute path="/exams" component={Exams} />
      <ProtectedRoute path="/exams/create" component={CreateExam} />
      <ProtectedRoute path="/exams/:examId/take" component={TakeExam} />
      <ProtectedRoute path="/exams/:examId/results" component={ExamResults} />
      <ProtectedRoute path="/available-exams" component={AvailableExams} />
      <ProtectedRoute path="/students" component={Students} />
      <ProtectedRoute path="/certificates" component={Certificates} />
      <ProtectedRoute path="/certificates/:id" component={CertificateView} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/payment/success" component={PaymentSuccessPage} />
      <ProtectedRoute path="/payment/cancel" component={PaymentCancelPage} />
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
