import { ReactNode, useState } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import MobileNavigation from "./mobile-navigation";
import { useAuth } from "@/hooks/use-auth";

type MainLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export default function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        user={user}
      />
      
      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen} 
        userRole={user.role}
      />
      
      <main className="pt-16 md:pl-64 min-h-screen transition-all duration-200">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          
          {children}
        </div>
      </main>
      
      <MobileNavigation userRole={user.role} />
    </div>
  );
}
