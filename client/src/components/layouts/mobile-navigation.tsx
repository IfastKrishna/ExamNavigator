import { Link, useLocation } from "wouter";
import { UserRole } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  GraduationCap,
  Award,
  MoreHorizontal
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
};

type MobileNavigationProps = {
  userRole: string;
};

export default function MobileNavigation({ userRole }: MobileNavigationProps) {
  const [location] = useLocation();

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.ACADEMY, UserRole.STUDENT]
    },
    {
      name: "Academies",
      href: "/academies",
      icon: <Building2 className="h-5 w-5" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.STUDENT]
    },
    {
      name: "Exams",
      href: "/exams",
      icon: <BookOpen className="h-5 w-5" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.ACADEMY, UserRole.STUDENT]
    },
    {
      name: "Students",
      href: "/students",
      icon: <GraduationCap className="h-5 w-5" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.ACADEMY]
    },
    {
      name: "Certificates",
      href: "/certificates",
      icon: <Award className="h-5 w-5" />,
      roles: [UserRole.SUPER_ADMIN, UserRole.ACADEMY, UserRole.STUDENT]
    }
  ];

  // Filter nav items based on user role and limit to 4 items for mobile
  const filteredNavItems = navItems
    .filter(item => item.roles.includes(userRole as UserRole))
    .slice(0, 4);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-20 transition-colors duration-200">
      <div className="grid grid-cols-5 h-16">
        {filteredNavItems.map((item) => (
          <Link key={item.name} href={item.href}>
            <a className={cn(
              "flex flex-col items-center justify-center",
              location === item.href
                ? "text-primary dark:text-primary font-medium"
                : "text-gray-600 dark:text-gray-300"
            )}>
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </a>
          </Link>
        ))}
        
        {/* More menu button */}
        <Link href="/more">
          <a className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-300">
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs mt-1">More</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
