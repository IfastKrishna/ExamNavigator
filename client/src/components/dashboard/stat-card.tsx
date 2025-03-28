import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "yellow" | "red";
  change?: {
    value: number;
    label: string;
  };
}

export default function StatCard({ title, value, icon: Icon, color, change }: StatCardProps) {
  const colorClasses = {
    blue: {
      border: "border-primary dark:border-accent",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-primary dark:text-accent"
    },
    green: {
      border: "border-green-500 dark:border-green-400",
      iconBg: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-500 dark:text-green-400"
    },
    purple: {
      border: "border-purple-500 dark:border-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-900",
      iconColor: "text-purple-500 dark:text-purple-400"
    },
    yellow: {
      border: "border-yellow-500 dark:border-yellow-400",
      iconBg: "bg-yellow-100 dark:bg-yellow-900",
      iconColor: "text-yellow-500 dark:text-yellow-400"
    },
    red: {
      border: "border-red-500 dark:border-red-400",
      iconBg: "bg-red-100 dark:bg-red-900",
      iconColor: "text-red-500 dark:text-red-400"
    }
  };

  return (
    <Card className={cn("border-l-4 transition-colors duration-200", colorClasses[color].border)}>
      <CardContent className="p-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          </div>
          <div className={cn("p-3 rounded-full", colorClasses[color].iconBg)}>
            <Icon className={cn("h-5 w-5", colorClasses[color].iconColor)} />
          </div>
        </div>
        
        {change && (
          <div className="mt-4">
            <span className={cn(
              "text-xs font-semibold",
              change.value >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {change.value >= 0 ? 
                <span>↑ {change.value}% </span> : 
                <span>↓ {Math.abs(change.value)}% </span>
              }
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{change.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
