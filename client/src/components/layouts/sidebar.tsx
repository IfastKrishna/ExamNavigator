import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { UserRole } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  GraduationCap,
  Award,
  BarChart2,
  Settings
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
};

type SidebarProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  userRole: string;
};

export default function Sidebar({ open, setOpen, userRole }: SidebarProps) {
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.ACADEMY, UserRole.STUDENT]
    },
    {
      name: "Academies",
      href: "/academies",
      icon: <Building2 className="w-5 h-5 mr-3" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.STUDENT]
    },
    {
      name: "Exams",
      href: "/exams",
      icon: <BookOpen className="w-5 h-5 mr-3" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.ACADEMY, UserRole.STUDENT]
    },
    {
      name: "Students",
      href: "/students",
      icon: <GraduationCap className="w-5 h-5 mr-3" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.ACADEMY]
    },
    {
      name: "Certificates",
      href: "/certificates",
      icon: <Award className="w-5 h-5 mr-3" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.ACADEMY, UserRole.STUDENT]
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: <BarChart2 className="w-5 h-5 mr-3" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.ACADEMY]
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="w-5 h-5 mr-3" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.ACADEMY, UserRole.STUDENT]
    }
  ];

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const sidebarToggle = document.getElementById("sidebarToggle");
      
      if (isMobile && open && 
          sidebar && !sidebar.contains(event.target as Node) && 
          sidebarToggle && !sidebarToggle.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, open, setOpen]);

  return (
    <aside 
      id="sidebar"
      className={cn(
        "fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-md overflow-y-auto z-10 transition-transform duration-300 ease-in-out md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Role Indicator */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="px-2 py-1 rounded-md bg-primary text-white text-xs font-semibold inline-block">
          <span>{userRole}</span>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="mt-4">
        <ul>
          {navItems
            .filter(item => item.roles.includes(userRole as UserRole))
            .map((item) => (
              <li key={item.name} className="mb-1">
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-2 text-sm font-medium",
                      location === item.href
                        ? "text-primary dark:text-accent bg-blue-50 dark:bg-gray-700 border-l-4 border-primary dark:border-accent"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-accent"
                    )}
                    onClick={() => isMobile && setOpen(false)}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </a>
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </aside>
  );
}
