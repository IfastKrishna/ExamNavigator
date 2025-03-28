import { LucideIcon } from "lucide-react";

export interface StatCardData {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "yellow" | "red";
  change?: {
    value: number;
    label: string;
  };
}

export interface Activity {
  id: number;
  type: "user" | "exam" | "certificate" | "system";
  content: string;
  timeAgo: string;
  icon: LucideIcon;
}

export interface AcademyTableData {
  id: number;
  name: string;
  email?: string;
  studentsCount: number;
  examsCount: number;
  status: string;
}

export interface ExamTableData {
  id: number;
  title: string;
  academyId: number;
  academyName?: string;
  studentsCount: number;
  passRate: number;
  status: string;
}
