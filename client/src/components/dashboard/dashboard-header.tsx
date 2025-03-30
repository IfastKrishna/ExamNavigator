import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({
  heading,
  text,
  children,
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn("flex flex-col items-start gap-2 px-2", className)}>
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {heading}
        </h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  );
}